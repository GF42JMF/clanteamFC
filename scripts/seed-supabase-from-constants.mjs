import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { Client } from 'pg';

const ROOT = process.cwd();
const CONSTANTS_PATH = path.join(ROOT, 'src', 'constants.ts');

function normalizeName(name) {
  return (name || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function extractPasswordCandidates(rawUrl) {
  const candidates = [rawUrl];
  const bracketPasswordMatch = rawUrl.match(/:\/\/([^:/?#]+):\[([^\]]+)\]@/);

  if (bracketPasswordMatch) {
    const bracketed = `:[${bracketPasswordMatch[2]}]@`;
    const plain = `:${bracketPasswordMatch[2]}@`;
    const encoded = `:${encodeURIComponent(bracketPasswordMatch[2])}@`;
    candidates.push(rawUrl.replace(bracketed, plain));
    candidates.push(rawUrl.replace(bracketed, encoded));
  }

  return [...new Set(candidates)];
}

async function connectWithFallbacks(rawUrl) {
  const candidates = extractPasswordCandidates(rawUrl);
  let lastError = null;

  for (const candidate of candidates) {
    const client = new Client({
      connectionString: candidate,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => {});
    }
  }

  throw lastError;
}

async function loadConstantsData() {
  const rawTs = await fs.readFile(CONSTANTS_PATH, 'utf8');
  const transpiled = ts.transpileModule(rawTs, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      preserveValueImports: false,
    },
  }).outputText;

  const moduleRef = { exports: {} };
  const sandbox = {
    module: moduleRef,
    exports: moduleRef.exports,
    require: () => ({}),
    console,
    process,
  };

  vm.createContext(sandbox);
  vm.runInContext(transpiled, sandbox, { filename: 'constants.js' });

  const { INITIAL_PLAYERS, MATCH_HISTORY } = sandbox.module.exports;
  if (!Array.isArray(INITIAL_PLAYERS) || !Array.isArray(MATCH_HISTORY)) {
    throw new Error('No se pudieron leer INITIAL_PLAYERS o MATCH_HISTORY desde src/constants.ts');
  }

  return { players: INITIAL_PLAYERS, matches: MATCH_HISTORY };
}

async function ensureSchema(client) {
  await client.query(`
    create table if not exists public.players (
      id text primary key,
      name text not null,
      age integer not null check (age >= 0),
      phone text,
      jersey_number integer not null,
      position text not null check (position in ('GK', 'DEF', 'MID', 'FWD')),
      positions text[] not null default '{}',
      image text,
      stats_matches integer not null default 0,
      stats_goals integer not null default 0,
      stats_assists integer not null default 0,
      stats_mvp integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await client.query(`
    create table if not exists public.matches (
      id text primary key,
      opponent text not null,
      match_date date not null,
      result text not null,
      win boolean not null default false,
      location text not null,
      mvp_name text,
      mvp_player_id text references public.players(id) on delete set null,
      vote_close_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await client.query(`
    create table if not exists public.match_scorers (
      id bigserial primary key,
      match_id text not null references public.matches(id) on delete cascade,
      player_id text references public.players(id) on delete set null,
      player_name text not null,
      goals integer not null check (goals > 0),
      created_at timestamptz not null default now(),
      unique(match_id, player_name)
    );
  `);

  await client.query(`
    create table if not exists public.match_media (
      id bigserial primary key,
      match_id text not null references public.matches(id) on delete cascade,
      url text not null,
      title text,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      unique(match_id, url)
    );
  `);

  await client.query(`
    create table if not exists public.match_mvp_eligible_players (
      match_id text not null references public.matches(id) on delete cascade,
      player_id text not null references public.players(id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (match_id, player_id)
    );
  `);

  await client.query(`
    create table if not exists public.match_mvp_votes (
      id bigserial primary key,
      match_id text not null references public.matches(id) on delete cascade,
      voter_user_id text not null,
      voted_player_id text not null references public.players(id) on delete cascade,
      created_at timestamptz not null default now(),
      unique(match_id, voter_user_id)
    );
  `);

  await client.query(`
    alter table public.match_mvp_votes
    alter column voter_user_id type text using voter_user_id::text;
  `);

  await client.query(`
    create index if not exists idx_matches_date on public.matches(match_date desc);
  `);

  await client.query(`
    create index if not exists idx_match_scorers_match on public.match_scorers(match_id);
  `);

  await client.query(`
    create index if not exists idx_match_media_match on public.match_media(match_id);
  `);

  await client.query(`
    create index if not exists idx_mvp_votes_match on public.match_mvp_votes(match_id);
  `);
}

async function upsertPlayers(client, players) {
  for (const player of players) {
    await client.query(
      `
      insert into public.players (
        id, name, age, phone, jersey_number, position, positions, image,
        stats_matches, stats_goals, stats_assists, stats_mvp, updated_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7::text[], $8, $9, $10, $11, $12, now()
      )
      on conflict (id) do update set
        name = excluded.name,
        age = excluded.age,
        phone = excluded.phone,
        jersey_number = excluded.jersey_number,
        position = excluded.position,
        positions = excluded.positions,
        image = excluded.image,
        stats_matches = excluded.stats_matches,
        stats_goals = excluded.stats_goals,
        stats_assists = excluded.stats_assists,
        stats_mvp = excluded.stats_mvp,
        updated_at = now();
      `,
      [
        String(player.id),
        player.name,
        Number(player.age || 0),
        player.phone || null,
        Number(player.jerseyNumber || 0),
        player.position,
        Array.isArray(player.positions) ? player.positions : [],
        player.image || null,
        Number(player.stats?.matches || 0),
        Number(player.stats?.goals || 0),
        Number(player.stats?.assists || 0),
        Number(player.stats?.mvp || 0),
      ]
    );
  }
}

async function upsertMatchesAndChildren(client, matches, players) {
  const playersByName = new Map();
  for (const player of players) {
    playersByName.set(normalizeName(player.name), String(player.id));
  }

  let scorersCount = 0;
  let mediaCount = 0;
  let eligibleCount = 0;

  for (const match of matches) {
    const mvpPlayerId = playersByName.get(normalizeName(match.mvp || '')) || null;

    await client.query(
      `
      insert into public.matches (
        id, opponent, match_date, result, win, location, mvp_name, mvp_player_id, vote_close_at, updated_at
      ) values (
        $1, $2, $3::date, $4, $5, $6, $7, $8, $9::timestamptz, now()
      )
      on conflict (id) do update set
        opponent = excluded.opponent,
        match_date = excluded.match_date,
        result = excluded.result,
        win = excluded.win,
        location = excluded.location,
        mvp_name = excluded.mvp_name,
        mvp_player_id = excluded.mvp_player_id,
        vote_close_at = excluded.vote_close_at,
        updated_at = now();
      `,
      [
        String(match.id),
        match.opponent || '',
        match.date,
        match.result || '',
        Boolean(match.win),
        match.location || '',
        match.mvp || null,
        mvpPlayerId,
        match.voteCloseAt || null,
      ]
    );

    await client.query(`delete from public.match_scorers where match_id = $1;`, [String(match.id)]);
    await client.query(`delete from public.match_media where match_id = $1;`, [String(match.id)]);
    await client.query(`delete from public.match_mvp_eligible_players where match_id = $1;`, [String(match.id)]);

    const scorers = Array.isArray(match.scorers) ? match.scorers : [];
    for (const scorer of scorers) {
      const scorerPlayerId = playersByName.get(normalizeName(scorer.playerName || '')) || null;
      await client.query(
        `
        insert into public.match_scorers (match_id, player_id, player_name, goals)
        values ($1, $2, $3, $4);
        `,
        [
          String(match.id),
          scorerPlayerId,
          scorer.playerName || 'Desconocido',
          Number(scorer.goals || 1),
        ]
      );
      scorersCount += 1;
    }

    const images = Array.isArray(match.images) ? match.images : [];
    for (let i = 0; i < images.length; i += 1) {
      await client.query(
        `
        insert into public.match_media (match_id, url, title, sort_order)
        values ($1, $2, $3, $4)
        on conflict (match_id, url) do update set
          title = excluded.title,
          sort_order = excluded.sort_order;
        `,
        [
          String(match.id),
          images[i],
          `Foto ${i + 1} - ${match.opponent}`,
          i,
        ]
      );
      mediaCount += 1;
    }

    const eligiblePlayers = Array.isArray(match.eligiblePlayerIds) ? match.eligiblePlayerIds : [];
    for (const playerId of eligiblePlayers) {
      await client.query(
        `
        insert into public.match_mvp_eligible_players (match_id, player_id)
        values ($1, $2)
        on conflict (match_id, player_id) do nothing;
        `,
        [String(match.id), String(playerId)]
      );
      eligibleCount += 1;
    }
  }

  return { scorersCount, mediaCount, eligibleCount };
}

async function main() {
  const rawDbUrl = process.env.SUPABASE_DB_URL;
  if (!rawDbUrl) {
    throw new Error('Falta SUPABASE_DB_URL en variables de entorno.');
  }

  const { players, matches } = await loadConstantsData();
  const client = await connectWithFallbacks(rawDbUrl);

  try {
    await client.query('begin');
    await ensureSchema(client);
    await upsertPlayers(client, players);
    const childCounts = await upsertMatchesAndChildren(client, matches, players);
    await client.query('commit');

    console.log('Schema + seed completados.');
    console.log(`Players: ${players.length}`);
    console.log(`Matches: ${matches.length}`);
    console.log(`Scorers: ${childCounts.scorersCount}`);
    console.log(`Match media: ${childCounts.mediaCount}`);
    console.log(`MVP eligible rows: ${childCounts.eligibleCount}`);
    console.log('MVP votes: 0 (constants no trae votos iniciales).');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Error en seed:', error.message || error);
  process.exit(1);
});

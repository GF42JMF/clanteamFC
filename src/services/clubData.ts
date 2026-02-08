import { MATCH_HISTORY, MATCHES_STORAGE_KEY, INITIAL_PLAYERS } from '../constants';
import { Match, Player } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface PlayerRow {
  id: string;
  name: string;
  age: number;
  phone: string | null;
  jersey_number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  positions: string[] | null;
  image: string | null;
  stats_matches: number | null;
  stats_goals: number | null;
  stats_assists: number | null;
  stats_mvp: number | null;
}

interface MatchRow {
  id: string;
  opponent: string;
  match_date: string;
  result: string;
  win: boolean;
  location: string;
  mvp_name: string | null;
  vote_close_at: string | null;
}

interface MatchScorerRow {
  match_id: string;
  player_name: string;
  goals: number;
}

interface MatchMediaRow {
  match_id: string;
  url: string;
  sort_order: number;
}

interface MatchEligibleRow {
  match_id: string;
  player_id: string;
}

interface MatchVoteRow {
  match_id: string;
  voter_user_id: string;
  voted_player_id: string;
}

const logError = (context: string, error: unknown) => {
  console.error(`[Supabase:${context}]`, error);
};

const isClientAvailable = () => isSupabaseConfigured && !!supabase;

const byDateDesc = (a: Match, b: Match) => b.date.localeCompare(a.date);

const mergeById = <T extends { id: string }>(primary: T[], secondary: T[]): T[] => {
  const map = new Map<string, T>();
  for (const row of secondary) map.set(row.id, row);
  for (const row of primary) map.set(row.id, row);
  return [...map.values()];
};

export const getLocalMatches = (): Match[] => {
  const saved = localStorage.getItem(MATCHES_STORAGE_KEY);
  if (!saved) return MATCH_HISTORY;

  try {
    const parsed = JSON.parse(saved) as Match[];
    return Array.isArray(parsed) ? parsed : MATCH_HISTORY;
  } catch (error) {
    console.error('No se pudo leer localStorage de partidos.', error);
    return MATCH_HISTORY;
  }
};

export const setLocalMatches = (matches: Match[]) => {
  localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
};

const mapPlayerRow = (row: PlayerRow): Player => ({
  id: row.id,
  name: row.name,
  age: Number(row.age || 0),
  phone: row.phone || '',
  jerseyNumber: Number(row.jersey_number || 0),
  position: row.position,
  positions: Array.isArray(row.positions) ? row.positions : [],
  image: row.image || undefined,
  stats: {
    matches: Number(row.stats_matches || 0),
    goals: Number(row.stats_goals || 0),
    assists: Number(row.stats_assists || 0),
    mvp: Number(row.stats_mvp || 0),
  },
});

export const fetchPlayers = async (): Promise<Player[]> => {
  if (!isClientAvailable()) return INITIAL_PLAYERS;

  const { data, error } = await supabase!
    .from('players')
    .select('*')
    .order('jersey_number', { ascending: true });

  if (error) {
    logError('fetchPlayers', error);
    return INITIAL_PLAYERS;
  }

  const remotePlayers = ((data || []) as PlayerRow[]).map(mapPlayerRow);
  if (remotePlayers.length === 0) return INITIAL_PLAYERS;

  return remotePlayers.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
};

const fetchMatchesRemote = async (): Promise<Match[] | null> => {
  if (!isClientAvailable()) return null;

  const { data: matchData, error: matchError } = await supabase!
    .from('matches')
    .select('id, opponent, match_date, result, win, location, mvp_name, vote_close_at')
    .order('match_date', { ascending: false });

  if (matchError) {
    logError('fetchMatches:matches', matchError);
    return null;
  }

  const matches = (matchData || []) as MatchRow[];
  if (matches.length === 0) return [];

  const matchIds = matches.map((match) => match.id);

  const [scorerRes, mediaRes, eligibleRes, votesRes] = await Promise.all([
    supabase!.from('match_scorers').select('match_id, player_name, goals').in('match_id', matchIds),
    supabase!.from('match_media').select('match_id, url, sort_order').in('match_id', matchIds),
    supabase!.from('match_mvp_eligible_players').select('match_id, player_id').in('match_id', matchIds),
    supabase!.from('match_mvp_votes').select('match_id, voter_user_id, voted_player_id').in('match_id', matchIds),
  ]);

  if (scorerRes.error) {
    logError('fetchMatches:scorers', scorerRes.error);
    return null;
  }
  if (mediaRes.error) {
    logError('fetchMatches:media', mediaRes.error);
    return null;
  }
  if (eligibleRes.error) {
    logError('fetchMatches:eligible', eligibleRes.error);
    return null;
  }
  if (votesRes.error) {
    logError('fetchMatches:votes', votesRes.error);
    return null;
  }

  const scorers = (scorerRes.data || []) as MatchScorerRow[];
  const media = (mediaRes.data || []) as MatchMediaRow[];
  const eligibleRows = (eligibleRes.data || []) as MatchEligibleRow[];
  const votes = (votesRes.data || []) as MatchVoteRow[];

  const scorersByMatch = new Map<string, Array<{ playerName: string; goals: number }>>();
  for (const scorer of scorers) {
    const list = scorersByMatch.get(scorer.match_id) || [];
    list.push({ playerName: scorer.player_name, goals: scorer.goals });
    scorersByMatch.set(scorer.match_id, list);
  }

  const mediaByMatch = new Map<string, string[]>();
  for (const row of media.sort((a, b) => a.sort_order - b.sort_order)) {
    const list = mediaByMatch.get(row.match_id) || [];
    list.push(row.url);
    mediaByMatch.set(row.match_id, list);
  }

  const eligibleByMatch = new Map<string, string[]>();
  for (const row of eligibleRows) {
    const list = eligibleByMatch.get(row.match_id) || [];
    list.push(row.player_id);
    eligibleByMatch.set(row.match_id, list);
  }

  const votedByByMatch = new Map<string, string[]>();
  const votesByMatch = new Map<string, Record<string, number>>();
  for (const vote of votes) {
    const votedBy = votedByByMatch.get(vote.match_id) || [];
    votedBy.push(vote.voter_user_id);
    votedByByMatch.set(vote.match_id, votedBy);

    const voteTotals = votesByMatch.get(vote.match_id) || {};
    voteTotals[vote.voted_player_id] = (voteTotals[vote.voted_player_id] || 0) + 1;
    votesByMatch.set(vote.match_id, voteTotals);
  }

  const normalized = matches.map((match): Match => ({
    id: match.id,
    opponent: match.opponent,
    date: match.match_date,
    result: match.result,
    win: match.win,
    scorers: scorersByMatch.get(match.id) || [],
    location: match.location,
    mvp: match.mvp_name || '',
    images: mediaByMatch.get(match.id) || [],
    eligiblePlayerIds: eligibleByMatch.get(match.id) || [],
    voteCloseAt: match.vote_close_at || undefined,
    votes: votesByMatch.get(match.id) || {},
    votedBy: votedByByMatch.get(match.id) || [],
  }));

  return normalized.sort(byDateDesc);
};

export const fetchMatches = async (): Promise<Match[]> => {
  const local = getLocalMatches();
  const remote = await fetchMatchesRemote();

  if (!remote) return local.sort(byDateDesc);
  const merged = mergeById(remote, local).sort(byDateDesc);
  setLocalMatches(merged);
  return merged;
};

export const upsertMatch = async (match: Match) => {
  if (!isClientAvailable()) return false;

  const { error: matchError } = await supabase!.from('matches').upsert({
    id: match.id,
    opponent: match.opponent,
    match_date: match.date,
    result: match.result,
    win: match.win,
    location: match.location,
    mvp_name: match.mvp || null,
    vote_close_at: match.voteCloseAt || null,
  });

  if (matchError) {
    logError('upsertMatch:match', matchError);
    return false;
  }

  const matchId = match.id;
  const scorers = Array.isArray(match.scorers) ? match.scorers : [];
  const images = Array.isArray(match.images) ? match.images : [];
  const eligiblePlayerIds = Array.isArray(match.eligiblePlayerIds) ? match.eligiblePlayerIds : [];

  const { error: scorerDeleteError } = await supabase!.from('match_scorers').delete().eq('match_id', matchId);
  if (scorerDeleteError) {
    logError('upsertMatch:deleteScorers', scorerDeleteError);
    return false;
  }

  const { error: mediaDeleteError } = await supabase!.from('match_media').delete().eq('match_id', matchId);
  if (mediaDeleteError) {
    logError('upsertMatch:deleteMedia', mediaDeleteError);
    return false;
  }

  const { error: eligibleDeleteError } = await supabase!
    .from('match_mvp_eligible_players')
    .delete()
    .eq('match_id', matchId);
  if (eligibleDeleteError) {
    logError('upsertMatch:deleteEligible', eligibleDeleteError);
    return false;
  }

  if (scorers.length > 0) {
    const rows = scorers.map((scorer) => ({
      match_id: matchId,
      player_name: scorer.playerName,
      goals: scorer.goals,
    }));
    const { error } = await supabase!.from('match_scorers').insert(rows);
    if (error) {
      logError('upsertMatch:insertScorers', error);
      return false;
    }
  }

  if (images.length > 0) {
    const rows = images.map((url, index) => ({
      match_id: matchId,
      url,
      sort_order: index,
      title: `Foto ${index + 1}`,
    }));
    const { error } = await supabase!.from('match_media').insert(rows);
    if (error) {
      logError('upsertMatch:insertMedia', error);
      return false;
    }
  }

  if (eligiblePlayerIds.length > 0) {
    const rows = eligiblePlayerIds.map((playerId) => ({ match_id: matchId, player_id: playerId }));
    const { error } = await supabase!.from('match_mvp_eligible_players').insert(rows);
    if (error) {
      logError('upsertMatch:insertEligible', error);
      return false;
    }
  }

  return true;
};

export const deleteMatch = async (matchId: string) => {
  if (!isClientAvailable()) return false;

  const { error } = await supabase!.from('matches').delete().eq('id', matchId);
  if (error) {
    logError('deleteMatch', error);
    return false;
  }

  return true;
};

export const castMvpVote = async (params: {
  matchId: string;
  voterUserId: string;
  votedPlayerId: string;
}): Promise<'ok' | 'duplicate' | 'fallback'> => {
  if (!isClientAvailable()) return 'fallback';

  const { error } = await supabase!.from('match_mvp_votes').insert({
    match_id: params.matchId,
    voter_user_id: params.voterUserId,
    voted_player_id: params.votedPlayerId,
  });

  if (!error) return 'ok';
  if (error.code === '23505') return 'duplicate';

  logError('castMvpVote', error);
  return 'fallback';
};

export const deletePlayer = async (playerId: string) => {
  if (!isClientAvailable()) return false;

  const { error } = await supabase!.from('players').delete().eq('id', playerId);
  if (error) {
    logError('deletePlayer', error);
    return false;
  }

  return true;
};

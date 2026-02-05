



import React, { useMemo, useState } from 'react';
import { MATCHES_STORAGE_KEY, MATCH_HISTORY } from '../constants';
import { Match, Player, UserAccount, UserRole } from '../types';
import { Trophy, Timer } from 'lucide-react';

interface MVPSectionProps {
  role: UserRole;
  currentUser: UserAccount | null;
  players: Player[];
}

const MVPSection: React.FC<MVPSectionProps> = ({ role, currentUser, players }) => {
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem(MATCHES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as Match[];
      } catch (err) {
        console.error('No se pudo leer los partidos.', err);
      }
    }
    return MATCH_HISTORY;
  });

  const lastMatch = useMemo(() => {
    if (matches.length === 0) return null;
    return [...matches].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [matches]);

  const eligibleIds = lastMatch?.eligiblePlayerIds || [];
  const eligiblePlayers = players.filter((player) => eligibleIds.includes(player.id));
  const voteCloseAt = lastMatch?.voteCloseAt ? new Date(lastMatch.voteCloseAt) : null;
  const isOpen = voteCloseAt ? Date.now() < voteCloseAt.getTime() : false;
  const remainingMs = voteCloseAt ? Math.max(0, voteCloseAt.getTime() - Date.now()) : 0;
  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const displayMinutes = remainingMinutes % 60;

  const currentUserId = currentUser?.id || '';
  const currentPlayerId = currentUser?.playerId || '';
  const hasVoted = !!lastMatch?.votedBy?.includes(currentUserId);
  const canVote =
    role !== 'public' &&
    !!currentPlayerId &&
    eligibleIds.includes(currentPlayerId) &&
    !!lastMatch &&
    isOpen &&
    !hasVoted;

  const handleVote = (playerId: string) => {
    if (!lastMatch || !currentUserId) return;

    const updatedMatches = matches.map((match) => {
      if (match.id !== lastMatch.id) return match;

      const votes = { ...(match.votes || {}) };
      votes[playerId] = (votes[playerId] || 0) + 1;

      const votedBy = [...(match.votedBy || []), currentUserId];

      return {
        ...match,
        votes,
        votedBy
      };
    });

    setMatches(updatedMatches);
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(updatedMatches));
  };

  const results = useMemo(() => {
    if (!lastMatch) return [] as Array<{ player: Player; votes: number }>;
    const votes = lastMatch.votes || {};
    return eligiblePlayers
      .map((player) => ({ player, votes: votes[player.id] || 0 }))
      .sort((a, b) => b.votes - a.votes);
  }, [lastMatch, eligiblePlayers]);

  return (
    <section className="bg-[#050505] py-24 px-4" id="mvp-section">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-clan-gold" size={36} />
          <h2 className="font-display text-5xl text-white uppercase">MVP del Partido</h2>
        </div>

        {!lastMatch && (
          <div className="text-gray-500">Todavia no hay partidos cargados.</div>
        )}

        {lastMatch && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500">Ultimo partido</div>
                <div className="font-display text-2xl text-white uppercase">
                  Clan Team vs {lastMatch.opponent}
                </div>
                <div className="text-gray-500 text-xs mt-1">{lastMatch.date}</div>
              </div>

              {voteCloseAt && (
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400">
                  <Timer size={14} />
                  {isOpen
                    ? `Cierra en ${remainingHours}h ${displayMinutes}m`
                    : 'Votacion cerrada'}
                </div>
              )}
            </div>

            {eligiblePlayers.length === 0 && (
              <div className="mt-6 text-sm text-gray-500">
                El admin todavia no definio los jugadores habilitados para votar.
              </div>
            )}

            {role === 'public' && (
              <div className="mt-6 text-sm text-gray-500">
                Accede con tu usuario para poder votar.
              </div>
            )}

            {role !== 'public' && !currentPlayerId && (
              <div className="mt-6 text-sm text-gray-500">
                El admin debe asignarte un jugador para habilitar tu voto.
              </div>
            )}

            {eligiblePlayers.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {eligiblePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleVote(player.id)}
                    disabled={!canVote}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      canVote
                        ? 'bg-black/40 border-white/10 hover:border-clan-magenta hover:bg-white/5'
                        : 'bg-black/20 border-white/5 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                      <img src={player.image || ''} alt={player.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-bold">{player.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">#{player.jerseyNumber}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {hasVoted && (
              <div className="mt-6 text-green-400 text-xs uppercase tracking-widest">
                Tu voto ya fue registrado.
              </div>
            )}

            {eligiblePlayers.length > 0 && (
              <div className="mt-10">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Resultados</div>
                <div className="space-y-3">
                  {results.map(({ player, votes }) => (
                    <div key={player.id} className="flex items-center gap-3">
                      <div className="w-32 text-xs text-gray-300 truncate">{player.name}</div>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-clan-magenta"
                          style={{ width: `${Math.min(100, votes * 10)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-400 w-8 text-right">{votes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default MVPSection;

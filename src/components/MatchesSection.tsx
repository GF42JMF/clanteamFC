import React, { useMemo, useState } from 'react';
import { Match, Player, UserRole } from '../types';
import { MapPin, Trophy, ArrowRight, Plus, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';

interface MatchesSectionProps {
  role: UserRole;
  players: Player[];
  matches: Match[];
  onSaveMatch: (match: Match) => Promise<void>;
  onDeleteMatch: (matchId: string) => Promise<void>;
}

const MatchesSection: React.FC<MatchesSectionProps> = ({ role, players, matches, onSaveMatch, onDeleteMatch }) => {
  const [formError, setFormError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [result, setResult] = useState('');
  const [location, setLocation] = useState('');
  const [mvp, setMvp] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [eligiblePlayerIds, setEligiblePlayerIds] = useState<string[]>([]);
  const [voteHours, setVoteHours] = useState('2');
  const [voteMinutes, setVoteMinutes] = useState('30');
  const [openMatchId, setOpenMatchId] = useState<string | null>(null);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => b.date.localeCompare(a.date));
  }, [matches]);

  const getOutcome = (resultValue: string) => {
    const [homeRaw, awayRaw] = resultValue.split('-').map((score) => score.trim());
    const home = Number.parseInt(homeRaw, 10);
    const away = Number.parseInt(awayRaw, 10);
    if (!Number.isFinite(home) || !Number.isFinite(away)) return 'Empate';
    if (home > away) return 'Victoria';
    if (home < away) return 'Derrota';
    return 'Empate';
  };

  const resetForm = () => {
    setOpponent('');
    setDate('');
    setResult('');
    setLocation('');
    setMvp('');
    setImagesText('');
    setEligiblePlayerIds([]);
    setVoteHours('2');
    setVoteMinutes('30');
    setFormError('');
    setEditingId(null);
  };

  const handleAddOrEditMatch = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!opponent || !date || !result || !location) {
      setFormError('Completa rival, fecha, resultado y lugar.');
      return;
    }

    const outcome = getOutcome(result);
    const isWin = outcome === 'Victoria';

    const images = imagesText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const hours = Math.max(0, Number.parseInt(voteHours || '0', 10));
    const minutes = Math.max(0, Number.parseInt(voteMinutes || '0', 10));
    const closeAt = new Date(Date.now() + (hours * 60 + minutes) * 60 * 1000).toISOString();

    const editingMatch = editingId ? matches.find((entry) => entry.id === editingId) : null;

    const nextMatch: Match = editingMatch
      ? {
          ...editingMatch,
          opponent,
          date,
          result,
          win: isWin,
          location,
          mvp: mvp || '',
          images,
          eligiblePlayerIds,
          voteCloseAt: closeAt
        }
      : {
          id: `m-${Date.now()}`,
          opponent,
          date,
          result,
          win: isWin,
          scorers: [],
          location,
          mvp: mvp || '',
          images,
          eligiblePlayerIds,
          voteCloseAt: closeAt,
          votes: {},
          votedBy: []
        };

    try {
      await onSaveMatch(nextMatch);
    } catch (error) {
      console.error('No se pudo guardar el partido.', error);
      setFormError('No se pudo guardar el partido. Reintenta.');
      return;
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEditMatch = (match: Match) => {
    setEditingId(match.id);
    setOpponent(match.opponent);
    setDate(match.date);
    setResult(match.result);
    setLocation(match.location);
    setMvp(match.mvp || '');
    setImagesText((match.images || []).join(', '));
    setEligiblePlayerIds(match.eligiblePlayerIds || []);
    setVoteHours('2');
    setVoteMinutes('30');
    setIsOpen(true);
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('¿Eliminar este partido?')) return;
    try {
      await onDeleteMatch(matchId);
    } catch (error) {
      console.error('No se pudo eliminar el partido.', error);
    }
  };

  return (
    <div className="bg-[#050505] py-24 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
         <div className="flex flex-col gap-6 mb-12 border-b border-white/10 pb-6">
             <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
               <h2 className="font-display text-4xl md:text-5xl text-white uppercase leading-none">
                 Resultados <span className="text-clan-magenta">Recientes</span>
               </h2>
               <button className="hidden md:flex items-center gap-2 text-clan-magenta font-bold uppercase tracking-[0.16em] text-sm hover:text-white transition-colors">
                  Ver Calendario Completo <ArrowRight size={16}/>
               </button>
             </div>

             <div className="flex flex-wrap items-center gap-4">
               {role === 'admin' && (
                 <button
                   onClick={() => { setIsOpen((prev) => !prev); if (isOpen) resetForm(); }}
                   className="inline-flex items-center gap-2 bg-clan-magenta text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-pink-700 transition-colors"
                 >
                   <Plus size={14} /> {editingId ? 'Editar partido' : 'Agregar partido'}
                 </button>
               )}
             </div>
         </div>

         {role === 'admin' && isOpen && (
           <form onSubmit={handleAddOrEditMatch} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 mb-10 shadow-xl">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Rival</label>
                 <input
                   value={opponent}
                   onChange={(event) => setOpponent(event.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                   placeholder="Ej: Real Banil"
                 />
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Fecha</label>
                 <input
                   type="date"
                   value={date}
                   onChange={(event) => setDate(event.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                 />
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Resultado</label>
                 <input
                   value={result}
                   onChange={(event) => setResult(event.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                   placeholder="Ej: 2 - 1"
                 />
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Lugar</label>
                 <input
                   value={location}
                   onChange={(event) => setLocation(event.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                   placeholder="Ej: Complejo Deportivo"
                 />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">MVP (opcional)</label>
                 <input
                   value={mvp}
                   onChange={(event) => setMvp(event.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                   placeholder="Ej: Julian Rocha"
                 />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Fotos del partido (URLs separadas por coma)</label>
                 <input
                   value={imagesText}
                   onChange={(event) => setImagesText(event.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                   placeholder="https://... , https://..."
                 />
               </div>
             </div>

             <div className="mt-6">
               <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Jugadores habilitados para votar MVP</div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                 {players.map((player) => (
                   <label key={player.id} className="flex items-center gap-2 text-xs text-gray-300 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                     <input
                       type="checkbox"
                       checked={eligiblePlayerIds.includes(player.id)}
                       onChange={(event) => {
                         setEligiblePlayerIds((prev) =>
                           event.target.checked
                             ? [...prev, player.id]
                             : prev.filter((id) => id !== player.id)
                         );
                       }}
                     />
                     <span>{player.name}</span>
                   </label>
                 ))}
               </div>
             </div>

             <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Cierre de votacion (horas)</label>
                 <input
                   value={voteHours}
                   onChange={(event) => setVoteHours(event.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                 />
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Cierre de votacion (minutos)</label>
                 <input
                   value={voteMinutes}
                   onChange={(event) => setVoteMinutes(event.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                 />
               </div>
             </div>

             {formError && (
               <div className="text-xs text-red-400 mt-4">{formError}</div>
             )}
             <div className="flex flex-wrap gap-3 mt-6">
               <button
                 type="submit"
                 className="px-6 py-2 bg-clan-magenta text-white rounded-full text-xs uppercase tracking-widest font-bold hover:bg-pink-700 transition-colors"
               >
                 {editingId ? 'Guardar cambios' : 'Guardar partido'}
               </button>
               <button
                 type="button"
                 onClick={() => { resetForm(); setIsOpen(false); }}
                 className="px-6 py-2 border border-white/10 text-gray-400 rounded-full text-xs uppercase tracking-widest font-bold hover:text-white hover:border-white/30 transition-colors"
               >
                 Cancelar
               </button>
             </div>
           </form>
         )}

         <div className="grid gap-6">
           {sortedMatches.map((match) => {
             const images = match.images || [];
             const isOpenMatch = openMatchId === match.id;
             const outcome = getOutcome(match.result);
             const [homeScore = '0', awayScore = '0'] = match.result.split('-').map((score) => score.trim());

             return (
               <div key={match.id} className="group bg-[#0a0a0a] hover:bg-[#111] border-l-[6px] border-clan-magenta p-0 flex flex-col shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(194,24,91,0.1)]">
                 <div className="flex flex-col md:flex-row md:items-stretch">
                   {/* Date - Desktop */}
                   <div className="hidden md:flex p-5 w-44 bg-[#141519] flex-col justify-center items-center text-center border-r border-white/5 group-hover:bg-[#1a1b21] transition-colors">
                      <span className="text-3xl font-display text-white font-bold leading-none">{match.date.split('-')[2]}</span>
                      <span className="text-clan-magenta font-bold uppercase text-xs tracking-[0.15em] leading-none mt-2">{match.date.split('-')[1]} / {match.date.split('-')[0]}</span>
                      <span className="text-gray-500 text-xs mt-3 uppercase flex items-center gap-1 justify-center">
                        <MapPin size={10}/> {match.location}
                      </span>
                   </div>

                   {/* Mobile Date Header */}
                   <div className="md:hidden flex justify-between items-center bg-white/5 p-2 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                      <span>{match.date}</span>
                      <span>{match.location}</span>
                   </div>

                   {/* Match Details */}
                   <div className="flex-1 p-4 md:px-7 md:py-5 bg-[#090b0f] flex flex-col gap-3 justify-center">
                     {/* Mobile */}
                     <div className="md:hidden flex flex-row items-center justify-between gap-4">
                       <div className="flex-1">
                         <h3 className="font-display text-xl text-white uppercase tracking-wide leading-none truncate">
                           Clan Team <span className="text-gray-500">vs</span> {match.opponent}
                         </h3>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                         <div className="w-10 h-8 bg-black border border-white/10 rounded flex items-center justify-center font-display text-2xl text-white shadow-inner">
                            {homeScore}
                         </div>
                         <span className="text-gray-600 font-display text-xl">-</span>
                         <div className="w-10 h-8 bg-black border border-white/10 rounded flex items-center justify-center font-display text-2xl text-gray-400 shadow-inner">
                            {awayScore}
                         </div>
                       </div>
                     </div>

                     {/* Desktop format */}
                     <div className="hidden md:flex items-center justify-center gap-8 xl:gap-10 min-h-[84px]">
                       <div className="text-right">
                         <div className="font-display text-3xl lg:text-4xl text-white uppercase leading-none">Clan Team</div>
                         <div className="text-gray-500 text-sm uppercase tracking-[0.14em] leading-none mt-2">Local</div>
                       </div>
                       <div className="flex items-center gap-3 lg:gap-5">
                         <div className="w-14 h-16 lg:w-[62px] lg:h-[70px] bg-black border border-white/10 rounded flex items-center justify-center font-display text-3xl lg:text-4xl text-white shadow-inner">
                           {homeScore}
                         </div>
                         <span className="text-gray-600 font-display text-2xl">-</span>
                         <div className="w-14 h-16 lg:w-[62px] lg:h-[70px] bg-black border border-white/10 rounded flex items-center justify-center font-display text-3xl lg:text-4xl text-gray-300 shadow-inner">
                           {awayScore}
                         </div>
                       </div>
                       <div className="text-left">
                         <div className="font-display text-3xl lg:text-4xl text-[#a7afbf] uppercase leading-none">{match.opponent}</div>
                         <div className="text-gray-500 text-sm uppercase tracking-[0.14em] leading-none mt-2">Visitante</div>
                       </div>
                     </div>

                     <div className="flex flex-wrap items-center gap-3 md:pt-1">
                       {images.length > 0 && (
                         <button
                           type="button"
                           onClick={() => setOpenMatchId(isOpenMatch ? null : match.id)}
                           className="inline-flex items-center gap-2 text-clan-magenta text-[10px] uppercase font-bold tracking-widest hover:text-white"
                         >
                           <ImageIcon size={12} /> Ver fotos ({images.length})
                         </button>
                       )}

                       {role === 'admin' && (
                         <div className="flex items-center gap-2">
                           <button
                             type="button"
                             onClick={() => handleEditMatch(match)}
                             className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-white/70 hover:text-white"
                           >
                             <Pencil size={12} /> Editar
                           </button>
                           <button
                             type="button"
                             onClick={() => handleDeleteMatch(match.id)}
                             className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-red-400 hover:text-red-300"
                           >
                             <Trash2 size={12} /> Eliminar
                           </button>
                         </div>
                       )}
                     </div>
                   </div>

                   {/* Outcome + MVP - Right side on desktop */}
                   <div className="md:w-36 border-t md:border-t-0 md:border-l border-white/5 bg-[#050505] p-3 md:p-4 flex md:flex-col items-start md:items-center justify-center gap-1">
                     <div className="w-full md:flex md:flex-col md:items-center">
                       {outcome === 'Victoria' && (
                         <span className="inline-flex md:w-full md:justify-center px-3 py-1 bg-green-500/10 text-green-500 text-[11px] font-bold uppercase rounded border border-green-500/20">Victoria</span>
                       )}
                       {outcome === 'Empate' && (
                         <span className="inline-flex md:w-full md:justify-center px-3 py-1 bg-yellow-500/10 text-yellow-400 text-[11px] font-bold uppercase rounded border border-yellow-500/20">Empate</span>
                       )}
                       {outcome === 'Derrota' && (
                         <span className="inline-flex md:w-full md:justify-center px-3 py-1 bg-red-500/10 text-red-500 text-[11px] font-bold uppercase rounded border border-red-500/20">Derrota</span>
                       )}
                     </div>

                     {match.mvp && (
                       <div className="w-full md:mt-1 text-[11px] text-gray-400 md:text-center leading-tight">
                         <div className="flex items-center gap-2 md:justify-center text-clan-gold mb-1">
                           <Trophy size={12} />
                           <span className="uppercase tracking-widest text-gray-500">MVP</span>
                         </div>
                         <div className="text-white font-bold">{match.mvp}</div>
                       </div>
                     )}
                   </div>
                 </div>

                 {images.length > 0 && isOpenMatch && (
                   <div className="border-t border-white/10 bg-[#070707] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                     {images.map((url, index) => (
                       <div key={`${match.id}-img-${index}`} className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                         <img src={url} alt={`foto-${index}`} className="w-full h-48 object-cover" />
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             );
           })}
         </div>
      </div>
    </div>
  );
};

export default MatchesSection;

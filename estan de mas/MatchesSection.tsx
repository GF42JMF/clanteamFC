import React, { useEffect, useMemo, useState } from 'react';
import { MATCH_HISTORY, MATCHES_STORAGE_KEY } from '../constants';
import { Match, Player, UserRole } from '../types';
import { MapPin, Trophy, ArrowRight, Plus, Image as ImageIcon } from 'lucide-react';

interface MatchesSectionProps {
  role: UserRole;
  players: Player[];
}

const MatchesSection: React.FC<MatchesSectionProps> = ({ role, players }) => {
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem(MATCHES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as Match[];
      } catch (err) {
        console.error('No se pudo leer el historial de partidos.', err);
      }
    }
    return MATCH_HISTORY;
  });

  const [formError, setFormError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
  }, [matches]);

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
  };

  const handleAddMatch = (event: React.FormEvent) => {
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

    const newMatch: Match = {
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

    setMatches((prev) => [newMatch, ...prev]);
    resetForm();
    setIsOpen(false);
  };

  return (
    <div className="bg-[#050505] py-24 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
         <div className="flex flex-col gap-6 mb-12 border-b border-white/10 pb-6">
             <div>
               <h2 className="font-display text-6xl text-white uppercase">
                 Historial <span className="text-clan-magenta">De Partidos</span>
               </h2>
             </div>

             <div className="flex flex-wrap items-center gap-4">
               <button className="hidden md:flex items-center gap-2 text-clan-magenta font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
                  Ver Calendario Completo <ArrowRight size={16}/>
               </button>

               {role === 'admin' && (
                 <button
                   onClick={() => setIsOpen((prev) => !prev)}
                   className="inline-flex items-center gap-2 bg-clan-magenta text-white px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-pink-700 transition-colors"
                 >
                   <Plus size={14} /> Agregar partido
                 </button>
               )}
             </div>
         </div>

         {role === 'admin' && isOpen && (
           <form onSubmit={handleAddMatch} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 mb-10 shadow-xl">
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
                 Guardar partido
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

             return (
               <div key={match.id} className="group bg-[#0a0a0a] hover:bg-[#111] border-l-[6px] border-clan-magenta p-0 flex flex-col shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(194,24,91,0.1)]">
                 <div className="flex flex-col md:flex-row">
                   {/* Date - Desktop */}
                   <div className="hidden md:flex p-6 w-48 bg-white/5 flex-col justify-center items-center text-center border-r border-white/5 group-hover:bg-white/10 transition-colors">
                      <span className="text-3xl font-display text-white font-bold">{match.date.split('-')[2]}</span>
                      <span className="text-clan-magenta font-bold uppercase text-xs tracking-widest">{match.date.split('-')[1]} / {match.date.split('-')[0]}</span>
                      <span className="text-gray-500 text-[10px] mt-2 uppercase flex items-center gap-1 justify-center">
                        <MapPin size={10}/> {match.location}
                      </span>
                   </div>

                   {/* Mobile Date Header */}
                   <div className="md:hidden flex justify-between items-center bg-white/5 p-2 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                      <span>{match.date}</span>
                      <span>{match.location}</span>
                   </div>

                   {/* Match Details */}
                   <div className="flex-1 p-4 md:p-6 flex flex-col gap-3">
                     <div className="flex flex-row items-center justify-between gap-4">
                       <div className="flex-1">
                         <div className="text-[10px] uppercase tracking-widest text-gray-500">Partido</div>
                         <h3 className="font-display text-xl md:text-3xl text-white uppercase tracking-wide leading-none truncate">
                           Clan Team <span className="text-gray-500">vs</span> {match.opponent}
                         </h3>
                       </div>

                       {/* Score */}
                       <div className="flex items-center gap-2 md:gap-4 shrink-0">
                         <div className="w-10 h-8 md:w-16 md:h-12 bg-black border border-white/10 rounded flex items-center justify-center font-display text-2xl md:text-4xl text-white shadow-inner">
                            {match.result.split('-')[0].trim()}
                         </div>
                         <span className="text-gray-600 font-display text-xl md:text-2xl">-</span>
                         <div className="w-10 h-8 md:w-16 md:h-12 bg-black border border-white/10 rounded flex items-center justify-center font-display text-2xl md:text-4xl text-gray-400 shadow-inner">
                            {match.result.split('-')[1].trim()}
                         </div>
                       </div>
                     </div>

                     <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-gray-500">
                       <span>{match.date}</span>
                       <span>•</span>
                       <span>{match.location}</span>
                     </div>

                     <div className="flex flex-wrap items-center gap-3">
                       {getOutcome(match.result) === 'Victoria' && (
                         <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded border border-green-500/20">Victoria</span>
                       )}
                       {getOutcome(match.result) === 'Empate' && (
                         <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase rounded border border-yellow-500/20">Empate</span>
                       )}
                       {getOutcome(match.result) === 'Derrota' && (
                         <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded border border-red-500/20">Derrota</span>
                       )}

                       {match.mvp && (
                         <span className="flex items-center gap-2 text-[10px] text-gray-400">
                            <span className="text-clan-gold"><Trophy size={12}/></span>
                            MVP: <span className="text-white font-bold">{match.mvp}</span>
                         </span>
                       )}

                       {images.length > 0 && (
                         <button
                           type="button"
                           onClick={() => setOpenMatchId(isOpenMatch ? null : match.id)}
                           className="inline-flex items-center gap-2 text-clan-magenta text-[10px] uppercase font-bold tracking-widest hover:text-white"
                         >
                           <ImageIcon size={12} /> Ver fotos ({images.length})
                         </button>
                       )}
                     </div>
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

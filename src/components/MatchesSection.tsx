import React from 'react';
import { MATCH_HISTORY } from '../constants';
import { MapPin, Trophy, ArrowRight } from 'lucide-react';

const MatchesSection: React.FC = () => {
  const getOutcome = (result: string) => {
    const [homeRaw, awayRaw] = result.split('-').map((score) => score.trim());
    const home = Number.parseInt(homeRaw, 10);
    const away = Number.parseInt(awayRaw, 10);
    if (!Number.isFinite(home) || !Number.isFinite(away)) return 'Empate';
    if (home > away) return 'Victoria';
    if (home < away) return 'Derrota';
    return 'Empate';
  };

  return (
    <div className="bg-[#050505] py-24 px-4 relative overflow-hidden">
      
      <div className="max-w-6xl mx-auto relative z-10">
         <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-4">
             <div>
               <h2 className="font-display text-6xl text-white uppercase">
                 Resultados <span className="text-clan-magenta">Recientes</span>
               </h2>
             </div>
             <button className="hidden md:flex items-center gap-2 text-clan-magenta font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
                Ver Calendario Completo <ArrowRight size={16}/>
             </button>
         </div>

         <div className="grid gap-6">
           {MATCH_HISTORY.map((match) => (
             <div key={match.id} className="group bg-[#0a0a0a] hover:bg-[#111] border-l-[6px] border-clan-magenta p-0 flex flex-col md:flex-row shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(194,24,91,0.1)]">
               
               {/* Date - Desktop */}
               <div className="hidden md:flex p-6 w-48 bg-white/5 flex-col justify-center items-center text-center border-r border-white/5 group-hover:bg-white/10 transition-colors">
                  <span className="text-3xl font-display text-white font-bold">{match.date.split('-')[2]}</span>
                  <span className="text-clan-magenta font-bold uppercase text-xs tracking-widest">{match.date.split('-')[1]} / 2025</span>
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
               <div className="flex-1 p-4 md:p-6 flex flex-row items-center justify-between gap-2 md:gap-6">
                  
                  {/* Home */}
                  <div className="flex-1 text-right">
                    <h3 className="font-display text-xl md:text-3xl text-white uppercase tracking-wide leading-none truncate">Clan Team</h3>
                    <span className="hidden md:block text-xs text-gray-500 uppercase tracking-widest">Local</span>
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

                  {/* Away */}
                  <div className="flex-1 text-left">
                    <h3 className="font-display text-xl md:text-3xl text-gray-400 uppercase tracking-wide leading-none truncate">{match.opponent}</h3>
                    <span className="hidden md:block text-xs text-gray-600 uppercase tracking-widest">Visitante</span>
                  </div>
               </div>

               {/* Status */}
               <div className="p-2 md:p-4 md:w-32 bg-[#050505] flex flex-row md:flex-col justify-between md:justify-center items-center text-center border-t md:border-t-0 md:border-l border-white/5 gap-2">
                  {getOutcome(match.result) === 'Victoria' && (
                    <span className="w-auto px-3 md:px-0 md:w-full py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded border border-green-500/20">Victoria</span>
                  )}
                  {getOutcome(match.result) === 'Empate' && (
                    <span className="w-auto px-3 md:px-0 md:w-full py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase rounded border border-yellow-500/20">Empate</span>
                  )}
                  {getOutcome(match.result) === 'Derrota' && (
                    <span className="w-auto px-3 md:px-0 md:w-full py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded border border-red-500/20">Derrota</span>
                  )}
                  
                  {match.mvp && (
                     <div className="flex items-center md:block gap-2 text-[10px] text-gray-400">
                        <div className="text-clan-gold md:mb-1 flex md:block justify-center"><Trophy size={12}/></div>
                        <span className="hidden md:inline">MVP: </span><span className="text-white block font-bold md:font-normal">{match.mvp.split(' ')[0]}</span>
                     </div>
                  )}
               </div>

             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default MatchesSection;

import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../types';
import { ASSETS } from '../constants';
import { Trash2, User, Filter, ArrowUpDown, Shield, Swords, Footprints, Hand } from 'lucide-react';
import TacticalBoard from './TacticalBoard';

interface TeamManagerProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  canViewTactics: boolean;
}

type FilterPos = 'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD';
type SortType = 'NUMBER' | 'MVP';

const TeamManager: React.FC<TeamManagerProps> = ({ players, setPlayers, canViewTactics }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [filterPos, setFilterPos] = useState<FilterPos>('ALL');
  const [sortType, setSortType] = useState<SortType>('NUMBER');
  const [cardImageSrc, setCardImageSrc] = useState<string>(ASSETS.players.default);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar a este jugador del Clan?')) {
      setPlayers(prev => prev.filter(p => p.id !== id));
      if (selectedPlayer?.id === id) setSelectedPlayer(null);
    }
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    // Mobile UX: Scroll to card when clicked
    if (window.innerWidth < 1280 && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  useEffect(() => {
    setCardImageSrc(selectedPlayer?.image || ASSETS.players.default);
  }, [selectedPlayer]);

  const getPosColor = (pos: string) => {
      switch(pos) {
        case 'GK': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        case 'DEF': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        case 'MID': return 'text-clan-magenta bg-clan-magenta/10 border-clan-magenta/20';
        case 'FWD': return 'text-red-500 bg-red-500/10 border-red-500/20';
        default: return 'text-white';
      }
  };

  const getPosIcon = (pos: string) => {
      switch(pos) {
        case 'GK': return <Hand size={14} />;
        case 'DEF': return <Shield size={14} />;
        case 'MID': return <Footprints size={14} />;
        case 'FWD': return <Swords size={14} />;
        default: return <User size={14} />;
      }
  };

  // Base sorting logic
  const sortPlayers = (list: Player[]) => {
    return list.sort((a, b) => {
      if (sortType === 'NUMBER') return a.jerseyNumber - b.jerseyNumber;
      if (sortType === 'MVP') return (b.stats?.mvp || 0) - (a.stats?.mvp || 0);
      return 0;
    });
  };

  // Render a single row
  const renderPlayerRow = (player: Player) => (
    <div 
      key={player.id}
      onClick={() => handlePlayerClick(player)}
      className={`group flex items-center p-3 pl-4 hover:bg-white/5 cursor-pointer transition-all border-l-4 border-b border-b-white/5 ${selectedPlayer?.id === player.id ? 'border-l-clan-magenta bg-white/5' : 'border-l-transparent'}`}
    >
        <div className="font-display text-3xl w-12 text-center text-gray-700 group-hover:text-white transition-colors font-bold">
          {player.jerseyNumber}
        </div>
        
        <div className="relative w-12 h-12 rounded-full bg-neutral-800 overflow-hidden mx-3 border-2 border-white/10 group-hover:border-clan-magenta transition-colors shrink-0">
          <img
            src={player.image || ASSETS.players.default}
            className="w-full h-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.src = ASSETS.players.default; }}
          />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="font-display text-lg text-white uppercase tracking-wide truncate">{player.name}</div>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border ${getPosColor(player.position)}`}>
            {getPosIcon(player.position)} {player.position}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-gray-500 px-2 shrink-0">
          <div className="text-center hidden sm:block w-12">
            <span className="block text-gray-700 uppercase text-[8px] tracking-widest font-bold">Partidos</span>
            <span className="font-display text-lg text-white">{player.stats?.matches || 0}</span>
          </div>
          <div className="text-center hidden sm:block w-12">
            <span className="block text-gray-700 uppercase text-[8px] tracking-widest font-bold">MVP</span>
            <span className="font-display text-lg text-clan-gold">{player.stats?.mvp || 0}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(player.id); }} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all">
            <Trash2 size={16} />
          </button>
        </div>
    </div>
  );

  return (
    <div className="bg-clan-black min-h-screen py-20 px-4 relative">
      {/* Background texture */}
      <div className="absolute inset-0 bg-jersey-pattern opacity-20 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
           <span className="text-clan-magenta uppercase tracking-[0.5em] font-bold text-xs">Temporada 2025</span>
           <h2 className="font-display text-7xl text-white uppercase mt-2">
             Plantilla <span className="text-transparent bg-clip-text bg-gradient-to-r from-clan-magenta to-clan-red">Del Clan</span>
           </h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start mb-20">
            
            {/* LEFT: Player List */}
            <div className="xl:col-span-7 bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[600px] max-h-[800px]">
               
               {/* Header & Actions */}
               <div className="p-6 border-b border-white/5 bg-gradient-to-r from-clan-red/10 to-transparent">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-display text-3xl text-white uppercase leading-none">Jugadores</h3>
                      <p className="text-gray-500 text-xs mt-1">Gestiona la alineación oficial</p>
                    </div>
                    <button className="bg-clan-magenta hover:bg-pink-700 text-white px-5 py-2 rounded-lg text-xs uppercase font-bold tracking-wider transition-colors shadow-lg shadow-pink-900/20 flex items-center gap-2">
                       + Nuevo
                    </button>
                  </div>

                  {/* Filters & Sort */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as FilterPos[]).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setFilterPos(pos)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                            filterPos === pos 
                              ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                              : 'bg-black/20 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {pos === 'ALL' ? 'Todos' : pos}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setSortType(prev => prev === 'NUMBER' ? 'MVP' : 'NUMBER')}
                      className="flex items-center gap-2 text-[10px] text-gray-400 hover:text-white uppercase font-bold tracking-wider transition-colors bg-black/20 px-3 py-1.5 rounded-lg border border-white/5"
                    >
                      <ArrowUpDown size={12} />
                      {sortType === 'NUMBER' ? 'Orden: Dorsal' : 'Orden: MVP'}
                    </button>
                  </div>
               </div>
               
               {/* List Content */}
               <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
                  {filterPos === 'ALL' ? (
                    // Grouped View
                    <>
                      {['GK', 'DEF', 'MID', 'FWD'].map((posGroup) => {
                         const groupPlayers = sortPlayers(players.filter(p => p.position === posGroup));
                         if (groupPlayers.length === 0) return null;
                         
                         const labels: Record<string, string> = { 'GK': 'Porteros', 'DEF': 'Defensas', 'MID': 'Mediocampistas', 'FWD': 'Delanteros' };
                         
                         return (
                           <div key={posGroup}>
                             <div className="sticky top-0 z-10 bg-[#161616]/95 backdrop-blur-sm px-4 py-2 border-y border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-clan-magenta flex items-center gap-2">
                               {getPosIcon(posGroup)} {labels[posGroup]}
                             </div>
                             {groupPlayers.map(player => renderPlayerRow(player))}
                           </div>
                         );
                      })}
                    </>
                  ) : (
                    // Filtered Flat View
                    <>
                      {sortPlayers(players.filter(p => p.position === filterPos)).length > 0 ? (
                        sortPlayers(players.filter(p => p.position === filterPos)).map(player => renderPlayerRow(player))
                      ) : (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                          <Filter size={48} className="mb-4 opacity-20" />
                          <p>No hay jugadores en esta posición.</p>
                        </div>
                      )}
                    </>
                  )}
               </div>
            </div>

            {/* RIGHT: THE PLAYER CARD (Replicated from Design) */}
            <div className="xl:col-span-5 flex flex-col items-center sticky top-24" ref={cardRef}>
               
               {selectedPlayer ? (
                 <div className="relative w-full max-w-md aspect-[9/16] bg-[#121212] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] border-0 rounded-3xl group animate-fade-in select-none">
                    
                    {/* 1. Background Texture */}
                    <div className="absolute inset-0 bg-[#121212]"></div>
                    
                    {/* 2. The Abstract Magenta/Pink Shape (Blob) */}
                    <div className="absolute top-[10%] -right-[30%] w-[120%] h-[60%] bg-clan-magenta blob-shape opacity-90 blur-sm transform rotate-12 z-0"></div>
                    <div className="absolute top-[40%] -left-[30%] w-[100%] h-[50%] bg-clan-red blob-shape opacity-60 blur-md transform -rotate-12 z-0"></div>

                    {/* 3. Team Logo Watermark */}
                    <img src={ASSETS.logo} className="absolute top-6 left-6 w-20 h-20 opacity-100 z-20 drop-shadow-lg" />
                    
                    {/* 4. Team Name Header */}
                    <div className="absolute top-8 left-28 z-20">
                        <span className="block text-white font-display text-2xl uppercase tracking-wider leading-none">Clan Team FC</span>
                        <span className="block text-white/50 text-[10px] uppercase tracking-[0.2em]">Official Player Card</span>
                    </div>

                    {/* 5. Player Image (Dual Layer for Fit) */}
                    <div className="absolute top-16 right-0 left-0 bottom-32 z-10 flex items-center justify-center overflow-hidden">
                       
                       {/* Background Blur Layer to fill space if image is horizontal */}
                       <img
                        src={cardImageSrc}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-60 scale-125"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => setCardImageSrc(ASSETS.players.default)}
                        aria-hidden="true"
                       />

                       {/* Foreground Main Image (Contain + Bottom) */}
                       <img 
                          src={cardImageSrc}
                          onError={() => setCardImageSrc(ASSETS.players.default)}
                          alt={selectedPlayer.name}
                          className="relative w-full h-full object-contain object-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105 z-10"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                       />
                    </div>

                    {/* 6. Big Jersey Number (Floating Left) */}
                    <div className="absolute bottom-[35%] left-[-20px] z-20">
                       <span className="font-display text-[12rem] text-white font-bold leading-none drop-shadow-xl opacity-90">
                         {selectedPlayer.jerseyNumber}
                       </span>
                    </div>

                    {/* 7. Bottom Info Section (Diagonal Cut) */}
                    <div className="absolute bottom-0 left-0 w-full h-[35%] bg-[#080808] z-20 clip-diagonal transform origin-bottom-right scale-y-110"></div>
                    
                    {/* 8. Text Content */}
                    <div className="absolute bottom-0 left-0 w-full p-8 z-30 flex flex-col justify-end h-[35%]">
                       
                       <h3 className="font-display text-6xl text-white uppercase leading-[0.85] mb-2">
                         {selectedPlayer.name.split(' ')[0]} <br/>
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-clan-magenta to-white">
                           {selectedPlayer.name.split(' ').slice(1).join(' ')}
                         </span>
                       </h3>
                       
                       <div className="flex flex-col gap-3 border-t border-white/10 pt-4 mt-2">
                          <div className="text-[9px] uppercase tracking-widest text-white/50">
                             Posiciones: <span className="text-white">{selectedPlayer.positions?.join(', ') || selectedPlayer.position}</span>
                          </div>
                          
                          <div className="flex justify-between items-end">
                             <div className="text-white/40 text-sm font-display uppercase tracking-widest">
                                Players del Clan
                             </div>
                             
                             {/* Mini Stats */}
                             <div className="flex gap-4">
                                <div className="text-center">
                                   <div className="text-clan-magenta font-display text-xl leading-none">{selectedPlayer.stats?.goals || 0}</div>
                                   <div className="text-[8px] text-gray-500 uppercase">Goles</div>
                                </div>
                                <div className="text-center">
                                   <div className="text-white font-display text-xl leading-none">{selectedPlayer.stats?.matches || 0}</div>
                                   <div className="text-[8px] text-gray-500 uppercase">Part</div>
                                </div>
                                <div className="text-center">
                                   <div className="text-white font-display text-xl leading-none">{selectedPlayer.position}</div>
                                   <div className="text-[8px] text-gray-500 uppercase">Pos</div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                 </div>
               ) : (
                 <div className="w-full max-w-md aspect-[9/16] bg-[#0a0a0a] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-gray-600">
                    <User size={64} className="mb-4 opacity-20"/>
                    <p className="uppercase tracking-widest font-bold text-sm">Selecciona un jugador</p>
                 </div>
               )}

            </div>
        </div>

        {/* TACTICAL BOARD SECTION */}
        {canViewTactics && <TacticalBoard players={players} />}

      </div>
    </div>
  );
};

export default TeamManager;


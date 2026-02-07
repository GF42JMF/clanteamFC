import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { ASSETS, STAFF_MEMBERS } from '../constants';
import { Users, RefreshCw, ChevronRight, Shield, User, X, Trash2, Zap, LayoutTemplate, ArrowRightLeft, Download, Save } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface TacticalBoardProps {
  players: Player[];
}

interface FieldToken {
  id: string;
  playerId: string | null;
  x: number;
  y: number;
}

// Coordinate Presets (Percentages)
const FORMATIONS = {
  '3-3-1': [
    { x: 50, y: 88 }, // GK
    { x: 20, y: 70 }, { x: 50, y: 65 }, { x: 80, y: 70 }, // DEF
    { x: 20, y: 40 }, { x: 50, y: 40 }, { x: 80, y: 40 }, // MID
    { x: 50, y: 15 }, // FWD
  ],
  '2-3-2': [
    { x: 50, y: 88 }, // GK
    { x: 30, y: 70 }, { x: 70, y: 70 }, // DEF
    { x: 20, y: 45 }, { x: 50, y: 45 }, { x: 80, y: 45 }, // MID
    { x: 35, y: 15 }, { x: 65, y: 15 }, // FWD
  ],
  '2-4-1': [
    { x: 50, y: 88 }, // GK
    { x: 30, y: 75 }, { x: 70, y: 75 }, // DEF
    { x: 15, y: 50 }, { x: 38, y: 45 }, { x: 62, y: 45 }, { x: 85, y: 50 }, // MID
    { x: 50, y: 15 }, // FWD
  ],
  '3-2-2': [
    { x: 50, y: 88 }, // GK
    { x: 20, y: 70 }, { x: 50, y: 70 }, // DEF
    { x: 35, y: 45 }, { x: 65, y: 45 }, // MID
    { x: 35, y: 15 }, { x: 65, y: 15 }, // FWD
  ]
};

type FormationKey = keyof typeof FORMATIONS;

const STORAGE_KEY_TOKENS = 'clan_team_tactics_tokens';
const STORAGE_KEY_FORMATION = 'clan_team_tactics_formation';

const TacticalBoard: React.FC<TacticalBoardProps> = ({ players }) => {
  // Initialize state from LocalStorage if available
  const [tokens, setTokens] = useState<FieldToken[]>(() => {
    const savedTokens = localStorage.getItem(STORAGE_KEY_TOKENS);
    if (savedTokens) {
      try {
        return JSON.parse(savedTokens);
      } catch (e) {
        console.error("Failed to parse saved tactics", e);
      }
    }
    return FORMATIONS['3-3-1'].map((pos, i) => ({ id: `t${i}`, playerId: null, ...pos }));
  });
  
  const [currentFormation, setCurrentFormation] = useState<FormationKey>(() => {
    return (localStorage.getItem(STORAGE_KEY_FORMATION) as FormationKey) || '3-3-1';
  });

  const [selectedBenchPlayer, setSelectedBenchPlayer] = useState<string | null>(null);
  const [selectedFieldTokenId, setSelectedFieldTokenId] = useState<string | null>(null); // New state for on-field swap
  const [isDownloading, setIsDownloading] = useState(false);
  const [staffPreview, setStaffPreview] = useState<{ name: string; role: string; image: string } | null>(null);
  
  const fieldRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragMoved, setDragMoved] = useState(false);
  const dragFrameRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{ id: string; x: number; y: number } | null>(null);

  // Auto-fill slots on first load if empty and no storage
  useEffect(() => {
    const hasPlayers = tokens.some(t => t.playerId !== null);
    if (!hasPlayers && players.length > 0) {
       // Only autofill if we really have nothing
       // check if it was a fresh load
       const saved = localStorage.getItem(STORAGE_KEY_TOKENS);
       if (!saved) {
          setTokens(prev => prev.map((token, index) => ({
            ...token,
            playerId: players[index]?.id || null
          })));
       }
    }
  }, [players]); 

  // PERSISTENCE: Save changes to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
    localStorage.setItem(STORAGE_KEY_FORMATION, currentFormation);
  }, [tokens, currentFormation]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStaffPreview(null);
    };

    if (staffPreview) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [staffPreview]);

  const getPlayer = (id: string | null) => players.find(p => p.id === id);

  // --- ACTIONS ---

  const handleFormationChange = (fmt: FormationKey) => {
    setCurrentFormation(fmt);
    // When changing formation, we try to keep players in their relative slots index-wise
    setTokens(prev => {
      const newCoords = FORMATIONS[fmt];
      return prev.map((token, i) => ({
        ...token,
        x: newCoords[i]?.x || 50,
        y: newCoords[i]?.y || 50
      }));
    });
  };

  const handleClearBoard = () => {
    if(confirm('Â¿Limpiar toda la pizarra?')) {
      setTokens(prev => prev.map(t => ({ ...t, playerId: null })));
      setSelectedFieldTokenId(null);
      setSelectedBenchPlayer(null);
    }
  };

  const handleAutoFill = () => {
    const fieldIds = tokens.map(t => t.playerId).filter(Boolean);
    const availableBench = players.filter(p => !fieldIds.includes(p.id));
    
    let benchIndex = 0;
    setTokens(prev => prev.map(t => {
      if (t.playerId === null && benchIndex < availableBench.length) {
        const newId = availableBench[benchIndex].id;
        benchIndex++;
        return { ...t, playerId: newId };
      }
      return t;
    }));
  };

  const handleRemovePlayerFromToken = (e: React.MouseEvent, tokenId: string) => {
    e.stopPropagation(); 
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, playerId: null } : t));
    if (selectedFieldTokenId === tokenId) setSelectedFieldTokenId(null);
  };

  const handleDownloadPDF = async () => {
    if (!captureRef.current) return;
    setIsDownloading(true);

    try {
      const element = captureRef.current;
      
      // Temporarily add a class to fix styles for capture if needed
      element.classList.add('pdf-capture-mode');

      // Use html2canvas to capture the element
      const canvas = await html2canvas(element, {
        useCORS: true, // Try to load external images
        allowTaint: true,
        scale: 3, // High quality scale
        backgroundColor: '#050505',
        logging: false,
        onclone: (clonedDoc) => {
           // Any direct manipulation of cloned DOM before render
           const clonedElement = clonedDoc.querySelector('#capture-area') as HTMLElement;
           if(clonedElement) clonedElement.style.transform = 'none';
        }
      });

      element.classList.remove('pdf-capture-mode');

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Create PDF (Landscape)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate aspect ratio to fit page
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
      
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;

      // Add Title
      pdf.setFontSize(24);
      pdf.setTextColor(194, 24, 91); // Clan Magenta
      pdf.text('CLAN TEAM F.C. - FORMACIÃ“N TÃCTICA', pdfWidth / 2, 15, { align: 'center' });
      
      pdf.addImage(imgData, 'JPEG', x, y + 5, width, height);
      
      pdf.save(`clan-team-formacion-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF. Verifica que las imÃ¡genes carguen correctamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  // --- DRAG & DROP LOGIC ---

  const handlePointerDown = (e: React.PointerEvent, tokenId: string) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(tokenId);
    setDragMoved(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !fieldRef.current) return;
    e.preventDefault();
    setDragMoved(true);

    const rect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    pendingDragRef.current = { id: isDragging, x: clampedX, y: clampedY };
    if (dragFrameRef.current === null) {
      dragFrameRef.current = window.requestAnimationFrame(() => {
        const next = pendingDragRef.current;
        if (next) {
          setTokens(prev => prev.map(t => t.id === next.id ? { ...t, x: next.x, y: next.y } : t));
        }
        dragFrameRef.current = null;
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(null);
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
  };

  // --- SELECTION & SWAP LOGIC ---

  const handleTokenClick = (tokenId: string) => {
    if (dragMoved) return; // Ignore click if it was a drag

    // MODE 1: SUBSTITUTION (Bench -> Field)
    if (selectedBenchPlayer) {
      setTokens(prev => prev.map(t => {
        // If this is the target token, put bench player here
        if (t.id === tokenId) {
           return { ...t, playerId: selectedBenchPlayer };
        }
        // If the bench player was already somewhere else on field, clear that spot (prevent duplicates)
        if (t.playerId === selectedBenchPlayer) {
          return { ...t, playerId: null };
        }
        return t;
      }));
      setSelectedBenchPlayer(null); 
      return;
    }

    // MODE 2: FIELD SWAP (Field A <-> Field B)
    if (selectedFieldTokenId) {
        if (selectedFieldTokenId === tokenId) {
            // Deselect if clicking self
            setSelectedFieldTokenId(null);
        } else {
            // EXECUTE SWAP
            setTokens(prev => {
                const tokenA = prev.find(t => t.id === selectedFieldTokenId);
                const tokenB = prev.find(t => t.id === tokenId);
                
                if (!tokenA || !tokenB) return prev;

                const playerA = tokenA.playerId;
                const playerB = tokenB.playerId;

                return prev.map(t => {
                    if (t.id === selectedFieldTokenId) return { ...t, playerId: playerB };
                    if (t.id === tokenId) return { ...t, playerId: playerA };
                    return t;
                });
            });
            setSelectedFieldTokenId(null);
        }
    } else {
        // Select a token to start action
        // Can select empty tokens too if we want to move players to empty spots
        setSelectedFieldTokenId(tokenId);
    }
  };

  const fieldPlayersIds = tokens.map(t => t.playerId).filter(Boolean);
  const benchPlayers = players.filter(p => !fieldPlayersIds.includes(p.id));

  // Determine if we are in "Field Swap Mode" (A player on field is selected and waiting)
  const isFieldSwapMode = !!selectedFieldTokenId;

  return (
    <div className="mt-20 border-t border-white/5 pt-16" id="tactical-board">
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
        <div>
          <h3 className="font-display text-5xl text-white uppercase flex items-center gap-3">
             <Shield className="text-clan-magenta" size={40} /> Pizarra <span className="text-clan-magenta">Táctica</span>
          </h3>
          <p className="text-gray-500 text-sm mt-2 max-w-lg">
            Arrastra para mover. Toca dos jugadores en cancha para <span className="text-cyan-400 font-bold">intercambiar</span>.
            <br/> <span className="text-green-400 flex items-center gap-1 text-[10px] uppercase font-bold mt-1"><Save size={10}/> Cambios guardados automáticamente</span>
          </p>
        </div>

        {/* Quick Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-3 bg-[#121212] p-2 rounded-xl border border-white/10 shadow-lg">
           
           {/* Formation Selectors */}
           <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg">
              {Object.keys(FORMATIONS).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleFormationChange(fmt as FormationKey)}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${currentFormation === fmt ? 'bg-white text-black' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
                >
                  {fmt}
                </button>
              ))}
           </div>

           <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

           <button 
             onClick={handleAutoFill}
             className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-green-400 bg-green-900/20 hover:bg-green-900/40 rounded transition-colors border border-green-900/30"
             title="Rellenar huecos vacÃ­os"
           >
             <Zap size={14} /> Auto
           </button>
           
           <button 
             onClick={handleClearBoard}
             className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-400 bg-red-900/20 hover:bg-red-900/40 rounded transition-colors border border-red-900/30"
             title="Limpiar pizarra"
           >
             <Trash2 size={14} />
           </button>

           <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

           <button 
             onClick={handleDownloadPDF}
             disabled={isDownloading}
             className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-clan-magenta hover:bg-pink-700 rounded transition-colors shadow-lg shadow-pink-900/20"
             title="Descargar PDF"
           >
             {isDownloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
             PDF
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 select-none" ref={captureRef} id="capture-area">
        
        {/* THE FIELD */}
        <div 
          className="relative w-full aspect-[3/4] lg:aspect-[4/3] max-w-4xl mx-auto bg-[#0a2e18] rounded-3xl border-4 border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden group"
          ref={fieldRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
           {/* Grass & Pattern */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] opacity-20 mix-blend-overlay"></div>
           <div className="absolute inset-0 bg-gradient-to-b from-[#0f381e] to-[#0a2615]"></div>
           
           {/* Realistic Field Lines */}
           <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none opacity-60"></div>
           <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white/20 pointer-events-none opacity-60"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full pointer-events-none opacity-60"></div>
           
           {/* Areas */}
           <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-24 border-b-2 border-x-2 border-white/20 opacity-60 pointer-events-none"></div>
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-24 border-t-2 border-x-2 border-white/20 opacity-60 pointer-events-none"></div>
           
           {/* Penalty Spots */}
           <div className="absolute top-20 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full pointer-events-none"></div>
           <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full pointer-events-none"></div>

           {/* TOKENS */}
           {tokens.map((token) => {
             const player = getPlayer(token.playerId);
             
             // Highlighting Logic
             const isSubstitutionTarget = !!selectedBenchPlayer; 
             const isFieldSwapSelected = selectedFieldTokenId === token.id;
             const isFieldSwapTarget = !!selectedFieldTokenId && selectedFieldTokenId !== token.id;

             return (
               <div
                 key={token.id}
                 onPointerDown={(e) => handlePointerDown(e, token.id)}
                 onClick={() => handleTokenClick(token.id)}
                 className={`absolute w-16 h-16 md:w-24 md:h-24 -ml-8 -mt-8 md:-ml-12 md:-mt-12 rounded-full ${isDragging === token.id ? 'transition-none' : 'transition-all duration-300'}
                    ${isDragging === token.id ? 'z-50 scale-125 cursor-grabbing' : 'z-10 cursor-pointer hover:z-40'}
                    ${isSubstitutionTarget && !player ? 'animate-pulse' : ''}
                    ${isFieldSwapSelected ? 'z-50 scale-110' : ''}
                 `}
                 style={{ 
                   left: `${token.x}%`, 
                   top: `${token.y}%`,
                   willChange: isDragging === token.id ? 'left, top, transform' : 'auto'
                 }}
               >
                  {/* Token Body */}
                  <div className={`
                    w-full h-full rounded-full overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-center relative transition-all border-2
                    ${player 
                        ? isFieldSwapSelected 
                            ? 'bg-[#1a1a1a] border-cyan-400 ring-4 ring-cyan-400/30' // Selected for Swap
                            : isFieldSwapTarget
                                ? 'bg-[#1a1a1a] border-white/50 hover:border-cyan-400' // Target for Swap
                                : 'bg-[#1a1a1a] border-white group-hover:border-clan-magenta' // Normal
                        : isSubstitutionTarget 
                            ? 'bg-clan-magenta/20 border-clan-magenta border-dashed scale-110' // Sub Target
                            : isFieldSwapTarget
                                ? 'bg-cyan-900/30 border-cyan-400 border-dashed hover:bg-cyan-900/50' // Swap Empty Target
                                : 'bg-black/40 border-white/20 border-dashed hover:border-white hover:bg-black/60' // Empty Normal
                    }
                  `}>
                     {player ? (
                       <>
                         {/* Enhanced Image for Face Focus - ADDED CROSSORIGIN */}
                         <img 
                            src={player.image || ASSETS.players.default} 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-full h-full object-cover object-top transform scale-110 pointer-events-none" 
                            onError={(e) => { e.currentTarget.src = ASSETS.players.default; }}
                            alt={player.name}
                         />
                         
                         {/* Remove Button (Mini X) - Hidden during PDF generation via css or just visual filtering */}
                         <button 
                            onClick={(e) => handleRemovePlayerFromToken(e, token.id)}
                            className={`absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full transform translate-x-1 -translate-y-1 opacity-0 group-hover:opacity-100 hover:scale-125 transition-all z-20 shadow-md ${isDownloading ? 'hidden' : ''}`}
                            title="Sacar de cancha"
                         >
                            <X size={12} />
                         </button>

                         {/* Swap Indicator Overlay */}
                         {isFieldSwapTarget && (
                             <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center animate-pulse">
                                <ArrowRightLeft className="text-cyan-400 drop-shadow-md" size={32} />
                             </div>
                         )}
                       </>
                     ) : (
                        // Empty State
                        <div className="text-white/30">
                            {isSubstitutionTarget ? <ChevronRight size={24} className="animate-bounce" /> : <span className="text-xl font-bold">+</span>}
                        </div>
                     )}
                  </div>

                  {/* Redesigned Name Tag (Outside Circle) */}
                  {player && (
                     <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center min-w-[120px] pointer-events-none z-50">
                        <div className="bg-black text-white text-[10px] md:text-xs px-3 py-1 rounded font-bold uppercase tracking-wider whitespace-nowrap border border-white/20 shadow-xl">
                           <span className="text-clan-magenta mr-1">{player.jerseyNumber}.</span> {player.name.split(' ')[1] || player.name}
                        </div>
                     </div>
                  )}

               </div>
             );
           })}
        </div>

        {/* SIDEBAR: BENCH & STAFF */}
        <div className="lg:w-80 flex flex-col gap-4">
           
           {/* Bench Header */}
           <div className={`
              p-4 rounded-xl border flex justify-between items-center shadow-lg transition-colors
              ${selectedBenchPlayer 
                ? 'bg-clan-magenta/10 border-clan-magenta' 
                : 'bg-[#121212] border-white/10'
              }
           `}>
               <div>
                 <h4 className="text-white font-display text-2xl uppercase leading-none">Suplentes</h4>
                 <div className="text-[10px] uppercase font-bold tracking-wider mt-1">
                   {selectedBenchPlayer 
                     ? <span className="text-clan-magenta animate-pulse">Selecciona posición...</span> 
                     : isFieldSwapMode 
                        ? <span className="text-cyan-400 animate-pulse">Selecciona sustituto</span>
                        : <span className="text-gray-500">{benchPlayers.length} Disponibles</span>
                    }
                 </div>
               </div>
               <LayoutTemplate size={20} className={selectedBenchPlayer ? 'text-clan-magenta' : 'text-gray-600'} />
           </div>

           {/* Bench List */}
           <div className="bg-[#0f0f0f] flex-1 rounded-2xl border border-white/5 shadow-inner overflow-hidden flex flex-col max-h-[400px]">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                 {benchPlayers.map(player => (
                   <div 
                     key={player.id}
                     onClick={() => {
                        // MODE 1 REVERSE: If a field player is selected, swap him with this bench player
                        if (selectedFieldTokenId) {
                           setTokens(prev => prev.map(t => {
                               if (t.id === selectedFieldTokenId) {
                                   return { ...t, playerId: player.id };
                               }
                               return t;
                           }));
                           setSelectedFieldTokenId(null); // Substitution done
                           return;
                        }

                        // MODE 2: Standard Bench Selection
                        setSelectedBenchPlayer(selectedBenchPlayer === player.id ? null : player.id);
                     }}
                     className={`relative flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 border group
                        ${selectedBenchPlayer === player.id 
                           ? 'bg-clan-magenta text-white border-clan-magenta shadow-[0_0_20px_rgba(194,24,91,0.4)] translate-x-2' 
                           : isFieldSwapMode 
                                ? 'bg-[#161616] border-cyan-900/30 hover:bg-cyan-900/20 hover:border-cyan-400' 
                                : 'bg-[#161616] text-gray-300 border-transparent hover:bg-[#1f1f1f] hover:border-white/10'
                        }
                     `}
                   >
                      <div className={`font-display text-2xl w-8 text-center font-bold ${selectedBenchPlayer === player.id ? 'text-white' : 'text-gray-600'}`}>
                          {player.jerseyNumber}
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-black overflow-hidden border border-white/10">
                         {/* ADDED CROSSORIGIN HERE TOO */}
                         <img
                           src={player.image || ASSETS.players.default}
                           referrerPolicy="no-referrer"
                           loading="lazy"
                           className="w-full h-full object-cover object-top"
                           onError={(e) => { e.currentTarget.src = ASSETS.players.default; }}
                         />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                         <div className="text-sm font-bold truncate">{player.name}</div>
                         <div className={`text-[9px] uppercase font-bold tracking-wider ${selectedBenchPlayer === player.id ? 'text-white/80' : 'text-gray-500'}`}>
                             {player.position}
                         </div>
                      </div>

                      {/* Visual Cue for Selection or Swap */}
                      {selectedBenchPlayer === player.id && (
                        <div className="absolute right-3 animate-pulse">
                            <ChevronRight size={20} />
                        </div>
                      )}
                      {/* Visual Cue for Swap Availability */}
                      {isFieldSwapMode && (
                          <div className="absolute right-3 text-cyan-400 animate-pulse">
                             <RefreshCw size={18} />
                          </div>
                      )}
                   </div>
                 ))}

                 {benchPlayers.length === 0 && (
                   <div className="h-40 flex flex-col items-center justify-center text-gray-600 text-center p-6 border-2 border-dashed border-white/5 rounded-xl m-2">
                     <Users size={32} className="mb-2 opacity-20" />
                     <p className="text-xs uppercase font-bold">Sin suplentes</p>
                     <p className="text-[10px] mt-1">Todos estÃ¡n jugando</p>
                   </div>
                 )}
              </div>
           </div>
           
           {/* Staff Section (Dynamic) */}
           <div className="bg-[#121212] rounded-xl border border-white/5 p-4 flex flex-col gap-3">
               <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                   <User size={16} className="text-clan-gold" />
                   <div className="text-white text-sm font-bold uppercase leading-none">Cuerpo Técnico</div>
               </div>
               
               {STAFF_MEMBERS.map(staff => (
                  <div key={staff.id} className="flex items-center gap-3">
                     <button
                       type="button"
                       onClick={() => staff.image && setStaffPreview({ name: staff.name, role: staff.role, image: staff.image })}
                       className={`w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-white/10 overflow-hidden transition-transform ${staff.image ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                       aria-label={`Ver foto de ${staff.name}`}
                       disabled={!staff.image}
                     >
                        {staff.image ? (
                          <img
                            src={staff.image}
                            className="w-full h-full object-cover object-left"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = ASSETS.players.default; }}
                          />
                        ) : (
                          <User size={14} className="text-gray-500"/>
                        )}
                     </button>
                     <div>
                        <div className="text-gray-300 text-xs font-bold">{staff.name}</div>
                        <div className="text-[9px] text-clan-magenta uppercase font-bold tracking-wider">{staff.role}</div>
                     </div>
                  </div>
               ))}
           </div>

        </div>


      </div>
      {staffPreview && (
        <div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setStaffPreview(null)}
        >
          <button
            className="fixed top-6 right-6 z-[130] bg-black/50 hover:bg-clan-red text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/10 shadow-lg group"
            onClick={(event) => {
              event.stopPropagation();
              setStaffPreview(null);
            }}
            aria-label="Cerrar"
          >
            <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center pointer-events-none">
            <div
              className="relative pointer-events-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={staffPreview.image}
                alt={staffPreview.name}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
                referrerPolicy="no-referrer"
              />
            </div>
            <div
              className="mt-6 text-center pointer-events-auto bg-black/60 px-8 py-4 rounded-2xl backdrop-blur-sm border border-white/5"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-white font-display text-3xl uppercase tracking-wide leading-none">{staffPreview.name}</h3>
              <span className="text-clan-magenta uppercase text-xs font-bold tracking-[0.2em] mt-2 block">{staffPreview.role}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TacticalBoard;


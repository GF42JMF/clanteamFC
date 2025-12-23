import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { MONTHS } from '../constants';
import { Check, Search, ChevronLeft, ChevronRight, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';

interface DuesSectionProps {
  players: Player[];
}

const DuesSection: React.FC<DuesSectionProps> = ({ players }) => {
  // Estado para el año seleccionado (Por defecto 2026)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estructura de datos: { año: { playerId: { mes: true/false } } }
  const [payments, setPayments] = useState<Record<number, Record<string, Record<string, boolean>>>>({});

  const togglePayment = (playerId: string, month: string) => {
    setPayments(prev => ({
      ...prev,
      [selectedYear]: {
        ...(prev[selectedYear] || {}),
        [playerId]: {
          ...(prev[selectedYear]?.[playerId] || {}),
          [month]: !prev[selectedYear]?.[playerId]?.[month]
        }
      }
    }));
  };

  // Filtrar jugadores
  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.jerseyNumber.toString().includes(searchTerm)
  );

  // Cálculos de estadísticas
  const stats = useMemo(() => {
    let totalPossible = players.length * 12;
    let totalPaid = 0;
    
    players.forEach(p => {
      MONTHS.forEach(m => {
        if (payments[selectedYear]?.[p.id]?.[m]) totalPaid++;
      });
    });

    const percentage = Math.round((totalPaid / totalPossible) * 100) || 0;
    return { totalPaid, percentage };
  }, [players, payments, selectedYear]);

  // Calcular progreso individual
  const getPlayerProgress = (playerId: string) => {
    let paidCount = 0;
    MONTHS.forEach(m => {
      if (payments[selectedYear]?.[playerId]?.[m]) paidCount++;
    });
    return (paidCount / 12) * 100;
  };

  return (
    <div className="bg-[#080808] py-20 px-4 border-t border-white/5 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-clan-magenta/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
          <div>
            <h2 className="font-display text-5xl text-white leading-none">
               FINANZAS <span className="text-transparent bg-clip-text bg-gradient-to-r from-clan-magenta to-clan-red">DEL CLAN</span>
            </h2>
            <p className="text-gray-500 mt-2 text-lg">Administración de cuotas mensuales</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             {/* Year Selector */}
             <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
                <button 
                  onClick={() => setSelectedYear(prev => prev - 1)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-6 font-display text-2xl font-bold text-white min-w-[100px] text-center">
                  {selectedYear}
                </div>
                <button 
                  onClick={() => setSelectedYear(prev => prev + 1)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
             </div>

             {/* Search */}
             <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar jugador..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-white focus:outline-none focus:border-clan-magenta transition-colors"
                />
             </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 flex items-center gap-4 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                 <TrendingUp size={24} />
              </div>
              <div>
                 <div className="text-gray-500 text-xs uppercase tracking-widest font-bold">Cumplimiento Anual</div>
                 <div className="text-3xl font-display text-white">{stats.percentage}%</div>
              </div>
           </div>
           
           <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 flex items-center gap-4 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-clan-magenta/10 flex items-center justify-center text-clan-magenta">
                 <DollarSign size={24} />
              </div>
              <div>
                 <div className="text-gray-500 text-xs uppercase tracking-widest font-bold">Cuotas Pagadas</div>
                 <div className="text-3xl font-display text-white">{stats.totalPaid} <span className="text-gray-600 text-lg">/ {players.length * 12}</span></div>
              </div>
           </div>

           <div className="bg-gradient-to-r from-clan-magenta to-clan-red p-6 rounded-2xl flex items-center justify-between shadow-lg text-white">
              <div>
                 <div className="text-white/80 text-xs uppercase tracking-widest font-bold">Jugadores Activos</div>
                 <div className="text-3xl font-display">{players.length}</div>
              </div>
              <div className="opacity-50">
                 <AlertCircle size={40} />
              </div>
           </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#121212] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#1a1a1a] border-b border-white/10">
                  <th className="p-4 pl-6 text-white font-bold uppercase tracking-wider text-xs sticky left-0 bg-[#1a1a1a] z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)] w-64">
                    Jugador
                  </th>
                  {MONTHS.map(m => (
                    <th key={m} className="p-4 text-center text-gray-400 font-display text-lg tracking-wide min-w-[80px]">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPlayers.map(player => {
                   const progress = getPlayerProgress(player.id);
                   const isFullyPaid = progress === 100;

                   return (
                    <tr key={player.id} className="hover:bg-white/[0.02] transition-colors group">
                      
                      {/* Sticky Player Column */}
                      <td className="p-4 pl-6 sticky left-0 bg-[#121212] group-hover:bg-[#161616] z-10 border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-colors">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 overflow-hidden shrink-0">
                              {player.image ? (
                                <img src={player.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-display text-gray-500">{player.jerseyNumber}</div>
                              )}
                           </div>
                           <div className="flex flex-col min-w-0 flex-1">
                              <span className={`font-bold text-sm truncate ${isFullyPaid ? 'text-green-400' : 'text-gray-200'}`}>{player.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${isFullyPaid ? 'bg-green-500' : 'bg-clan-magenta'}`} 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                           </div>
                         </div>
                      </td>

                      {/* Month Columns */}
                      {MONTHS.map(month => {
                        const isPaid = payments[selectedYear]?.[player.id]?.[month];
                        return (
                          <td key={month} className="p-2 text-center relative">
                            <button
                              onClick={() => togglePayment(player.id, month)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 mx-auto group/btn 
                                ${isPaid 
                                  ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-100' 
                                  : 'bg-white/5 text-gray-600 hover:bg-white/10 hover:text-gray-400 scale-90 hover:scale-100'
                                }`}
                            >
                              {isPaid ? <Check size={20} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-white/10 group-hover/btn:bg-white/30"></div>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredPlayers.length === 0 && (
            <div className="p-12 text-center text-gray-500">
               No se encontraron jugadores con ese nombre.
            </div>
          )}
        </div>
        
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 uppercase tracking-widest gap-4">
           <div>* Los datos se guardan localmente para esta sesión.</div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> Pagado</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white/10 border border-white/20"></div> Pendiente</div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default DuesSection;

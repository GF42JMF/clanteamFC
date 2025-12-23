import React, { useEffect, useState } from 'react';
import { ASSETS } from '../constants';
import { Trophy, ChevronDown } from 'lucide-react';

const Hero: React.FC = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-end pt-20 md:pt-0">
      
      {/* Background with Jersey Pattern & Parallax Photo */}
      <div className="absolute inset-0 bg-clan-black z-0 overflow-hidden">
          {/* Jersey Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-jersey-pattern fixed"></div>
          
          {/* Team Photo Background with Parallax */}
          <div 
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-50 grayscale hover:grayscale-0 transition-all duration-[2s] will-change-transform"
            style={{ 
              backgroundImage: `url(${ASSETS.teamPhoto})`,
              transform: `translateY(${offset * 0.5}px) scale(1.1)` // Parallax effect
            }}
          />
          
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-clan-black via-clan-black/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-clan-black via-transparent to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pb-16 md:pb-24 flex flex-col md:flex-row items-end md:items-center justify-between gap-8 md:gap-8">
        
        {/* Left: Text & Title */}
        <div 
          className="flex-1 text-left w-full"
          style={{ transform: `translateY(${offset * -0.2}px)` }} // Reverse parallax for text
        >
           <h1 className="font-display text-7xl sm:text-8xl md:text-[10rem] leading-[0.85] font-bold uppercase text-white drop-shadow-2xl tracking-tighter animate-fade-in-up">
             CLAN <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-clan-magenta to-clan-red">TEAM FC</span>
           </h1>
           
           <p className="mt-6 text-lg sm:text-xl text-gray-300 font-light max-w-lg border-l-4 border-clan-magenta pl-6 animate-fade-in-up delay-100">
             Es algo hermoso. 
             <span className="block text-white font-bold mt-1 text-xl sm:text-2xl font-display uppercase tracking-wider">Campeones de Copa Competencia 2023 <br/> Campeones Copa Plata Primaveral 2025 <br/> Mundialito Fútbol 8</span>
           </p>

           <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-up delay-200">
              <button 
                onClick={() => scrollToSection('team-section')}
                className="bg-clan-magenta hover:bg-pink-700 text-white font-display text-xl sm:text-2xl uppercase px-8 sm:px-10 py-3 tracking-wide transition-all clip-diagonal shadow-[0_0_20px_rgba(194,24,91,0.5)] hover:shadow-[0_0_30px_rgba(194,24,91,0.8)] hover:-translate-y-1 active:translate-y-0"
              >
                Ver Plantilla
              </button>
              <button 
                onClick={() => scrollToSection('matches-section')}
                className="border border-white/20 hover:bg-white/10 text-white font-display text-xl sm:text-2xl uppercase px-8 sm:px-10 py-3 tracking-wide transition-all hover:-translate-y-1"
              >
                Último Partido
              </button>
           </div>
        </div>

        {/* Right: Badge & Logo (Visible on mobile now) */}
        <div 
          className="relative group w-full md:w-auto flex justify-center md:block mt-8 md:mt-0"
          style={{ transform: `translateY(${offset * -0.1}px)` }} // Subtle parallax
        >
           {/* Animated Glow behind logo */}
           <div className="absolute inset-0 bg-clan-red blur-[60px] md:blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-1000 rounded-full"></div>
           
           <img 
             src={ASSETS.logo} 
             alt="Clan Team Logo" 
             className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] transform group-hover:scale-105 transition-transform duration-500" 
           />
           
           {/* Champion Badge - Hidden on very small screens if needed, usually fine */}
           <div className="absolute -bottom-2 -right-2 md:-bottom-6 md:-right-6 bg-gradient-to-r from-clan-gold to-yellow-600 p-[2px] rounded-lg shadow-2xl rotate-3 hover:rotate-0 transition-transform cursor-default scale-75 md:scale-100 origin-bottom-right">
             <div className="bg-black/90 backdrop-blur px-6 py-4 rounded-md flex items-center gap-4">
               <div className="bg-yellow-500/20 p-2 rounded-full">
                 <Trophy className="text-yellow-400 fill-current" size={28} />
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest leading-none mb-1">Ganadores</span>
                 <span className="font-display text-3xl text-white leading-none">MUNDIALITO</span>
               </div>
             </div>
           </div>
        </div>

      </div>

      {/* Scroll Indicator */}
      <div 
        onClick={() => scrollToSection('matches-section')}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 animate-pulse cursor-pointer hover:text-white transition-colors hidden md:block"
      >
        <ChevronDown size={32} />
      </div>

    </div>
  );
};

export default Hero;

import React, { useState, useEffect, useRef } from 'react';
import Hero from './components/Hero';
import TeamManager from './components/TeamManager';
import MatchesSection from './components/MatchesSection';
import GallerySection from './components/GallerySection';
import DuesSection from './components/DuesSection';
import { INITIAL_PLAYERS, ASSETS } from './constants';
import { Player } from './types';
import { LayoutDashboard, Users, Trophy, Image as ImageIcon, Wallet, Menu, X, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';

const App: React.FC = () => {
  // 'landing' means the scrollable page (Home, Team, Matches, Gallery)
  // 'dues' is the separate Dues page
  const [viewMode, setViewMode] = useState<'landing' | 'dues'>('landing');
  
  // Controls the Highlighted Pill in Nav
  const [activeNavId, setActiveNavId] = useState('home');
  
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Lock to prevent spy update during click-scroll animation
  const isManualScrolling = useRef(false);

  // --- 1. Navbar Scroll Effect ---
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      // Force 'home' active if at very top, overriding everything else
      if (!isManualScrolling.current && window.scrollY < 100 && viewMode === 'landing') {
        setActiveNavId('home');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

  // --- 2. Scroll Spy Logic (Intersection Observer) ---
  useEffect(() => {
    // Only run scroll spy on landing page
    if (viewMode !== 'landing') return;

    const sections = ['home-section', 'team-section', 'matches-section', 'gallery-section'];
    const navMap: Record<string, string> = {
      'home-section': 'home',
      'team-section': 'team',
      'matches-section': 'matches',
      'gallery-section': 'gallery'
    };

    const observerOptions = {
      root: null,
      // Precision Tuning:
      // Creates a very narrow detection line at roughly 30% from the top of the viewport.
      // Top: -30% (Ignore top 30%)
      // Bottom: -69% (Ignore bottom 69%)
      // Result: A 1% height "tripwire" zone. Only one section can effectively be in this zone at a time.
      rootMargin: '-30% 0px -69% 0px', 
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // If user clicked a link, ignore observer updates until scroll finishes
      if (isManualScrolling.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const navId = navMap[entry.target.id];
          if (navId) {
             setActiveNavId(navId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [viewMode]);

  const navItems = [
    { id: 'home', label: 'Inicio', icon: LayoutDashboard },
    { id: 'team', label: 'Plantilla', icon: Users },
    { id: 'matches', label: 'Resultados', icon: Trophy },
    { id: 'gallery', label: 'Media', icon: ImageIcon },
    { id: 'dues', label: 'Cuotas', icon: Wallet },
  ];

  const handleNavClick = (id: string) => {
    setIsMobileMenuOpen(false);

    if (id === 'dues') {
      setViewMode('dues');
      setActiveNavId('dues');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      
      // If switching from Dues to Landing
      if (viewMode === 'dues') {
        setViewMode('landing');
        setTimeout(() => {
          const element = document.getElementById(`${id}-section`);
          if (element) {
            // No manual lock needed here as we are loading fresh
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveNavId(id);
          }
        }, 100);
      } else {
        // Landing to Landing scroll
        const element = document.getElementById(`${id}-section`);
        if (element) {
          // Lock observer
          isManualScrolling.current = true;
          setActiveNavId(id); // Instant visual update
          
          element.scrollIntoView({ behavior: 'smooth' });
          
          // Unlock after animation (approx 800ms)
          setTimeout(() => {
            isManualScrolling.current = false;
          }, 800);
        }
      }
    }
  }

  return (
    <div className="bg-clan-black min-h-screen text-white font-sans selection:bg-clan-magenta selection:text-white">
      
      {/* Navigation */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/90 backdrop-blur-md py-3 border-b border-white/5' : 'bg-transparent py-6'}`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavClick('home')}>
              <img src={ASSETS.logo} alt="Clan Team" className="h-10 w-10 md:h-12 md:w-12 object-contain group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="font-display text-2xl font-bold leading-none tracking-tighter text-white">CLAN TEAM</span>
                <span className="text-[10px] text-clan-magenta uppercase tracking-[0.3em] leading-none font-bold">Football Club</span>
              </div>
            </div>

            {/* Desktop Menu with Animated Sliding Pill */}
            <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/5 backdrop-blur-sm shadow-xl">
              {navItems.map((item) => {
                const isActive = activeNavId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-pill"
                        className="absolute inset-0 bg-clan-magenta rounded-full -z-10 shadow-[0_0_15px_rgba(194,24,91,0.6)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Social / Action */}
            <div className="hidden md:flex items-center gap-4">
               <a 
                 href="https://www.instagram.com/clanteamfc" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-gray-400 hover:text-clan-magenta transition-colors"
                >
                  <Instagram size={20}/>
               </a>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-b border-white/10 absolute w-full top-full left-0 animate-fade-in shadow-2xl">
            {navItems.map((item) => (
               <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-6 py-5 border-b border-white/5 flex items-center gap-4 transition-colors ${activeNavId === item.id ? 'bg-clan-magenta/10 text-white border-l-4 border-l-clan-magenta' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  <item.icon size={20} className={activeNavId === item.id ? "text-clan-magenta" : "text-gray-500"} />
                  <span className="font-display text-xl uppercase tracking-widest">{item.label}</span>
                </button>
            ))}
            {/* Mobile Social */}
            <div className="p-6 flex gap-6 justify-center bg-black/50">
                <a 
                 href="https://www.instagram.com/clanteamfc" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-gray-400 hover:text-clan-magenta transition-colors"
                >
                  <Instagram size={24}/>
               </a>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {viewMode === 'landing' ? (
          <>
            <div id="home-section"><Hero /></div>
            
            {/* Reordered to match Nav: Home -> Team -> Matches -> Gallery */}
            <div id="team-section"><TeamManager players={players} setPlayers={setPlayers} /></div>
            <div id="matches-section"><MatchesSection /></div>
            <div id="gallery-section"><GallerySection /></div>
          </>
        ) : (
          <div className="pt-24 animate-fade-in">
             <DuesSection players={players} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <img src={ASSETS.logo} className="h-20 w-20 mb-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500" />
          <h4 className="font-display text-4xl text-white mb-2">CLAN TEAM F.C.</h4>
          <p className="text-gray-500 mb-8 max-w-md">
            Since 2023
          </p>
          
          <div className="flex gap-6 mb-8">
             <a 
               href="https://www.instagram.com/clanteamfc" 
               target="_blank" 
               rel="noopener noreferrer"
               className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-clan-magenta hover:text-white transition-colors cursor-pointer"
              >
               <Instagram size={20}/>
             </a>
          </div>

          <div className="text-gray-700 text-xs border-t border-white/5 w-full pt-8">
            &copy; 2025 Clan Team F.C.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
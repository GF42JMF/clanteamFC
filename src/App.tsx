import React, { useCallback, useEffect, useRef, useState } from 'react';
import Hero from './components/Hero';
import TeamManager from './components/TeamManager';
import MatchesSection from './components/MatchesSection';
import GallerySection from './components/ClubGallery';
import DuesSection from './components/ClubDues';
import MVPSection from './components/MVPSection';
import AdminAccessPanel from './components/ClubAccess';
import ClubSummary from './components/ClubSummary';
import { api, auth, invalidateClub, upsertPlayer } from './services/api';
import { ASSETS } from './constants';
import { Match, Player, UserAccount, UserRole } from './types';
import { LayoutDashboard, Users, Trophy, Image as ImageIcon, Wallet, Menu, X, Instagram, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  castMvpVote,
  deleteMatch,
  deletePlayer,
  fetchMatches,
  fetchPlayers,
  getLocalMatches,
  upsertMatch,
} from './services/api';

type AuthMode = 'login' | 'register';

const ROLE_LABELS: Record<UserRole, string> = {
  public: 'Publico',
  player: 'Jugador',
  admin: 'Admin',
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'landing' | 'dues'>('landing');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const role: UserRole = currentUser?.role ?? 'public';
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginId, setLoginId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Controls the Highlighted Pill in Nav
  const [activeNavId, setActiveNavId] = useState('home');

  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>(() => getLocalMatches());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Lock to prevent spy update during click-scroll animation
  const isManualScrolling = useRef(false);

  const refreshClub = useCallback(async () => {
    invalidateClub();
    const [nextPlayers, nextMatches] = await Promise.all([fetchPlayers(), fetchMatches()]);
    setPlayers(nextPlayers); setMatches(nextMatches);
  }, []);
  useEffect(() => {
    let mounted=true;
    Promise.all([auth.session(),fetchPlayers(),fetchMatches()]).then(([session,ps,ms])=>{
      if(!mounted)return;setCurrentUser(session.user);setMode(session.mode);setPlayers(ps);setMatches(ms);
    }).catch(e=>{if(mounted)setNotice(e.message||'No se pudo cargar el club.');});
    return()=>{mounted=false;};
  }, []);
  useEffect(()=>{if(role!=='admin'){setUsers([]);return;}auth.users().then(setUsers).catch(e=>setNotice(e.message));},[role]);
  useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),7000);return()=>clearTimeout(id);},[notice]);
  const handleSaveMatch=useCallback(async(nextMatch:Match)=>{
    await upsertMatch(nextMatch);await refreshClub();setNotice('Partido guardado en el club.');
  },[refreshClub]);
  const handleDeleteMatch=useCallback(async(id:string)=>{await deleteMatch(id);await refreshClub();setNotice('Partido quitado del listado. El registro original se conserva.');},[refreshClub]);
  const handleSavePlayer=useCallback(async(player:Player)=>{await upsertPlayer(player);await refreshClub();setNotice('Jugador guardado.');},[refreshClub]);
  const handleDeletePlayer=useCallback(async(id:string)=>{await deletePlayer(id);await refreshClub();setNotice('Jugador quitado del plantel. Su historial se conserva.');},[refreshClub]);
  const handleVote=useCallback(async(params:{matchId:string;voterUserId:string;votedPlayerId:string})=>{try{await castMvpVote(params);await refreshClub();setNotice('Voto registrado.');return true;}catch(e){setNotice(e instanceof Error?e.message:'No se pudo votar.');return false;}},[refreshClub]);
  const handleSaveUser=async(user:UserAccount)=>{try{await api('/api/users/'+encodeURIComponent(user.id),{method:'PATCH',body:JSON.stringify(user)});setUsers(await auth.users());setNotice('Acceso actualizado.');}catch(e){setNotice(e instanceof Error?e.message:'No se pudo guardar el acceso.');}};
  useEffect(() => {
    if (role !== 'admin' && viewMode === 'dues') {
      setViewMode('landing');
      setActiveNavId('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [role, viewMode]);

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

    const sections = ['home-section', 'club-section', 'team-section', 'matches-section'];
    if (role !== 'public') sections.push('mvp-section');
    sections.push('gallery-section');
    if (role === 'admin') sections.push('access-section');

    const navMap: Record<string, string> = {
      'home-section': 'home',
      'club-section': 'club',
      'team-section': 'team',
      'matches-section': 'matches',
      'mvp-section': 'mvp',
      'gallery-section': 'gallery',
      'access-section': 'access'
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
  }, [viewMode, role]);

  const navItems = [
    { id: 'home', label: 'Inicio', icon: LayoutDashboard },
    { id: 'club', label: 'El Club', icon: Trophy },
    { id: 'team', label: 'Plantilla', icon: Users },
    { id: 'matches', label: 'Resultados', icon: Trophy },
    { id: 'mvp', label: 'MVP', icon: Trophy },
    { id: 'gallery', label: 'Media', icon: ImageIcon },
    { id: 'access', label: 'Accesos', icon: Shield },
    { id: 'dues', label: 'Cuotas', icon: Wallet },
  ].filter((item) => {
    if (item.id === 'dues') return role === 'admin';
    if (item.id === 'mvp') return role !== 'public';
    if (item.id === 'access') return role === 'admin';
    return true;
  });

  const handleNavClick = (id: string) => {
    setIsMobileMenuOpen(false);

    if (id === 'dues') {
      if (role !== 'admin') {
        setIsAuthOpen(true);
        setAuthError('');
        return;
      }
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
  };

  const handleLogin = async (event:React.FormEvent) => {
    event.preventDefault();setAuthError('');
    try{const user=await auth.login(loginId,password);setCurrentUser(user);setIsAuthOpen(false);setLoginId('');setPassword('');await refreshClub();}
    catch(e){setAuthError(e instanceof Error?e.message:'No se pudo iniciar sesión.');}
  };
  const handleRegister = async (event:React.FormEvent) => {
    event.preventDefault();setAuthError('');
    try{const user=await auth.register(username,email,password);setCurrentUser(user);setIsAuthOpen(false);setUsername('');setEmail('');setPassword('');await refreshClub();}
    catch(e){setAuthError(e instanceof Error?e.message:'No se pudo crear la cuenta.');}
  };
  const handleLogout = async () => {try{await auth.logout();setCurrentUser(null);setIsAuthOpen(false);setLoginId('');setPassword('');setAuthError('');await refreshClub();}catch(e){setNotice(e instanceof Error?e.message:'No se pudo cerrar sesión.');}};
  return (
    <div className="bg-clan-black min-h-screen text-white font-sans selection:bg-clan-magenta selection:text-white">

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/60 backdrop-blur-xl py-3 border-b border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)]' : 'bg-transparent py-6'}`}
      >
        <div className="max-w-7xl mx-auto px-3">
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
            <div className="hidden md:flex items-center bg-black/50 p-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-2xl overflow-x-auto max-w-full">
              {navItems.map((item) => {
                const isActive = activeNavId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'}`}
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
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                  <span>Rol</span>
                  <span className="text-white">{ROLE_LABELS[role]}</span>
               </div>
               <button
                 onClick={() => { setIsAuthOpen(true); setAuthError(''); setAuthMode('login'); }}
                 className="px-4 py-2 text-xs uppercase tracking-widest font-bold rounded-full border border-white/10 text-white hover:border-clan-magenta hover:text-clan-magenta transition-colors"
               >
                 {role === 'public' ? 'Acceder' : 'Cambiar acceso'}
               </button>
               {role !== 'public' && (
                 <button
                   onClick={handleLogout}
                   className="px-4 py-2 text-xs uppercase tracking-widest font-bold rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                 >
                   Salir
                 </button>
               )}
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
            <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                Rol <span className="text-white ml-2">{ROLE_LABELS[role]}</span>
              </div>
              <button
                onClick={() => { setIsAuthOpen(true); setAuthError(''); setAuthMode('login'); }}
                className="px-4 py-2 text-xs uppercase tracking-widest font-bold rounded-full border border-white/10 text-white"
              >
                {role === 'public' ? 'Acceder' : 'Cambiar'}
              </button>
            </div>
            {role !== 'public' && (
              <div className="px-6 py-4 border-b border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-xs uppercase tracking-widest font-bold rounded-full border border-white/10 text-gray-400"
                >
                  Salir
                </button>
              </div>
            )}
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

      {mode==='preview'&&<div className="preview-ribbon">VISTA PREVIA LOCAL · Los cambios administrativos de prueba no se envían a Supabase.</div>}
      {notice&&<div role="status" className="club-notice" onClick={()=>setNotice('')}>{notice}</div>}
      {/* Main Content */}
      <main>
        {viewMode !== 'dues' || role !== 'admin' ? (
          <>
            <div id="home-section"><Hero /></div>
            <section id="club-section" className="relative bg-[#070707] py-24 px-4 overflow-hidden">
              <div className="absolute inset-0 bg-jersey-pattern opacity-10 pointer-events-none"></div>
              <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6">
                  <span className="text-clan-magenta uppercase tracking-[0.5em] font-bold text-xs">Historia</span>
                  <h2 className="font-display text-6xl sm:text-7xl text-white uppercase mt-4">
                    El <span className="text-transparent bg-clip-text bg-gradient-to-r from-clan-magenta to-clan-red">Club</span>
                  </h2>
                  <p className="mt-6 text-lg text-gray-300 leading-relaxed border-l-4 border-clan-magenta pl-6">
                    Fundado en 2023 por ex compañeros del Liceo América del barrio Buceo de Montevideo.
                  </p>
                  <p className="mt-4 text-lg text-gray-300 leading-relaxed border-l-4 border-clan-magenta pl-6">
                    Club de fútbol con el objetivo de competir al nivel más alto del amateur en Uruguay.
                  </p>
                </div>
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Logo antiguo</span>
                    <img
                      src={ASSETS.clubLogos.old}
                      alt="Logo antiguo"
                      className="w-48 h-48 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                      onError={(e) => { e.currentTarget.src = ASSETS.logo; }}
                    />
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">Logo renovado</span>
                    <img
                      src={ASSETS.clubLogos.renewed}
                      alt="Logo renovado"
                      className="w-48 h-48 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                      onError={(e) => { e.currentTarget.src = ASSETS.logo; }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <ClubSummary players={players} matches={matches} />
            {/* Plantilla y gestión del club */}
            <div id="team-section">
              <TeamManager
                players={players}
                setPlayers={setPlayers}
                canViewTactics={role !== 'public'}
                onDeletePlayer={handleDeletePlayer}
                canManage={role === 'admin'}
                onSavePlayer={handleSavePlayer}
              />
            </div>
            <div id="matches-section">
              <MatchesSection
                role={role}
                players={players}
                matches={matches}
                onSaveMatch={handleSaveMatch}
                onDeleteMatch={handleDeleteMatch}
              />
            </div>
            {role !== 'public' && (
              <MVPSection
                role={role}
                currentUser={currentUser}
                players={players}
                matches={matches}
                onVote={handleVote}
              />
            )}
            <div id="gallery-section"><GallerySection role={role} /></div>
            {role === 'admin' && (
              <AdminAccessPanel users={users} onSaveUser={handleSaveUser} players={players} />
            )}
          </>
        ) : (
          <div className="pt-24 animate-fade-in">
             <DuesSection players={players} />
          </div>
        )}
      </main>

      {isAuthOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-[#0b0b0b] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl uppercase">Acceso</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">
                  Rol actual: <span className="text-white">{ROLE_LABELS[role]}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAuthOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs uppercase tracking-widest font-bold ${authMode === 'login' ? 'bg-clan-magenta text-white' : 'bg-black/40 text-gray-400 border border-white/10'}`}
              >
                Ingresar
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 px-3 py-2 rounded-lg text-xs uppercase tracking-widest font-bold ${authMode === 'register' ? 'bg-clan-magenta text-white' : 'bg-black/40 text-gray-400 border border-white/10'}`}
              >
                Registrarse
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Usuario o email</label>
                  <input
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                    placeholder="Tu usuario o email"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Contraseña</label>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                  />
                </div>
                {authError && (
                  <div className="text-xs text-red-400">{authError}</div>
                )}
                <button
                  type="submit"
                  className="w-full bg-clan-magenta hover:bg-pink-700 text-white font-display text-lg uppercase py-3 tracking-wider transition-colors rounded-lg"
                >
                  Ingresar
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Usuario</label>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                    placeholder="Tu usuario"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Email</label>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Contraseña</label>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-clan-magenta"
                    placeholder="Crea una contraseña"
                    autoComplete="new-password"
                  />
                </div>
                {authError && (
                  <div className="text-xs text-red-400">{authError}</div>
                )}
                <button
                  type="submit"
                  className="w-full bg-clan-magenta hover:bg-pink-700 text-white font-display text-lg uppercase py-3 tracking-wider transition-colors rounded-lg"
                >
                  Registrarme
                </button>
              </form>
            )}

            {role !== 'public' && (
              <button
                onClick={handleLogout}
                className="w-full mt-4 px-4 py-3 text-xs uppercase tracking-widest font-bold rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
              >
                Salir
              </button>
            )}
          </div>
        </div>
      )}

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

import { Player, Match, PhotoItem } from './types';

// =================================================================================
// ASSETS DEL EQUIPO - CLAN TEAM F.C.
// =================================================================================

export const ASSETS = {
  // Logo Oficial
  logo: "https://i.postimg.cc/fbTd7RvX/Chat-GPT-Image-Dec-23-2025-12-20-57-PM.png", 

  // Logos del club (historia)
  clubLogos: {
    old: "https://i.postimg.cc/XNGpnfZD/PHOTO-2023-09-30-12-09-51-(1).jpg",
    renewed: "https://i.postimg.cc/fbTd7RvX/Chat-GPT-Image-Dec-23-2025-12-20-57-PM.png"
  },
  
  // Foto Principal (Hero)
  teamPhoto: "https://mundialitouy.com/wp-content/uploads/8-38-4.jpg", 
  
  // Foto Secundaria (Galería)
  teamPhotoCelebration: "https://mundialitouy.com/wp-content/uploads/8-37-5.jpg",

  // Galería
  gallery: {
    campeonMundialito: "https://i.postimg.cc/3rvgJ4d3/IMG-8106-(1).jpg",
  },
  
  // Fotos de jugadores
  players: {
    nicolas: "https://mundialitouy.com/wp-content/uploads/1-23-141.jpg", 
    julian: "https://mundialitouy.com/wp-content/uploads/7-19-80.jpg", 
    guilleF: "https://mundialitouy.com/wp-content/uploads/8-24-5.jpg", 
    agustin: "https://mundialitouy.com/wp-content/uploads/8-10-5.jpg", 
    gonchi: "https://i.imgur.com/XqQ3X9B.png",
    matiasPerez: "https://mundialitouy.com/wp-content/uploads/8-28-5.jpg",
    andresQuintero: "https://mundialitouy.com/wp-content/uploads/8-4-6.jpg",
    nahuelMartinez: "https://mundialitouy.com/wp-content/uploads/8-1-6.jpg",
    matiasDeGouveia: "https://mundialitouy.com/wp-content/uploads/1-25-141.jpg",
    gonzaloRamos: "https://mundialitouy.com/wp-content/uploads/1-22-141.jpg",
    sebaSosa: "https://mundialitouy.com/wp-content/uploads/1-17-140.jpg",
    guilleFigueredo: "https://mundialitouy.com/wp-content/uploads/1-43-25.jpg",
    guilleCengeri: "https://mundialitouy.com/wp-content/uploads/1-12-43.jpg",
    gastonCurbelo: "https://mundialitouy.com/wp-content/uploads/1-46-27.jpg",
    agustinRocha: "https://mundialitouy.com/wp-content/uploads/3-10-2-scaled.jpg",
    santiagoDeGouveia: "https://mundialitouy.com/wp-content/uploads/1-14-99.jpg",
    gonzaloJacques: "https://mundialitouy.com/wp-content/uploads/1-36-86.jpg",
    enzoRubin: "https://mundialitouy.com/wp-content/uploads/4-25-22.jpg",
    default: "https://ui-avatars.com/api/?background=C2185B&color=fff&size=512&font-size=0.4"
  }
};

export const STAFF_MEMBERS = [
  { id: 'dt1', name: 'Maximiliano Sarubbi', role: 'Director Técnico', image: null }, // Image null uses default avatar logic or specific asset if added later
];

export const INITIAL_PLAYERS: Player[] = [
  { id: '1', name: 'Matías De Gouveia', age: 37, phone: '666666', jerseyNumber: 1, position: 'GK', image: ASSETS.players.matiasDeGouveia, stats: { matches: 15, goals: 0, assists: 1, mvp: 2 } },
  { id: '2', name: 'Guillermo Fontes', age: 28, phone: '666666', jerseyNumber: 2, position: 'DEF', image: ASSETS.players.guilleF, stats: { matches: 18, goals: 0, assists: 3, mvp: 1 } },
  { id: '4', name: 'Gastón Pirotto', age: 24, phone: '666666', jerseyNumber: 4, position: 'MID', stats: { matches: 10, goals: 0, assists: 2, mvp: 0 } },
  { id: '5', name: 'Leandro Passerini', age: 28, phone: '666666', jerseyNumber: 6, position: 'MID', stats: { matches: 19, goals: 5, assists: 6, mvp: 3 } },
  { id: '6', name: 'Guillermo Cengeri', age: 29, phone: '666666', jerseyNumber: 7, position: 'DEF', image: ASSETS.players.guilleCengeri, stats: { matches: 16, goals: 4, assists: 4, mvp: 1 } },
  { id: '7', name: 'Gonzalo Ramos', age: 29, phone: '666666', jerseyNumber: 8, position: 'MID', image: ASSETS.players.gonzaloRamos, stats: { matches: 12, goals: 13, assists: 1, mvp: 0 } },
  { id: '8', name: 'Julián Rocha', age: 28, phone: '666666', jerseyNumber: 9, position: 'FWD', image: ASSETS.players.julian, stats: { matches: 20, goals: 39, assists: 5, mvp: 8 } },
  { id: '9', name: 'Nicolas Lopez', age: 28, phone: '123654', jerseyNumber: 10, position: 'MID', image: ASSETS.players.nicolas, stats: { matches: 20, goals: 15, assists: 12, mvp: 6 } },
  { id: '10', name: 'Guillermo Figueredo', age: 24, phone: '666666', jerseyNumber: 11, position: 'FWD', image: ASSETS.players.guilleFigueredo, stats: { matches: 8, goals: 10, assists: 1, mvp: 0 } },
  { id: '11', name: 'Agustín Werosch', age: 29, phone: '666666', jerseyNumber: 12, position: 'DEF', image: ASSETS.players.agustin, stats: { matches: 5, goals: 1, assists: 0, mvp: 0 } },
  { id: '12', name: 'Agustín Rocha', age: 27, phone: '666666', jerseyNumber: 13, position: 'MID', image: ASSETS.players.agustinRocha, stats: { matches: 11, goals: 1, assists: 2, mvp: 0 } },
  { id: '13', name: 'Gastón Curbelo', age: 29, phone: '666666', jerseyNumber: 16, position: 'MID', image: ASSETS.players.gastonCurbelo, stats: { matches: 17, goals: 3, assists: 5, mvp: 1 } },
  { id: '14', name: 'Santiago De Gouveia', age: 33, phone: '666666', jerseyNumber: 18, position: 'MID', image: ASSETS.players.santiagoDeGouveia, stats: { matches: 9, goals: 4, assists: 1, mvp: 0 } },
  { id: '15', name: 'Enzo Rubín', age: 25, phone: '66666', jerseyNumber: 19, position: 'DEF', image: ASSETS.players.enzoRubin, stats: { matches: 6, goals: 1, assists: 0, mvp: 0 } },
  { id: '16', name: 'Sebastián Sosa', age: 27, phone: '666666', jerseyNumber: 22, position: 'DEF', image: ASSETS.players.sebaSosa, stats: { matches: 13, goals: 1, assists: 1, mvp: 0 } },
  { id: '17', name: 'Gonzalo Jacques', age: 29, phone: '6662', jerseyNumber: 30, position: 'MID', image: ASSETS.players.gonzaloJacques, stats: { matches: 15, goals: 7, assists: 3, mvp: 0 } },
  { id: '18', name: 'Andrés Quintero', age: 26, phone: '66666', jerseyNumber: 44, position: 'GK', image: ASSETS.players.andresQuintero, stats: { matches: 4, goals: 0, assists: 0, mvp: 0 } },
  { id: '19', name: 'Matias Perez', age: 25, phone: '666666', jerseyNumber: 80, position: 'MID', image: ASSETS.players.matiasPerez, stats: { matches: 7, goals: 5, assists: 0, mvp: 0 } },
  { id: '20', name: 'Nahuel Martínez', age: 29, phone: '666666', jerseyNumber: 99, position: 'FWD', image: ASSETS.players.nahuelMartinez, stats: { matches: 10, goals: 24, assists: 2, mvp: 1 } },
];

export const MATCH_HISTORY: Match[] = [
  {
    id: 'm1',
    opponent: 'Real Bañil',
    date: '2025-12-04',
    result: '1 - 1',
    win: true,
    scorers: [{ playerName: 'Julian Rocha', goals: 1 }],
    location: 'El Encuentro',
    mvp: 'Cengeri'
  },
  {
    id: 'm2',
    opponent: 'Napolitanos',
    date: '2025-11-22',
    result: '3 - 5',
    win: false,
    scorers: [{ playerName: 'Julian Rocha', goals: 2 }],
    location: 'La Masia',
    mvp: 'Julian Rocha'
  },
  {
    id: 'm3',
    opponent: 'Inter de Montevideo',
    date: '2025-11-08',
    result: '2 - 2',
    win: false,
    scorers: [{ playerName: 'Julián Rocha', goals: 3 }],
    location: 'La Masia',
    mvp: 'Julian Rocha'
  }
];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

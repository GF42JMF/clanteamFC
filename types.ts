export interface Player {
  id: string;
  name: string;
  age: number;
  phone: string;
  jerseyNumber: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  image?: string;
  stats?: {
    goals: number;
    assists: number;
    matches: number;
    mvp: number;
  };
}

export interface Match {
  id: string;
  opponent: string;
  date: string;
  result: string; // e.g., "3 - 1"
  win: boolean;
  scorers: { playerName: string; goals: number }[];
  location: string;
  mvp: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  matchId?: string;
  title: string;
}

export interface MonthlyDue {
  playerId: string;
  months: {
    [key: string]: boolean; // "jan": true (paid)
  };
}
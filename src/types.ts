export interface Player {
  id: string;
  name: string;
  age: number;
  phone: string;
  jerseyNumber: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  positions?: string[];
  image?: string;
  stats?: {
    goals: number;
    assists: number;
    matches: number;
    mvp: number;
  };
}

export type UserRole = 'public' | 'player' | 'admin';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  playerId?: string;
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
  images?: string[];
  eligiblePlayerIds?: string[];
  voteCloseAt?: string;
  votes?: Record<string, number>;
  votedBy?: string[];
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

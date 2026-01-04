export interface Player {
  user: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  status: "pending" | "confirmed";
  team?: "A" | "B";
  joinedAt: string;
}

export interface Set {
  teamA: number;
  teamB: number;
}

export interface MatchDetails {
  _id: string;
  status: "draft" | "open" | "full" | "completed" | "cancelled";
  players: Player[];
  maxPlayers: number;
  isPublic: boolean;
  winner?: "A" | "B";
  score?: {
    sets: Set[];
  };
  playedAt?: string;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface BookingDetails {
  _id: string;
  campo: {
    name: string;
    sport: string;
    struttura: {
      name: string;
      location: {
        city: string;
        address?: string;
      };
    };
  };
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
  hasMatch?: boolean;
  matchId?: string;
  match?: MatchDetails;
}
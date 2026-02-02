export interface Player {
  user: {
    _id: string;
    name: string;
    surname: string;
    username: string;
    avatarUrl?: string;
  };
  status: "pending" | "confirmed" | "declined";
  team?: "A" | "B";
  joinedAt: string;
}

export interface Set {
  teamA: number;
  teamB: number;
}

export interface MatchDetails {
  _id: string;
  status: "open" | "full" | "completed" | "cancelled" | "not_team_completed" | "not_completed";
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
    _id?: string;
    name: string;
    sport: string;
    struttura: {
      _id: string;
      name: string;
      location: {
        city: string;
        address?: string;
      };
    };
  };
  user?: {
    _id: string;
    name: string;
    surname: string;
    username: string;
    email?: string;
    avatarUrl?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "confirmed" | "cancelled";
  createdAt: string;
  hasMatch: true;
  matchId: string;
  match: MatchDetails;
}

export type UserRole = 'player' | 'owner';

export interface BookingScreenProps {
  role: UserRole;
  bookingId: string;
  onBack?: () => void;
}

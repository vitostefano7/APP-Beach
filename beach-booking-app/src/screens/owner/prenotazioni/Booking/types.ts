export interface Booking {
  _id: string;
  campo: {
    _id: string;
    name: string;
    sport: {
      code: string;
      name: string;
    };
    struttura: {
      _id: string;
      name: string;
      location: {
        city: string;
      };
    };
  };
  user: {
    _id: string;
    name: string;
    surname?: string;
    avatarUrl?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  payments?: Array<{
    user: string | { _id: string };
    amount: number;
    status: "pending" | "completed" | "failed" | "refunded";
  }>;
  paymentMode?: "full" | "split";
  status: "confirmed" | "cancelled";
  hasMatch?: boolean;
  matchId?: string;
  match?: {
    _id: string;
    status: string;
    maxPlayers: number;
    isPublic: boolean;
    players?: Array<{
      user: any;
      status: "confirmed" | "pending" | "declined";
      team?: "A" | "B";
    }>;
    score?: {
      winner: "A" | "B";
      sets: { teamA: number; teamB: number }[];
    };
  };
}

export interface OwnerPaginatedBookingsResponse {
  items: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
  counts: {
    all: number;
    upcoming: number;
    past: number;
    ongoing: number;
  };
}

export interface OwnerBookingsCacheEntry {
  ts: number;
  data: {
    items: Booking[];
    counts: {
      all: number;
      upcoming: number;
      past: number;
      ongoing: number;
    };
    pagination: {
      page: number;
      hasNext: boolean;
      total: number;
    };
  };
}

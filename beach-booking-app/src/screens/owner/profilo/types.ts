export interface OwnerEarnings {
  totalEarnings: number;
  earnings: Array<{
    type: string;
    amount: number;
    description?: string;
    createdAt: string;
    bookingDetails?: any;
  }>;
}

export interface User {
  id: string;
  name: string;
  surname?: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  role: string;
}

export interface ProfileResponse {
  user: User;
}

export interface Booking {
  id: string;
  status: string;
  price: number;
  user?: {
    _id: string;
    name: string;
    surname?: string;
  };
  [key: string]: any;
}

export interface Struttura {
  id: string;
  _id?: string;
  name?: string;
  openingHours?: any;
  [key: string]: any;
}

export interface Campo {
  _id: string;
  name: string;
  struttura: string;
  weeklySchedule?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
  [key: string]: any;
}

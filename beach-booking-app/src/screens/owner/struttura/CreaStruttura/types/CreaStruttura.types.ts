export interface PlaceSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    road?: string;
    postcode?: string;
  };
}

export interface SportData {
  _id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  minPlayers: number;
  maxPlayers: number;
  allowsIndoor: boolean;
  allowsOutdoor: boolean;
  recommendedSurfaces?: {
    indoor?: string[];
    outdoor?: string[];
    any?: string[];
  };
  isActive: boolean;
}

export interface TimeSlot {
  open: string;
  close: string;
}

export interface OpeningHours {
  [key: string]: { 
    closed: boolean;
    slots: TimeSlot[];
  };
}

export interface DurationPrice {
  oneHour: number;
  oneHourHalf: number;
}

export interface PricingTimeSlot {
  start: string;
  end: string;
  label: string;
  prices: DurationPrice;
  daysOfWeek?: number[];
}

export interface DateOverride {
  date: string;
  label: string;
  prices: DurationPrice;
}

export interface PeriodOverride {
  startDate: string;
  endDate: string;
  label: string;
  prices: DurationPrice;
}

export interface PricingRules {
  mode: "flat" | "advanced";
  flatPrices: DurationPrice;
  basePrices: DurationPrice;
  timeSlotPricing: {
    enabled: boolean;
    slots: PricingTimeSlot[];
  };
  dateOverrides?: {
    enabled: boolean;
    dates: DateOverride[];
  };
  periodOverrides?: {
    enabled: boolean;
    periods: PeriodOverride[];
  };
}

export interface Campo {
  id: string;
  name: string;
  sport: string; // Sport code (es. "beach_volley", "volley", "tennis", etc.)
  surface: string; // Surface type (es. "sand", "cement", "pvc", etc.)
  maxPlayers: number;
  indoor: boolean;
  pricingRules: PricingRules;
}
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

export interface OpeningHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

export interface DurationPrice {
  oneHour: number;
  oneHourHalf: number;
}

export interface TimeSlot {
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
    slots: TimeSlot[];
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
  sport: "beach_volley" | "volley" | "";
  surface: "sand" | "cement" | "pvc" | "";
  maxPlayers: number;
  indoor: boolean;
  pricingRules: PricingRules;
}
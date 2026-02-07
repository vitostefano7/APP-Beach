export type Slot = {
  time: string;
  enabled: boolean;
  _id?: string;
};

export type CalendarDay = {
  _id: string;
  campo: string;
  date: string;
  slots: Slot[];
  isClosed?: boolean;
};

export type DurationPrice = {
  oneHour: number;
  oneHourHalf: number;
};

export type TimeSlot = {
  start: string;
  end: string;
  label: string;
  prices: DurationPrice;
  daysOfWeek?: number[];
};

export type DateOverride = {
  date: string;
  label: string;
  prices: DurationPrice;
};

export type PeriodOverride = {
  startDate: string;
  endDate: string;
  label: string;
  prices: DurationPrice;
};

export type PricingRules = {
  mode: "flat" | "advanced";
  flatPrices?: DurationPrice;
  basePrices?: DurationPrice;
  timeSlotPricing?: {
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
};

export type Sport = {
  _id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  minPlayers: number;
  maxPlayers: number;
  allowsIndoor: boolean;
  allowsOutdoor: boolean;
  allowsPlayerPricing: boolean;
  isActive: boolean;
};

export type Campo = {
  _id: string;
  name: string;
  sport: Sport; // Ora popolato
  surface: "sand" | "hardcourt" | "grass" | "pvc" | "cement";
  indoor: boolean;
  pricePerHour: number;
  pricingRules?: PricingRules;
  maxPlayers: number;
  isActive: boolean;
};

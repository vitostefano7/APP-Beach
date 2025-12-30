/* =========================
   TYPES
========================= */
export type ProfileResponse = {
  profile: {
    matchesPlayed: number;
    ratingAverage?: number;
    favoriteCampo?: { name: string } | null;
  };
  preferences: {
    pushNotifications: boolean;
    darkMode: boolean;
  };
  payments: Array<{
    last4: string;
    expMonth: number;
    expYear: number;
  }>;
};

/* =========================
   HELPER FUNCTIONS
========================= */
export const getInitials = (name: string): string => {
  const parts = name.split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

export const calculatePresencePercentage = (matchesPlayed: number): number => {
  if (matchesPlayed === 0) return 0;
  return Math.round((matchesPlayed / (matchesPlayed + 2)) * 100);
};

export const getYearsActive = (createdAt: string | undefined): number => {
  if (!createdAt) return 0;
  const year = new Date(createdAt).getFullYear();
  if (isNaN(year)) return 0;
  return new Date().getFullYear() - year;
};

export const getMemberYear = (createdAt: string | undefined): string => {
  if (!createdAt) return "N/D";
  const year = new Date(createdAt).getFullYear();
  if (isNaN(year)) return "N/D";
  return year.toString();
};
/**
 * Booking Utilities
 * Helper functions per la gestione delle prenotazioni
 */

/**
 * Restituisce il nome dell'icona in base allo sport
 */
export const getSportIcon = (sport?: string): string => {
  switch (sport) {
    case "beach_volley":
      return "fitness";
    case "volley":
      return "fitness";
    case "padel":
      return "tennisball";
    case "tennis":
      return "tennisball";
    case "calcetto":
      return "football";
    default:
      return "football";
  }
};

/**
 * Formatta una data in formato italiano leggibile
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Formatta un orario da stringa HH:mm
 */
export const formatTime = (timeString: string): string => {
  return timeString;
};

/**
 * Controlla se una data è passata
 */
export const isPastDate = (dateString: string): boolean => {
  const bookingDate = new Date(dateString + "T00:00:00");
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  return bookingDate < today;
};

/**
 * Controlla se una data è futura o oggi
 */
export const isUpcomingDate = (dateString: string): boolean => {
  const bookingDate = new Date(dateString + "T00:00:00");
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  return bookingDate >= today;
};

/**
 * Estrae giorno e mese da una data
 */
export const getDateParts = (dateString: string) => {
  const date = new Date(dateString + "T00:00:00");
  return {
    day: date.toLocaleDateString("it-IT", { day: "numeric" }),
    month: date.toLocaleDateString("it-IT", { month: "short" }).toUpperCase(),
    weekday: date.toLocaleDateString("it-IT", { weekday: "long" }),
    full: date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
};

/**
 * Calcola la durata tra due orari in minuti
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
};

/**
 * Formatta la durata in ore e minuti
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}min`;
  }
};
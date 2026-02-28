import { Booking } from "./types";

export const formatSportName = (sport: string) => {
  if (!sport) return "Sport";

  switch (sport) {
    case "beach_volleyball":
    case "beach_volley":
      return "Beach Volley";
    case "volleyball":
    case "volley":
      return "Volley";
    case "calcio":
      return "Calcio";
    case "football":
      return "Football";
    case "tennis":
      return "Tennis";
    case "basket":
      return "Basket";
    case "basketball":
      return "Basketball";
    default:
      return sport.charAt(0).toUpperCase() + sport.slice(1);
  }
};

export const isPastBooking = (booking: Booking): boolean => {
  if (booking.status === "cancelled") return true;

  try {
    const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime}:00`);
    const now = new Date();
    return bookingEndDateTime < now;
  } catch (error) {
    const bookingDate = new Date(booking.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate < today;
  }
};

export const isUpcomingBooking = (booking: Booking): boolean => {
  if (booking.status === "cancelled") return false;

  try {
    const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const now = new Date();
    return bookingStartDateTime > now;
  } catch (error) {
    const bookingDate = new Date(booking.date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  }
};

export const isOngoingBooking = (booking: Booking): boolean => {
  if (booking.status === "cancelled") return false;

  try {
    const now = new Date();
    const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const bookingEndDateTime = new Date(`${booking.date}T${booking.endTime}:00`);
    return now >= bookingStartDateTime && now <= bookingEndDateTime;
  } catch (error) {
    return false;
  }
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return "Data non disponibile";
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch (error) {
    return "Data non disponibile";
  }
};

export const getPaymentModeLabel = (paymentMode?: "full" | "split") => {
  if (paymentMode === "split") return "Pagamento: Costo diviso";
  return "Pagamento: Intero";
};

export const getRegistrationCloseStatus = (booking: Booking): string => {
  try {
    const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const registrationCloseDateTime = new Date(bookingStartDateTime.getTime() - 60 * 60 * 1000);
    const now = new Date();
    const diffMs = registrationCloseDateTime.getTime() - now.getTime();
    if (diffMs <= 0) return "Tempo di registrazione scaduto";
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffDays > 1) {
      return `Chiude tra ${diffDays} giorni`;
    }
    if (diffHours > 0) {
      return `Chiude tra ${diffHours} ${diffHours === 1 ? "ora" : "ore"}`;
    }
    return `Chiude tra ${diffMinutes} minuti`;
  } catch (error) {
    return "Chiusura registrazione";
  }
};

export const getTimeStatus = (booking: Booking): string => {
  if (isPastBooking(booking)) return "Conclusa";
  if (isOngoingBooking(booking)) return "In corso";

  try {
    const bookingStartDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
    const now = new Date();
    const diffMs = bookingStartDateTime.getTime() - now.getTime();

    if (diffMs <= 0) return "Conclusa";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Tra ${diffDays} ${diffDays === 1 ? "giorno" : "giorni"}`;
    }
    if (diffHours > 0) {
      return `Tra ${diffHours} ${diffHours === 1 ? "ora" : "ore"}`;
    }
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `Tra ${diffMinutes} minuti`;
  } catch (error) {
    return "Prossima";
  }
};

export const isMatchInProgress = (booking: Booking): boolean => {
  if (!booking) return false;
  const now = new Date();
  const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
  const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
  return now >= matchDateTime && now <= matchEndTime;
};

export const isMatchPassed = (booking: Booking): boolean => {
  if (!booking) return false;
  const now = new Date();
  const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
  return now > matchEndTime;
};

export const getMatchStatus = (booking: Booking): string | null => {
  if (!booking.hasMatch && !booking.match) {
    return null;
  }

  const match = booking.match;
  if (!match) {
    return null;
  }

  const confirmedPlayers = match.players?.filter((p) => p.status === "confirmed").length || 0;
  const isPublic = match.isPublic;
  const teamsIncomplete = confirmedPlayers < match.maxPlayers;

  if (isMatchInProgress(booking) && match.status !== "completed" && match.status !== "cancelled") {
    if (isPublic && teamsIncomplete) {
      return "cancelled";
    }
    return "in_progress";
  }

  if (isMatchPassed(booking) && match.status !== "cancelled") {
    if (isPublic && teamsIncomplete) {
      return "cancelled";
    }

    if (!match.score || match.score.sets.length === 0) {
      return "not_completed";
    }

    if (match.score && match.score.sets.length > 0) {
      return "completed";
    }
  }

  if (!isMatchPassed(booking) && match.status === "open") {
    if (teamsIncomplete) {
      return "not_team_completed";
    }
  }

  return match.status;
};

export const getMatchBadgeInfo = (
  booking: Booking
): { text: string; color: string; bgColor: string; icon: string } | null => {
  if (!booking.hasMatch && !booking.match) {
    return null;
  }

  const matchStatus = getMatchStatus(booking);

  if (!matchStatus) {
    return null;
  }

  const match = booking.match;
  if (!match) {
    return null;
  }

  const confirmedPlayers = match.players?.filter((p) => p.status === "confirmed").length || 0;

  switch (matchStatus) {
    case "not_team_completed":
      return {
        text: `Team incompleti (${confirmedPlayers}/${match.maxPlayers})`,
        color: "#FF9800",
        bgColor: "#FFF3E0",
        icon: "people-outline",
      };
    case "not_completed":
      if (confirmedPlayers < (match?.maxPlayers || 0)) {
        return {
          text: `Team incompleti (${confirmedPlayers}/${match.maxPlayers})`,
          color: "#FF9800",
          bgColor: "#FFF3E0",
          icon: "people-outline",
        };
      }

      return {
        text: "Risultato mancante",
        color: "#FF9800",
        bgColor: "#FFF3E0",
        icon: "clipboard-outline",
      };
    case "cancelled":
      return {
        text: "Match cancellato",
        color: "#F44336",
        bgColor: "#FFEBEE",
        icon: "close-circle-outline",
      };
    case "in_progress":
      return {
        text: "Match in corso",
        color: "#4CAF50",
        bgColor: "#E8F5E9",
        icon: "play-circle-outline",
      };
    case "completed":
      return {
        text: "Match completato",
        color: "#4CAF50",
        bgColor: "#E8F5E9",
        icon: "trophy-outline",
      };
    case "open":
      if (confirmedPlayers < match.maxPlayers) {
        return {
          text: `Giocatori: ${confirmedPlayers}/${match.maxPlayers}`,
          color: "#2196F3",
          bgColor: "#E3F2FD",
          icon: "people-outline",
        };
      }
      return {
        text: "Match completo",
        color: "#4CAF50",
        bgColor: "#E8F5E9",
        icon: "checkmark-circle-outline",
      };
    default:
      return null;
  }
};

import API_URL from "../../../config/api";
import { BookingDetails, Player } from "../types/booking.types";

/**
 * Formatta una data nel formato italiano esteso
 */
export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formatta data e ora insieme
 */
export const formatDateTime = (dateStr: string, timeStr: string) => {
  const [hours, minutes] = timeStr.split(':');
  const date = new Date(dateStr + 'T12:00:00');
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calcola la durata tra due orari
 */
export const calculateDuration = (startTime: string, endTime: string) => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  
  if (durationMinutes === 90) return "1h 30m";
  if (durationMinutes === 60) return "1h";
  
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

/**
 * Verifica se il match è in corso
 */
export const isMatchInProgress = (booking: BookingDetails) => {
  const now = new Date();
  const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
  const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
  return now >= matchDateTime && now <= matchEndTime;
};

/**
 * Verifica se il match è passato
 */
export const isMatchPassed = (booking: BookingDetails) => {
  const now = new Date();
  const matchEndTime = new Date(`${booking.date}T${booking.endTime}`);
  return now > matchEndTime;
};

/**
 * Verifica se le registrazioni sono ancora aperte (45 min prima)
 */
export const isRegistrationOpen = (booking: BookingDetails) => {
  const now = new Date();
  const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
  const deadlineTime = new Date(matchStartTime.getTime() - (45 * 60 * 1000));
  return now < deadlineTime;
};

/**
 * Verifica se mancano meno di 24 ore all'inizio del match
 */
export const isWithin24Hours = (booking: BookingDetails) => {
  const now = new Date();
  const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
  const diffMs = matchStartTime.getTime() - now.getTime();
  const hoursDiff = diffMs / (1000 * 60 * 60);
  return hoursDiff <= 24 && hoursDiff > 0;
};

/**
 * Calcola il tempo mancante all'inizio del match
 */
export const getTimeUntilMatchStart = (booking: BookingDetails) => {
  const now = new Date();
  const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
  const diffMs = matchStartTime.getTime() - now.getTime();

  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Calcola il tempo mancante alla deadline delle registrazioni
 */
export const getTimeUntilRegistrationDeadline = (booking: BookingDetails) => {
  const now = new Date();
  const matchStartTime = new Date(`${booking.date}T${booking.startTime}`);
  const deadlineTime = new Date(matchStartTime.getTime() - (45 * 60 * 1000));
  const diffMs = deadlineTime.getTime() - now.getTime();

  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Ottiene lo stato effettivo del match considerando tempo e composizione team
 */
export const getMatchStatus = (booking: BookingDetails) => {
  const match = booking.match;
  if (!match) return "open";

  const confirmedPlayers = match.players?.filter(p => p.status === "confirmed").length || 0;
  const isPublic = match.isPublic;
  const teamsIncomplete = confirmedPlayers < match.maxPlayers;

  // Se il match è in corso
  if (isMatchInProgress(booking) && match.status !== "completed" && match.status !== "cancelled") {
    if (isPublic && teamsIncomplete) {
      return "cancelled";
    }
    return "in_progress";
  }

  // Se il match è passato
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

  // Se il match non è ancora iniziato e i team non sono completi
  if (!isMatchPassed(booking) && match.status === "open") {
    if (teamsIncomplete) {
      return "not_team_completed";
    }
  }

  return match.status;
};

/**
 * Ottiene informazioni sullo stato del match
 */
export const getMatchStatusInfo = (booking: BookingDetails) => {
  if (!booking.match) {
    return { color: "#999", text: "Nessun Match", icon: "help-circle" as const };
  }

  const effectiveStatus = getMatchStatus(booking);

  if (effectiveStatus === "in_progress") {
    return { color: "#FF9800", text: "In Corso", icon: "play-circle" as const };
  }

  switch (effectiveStatus) {
    case "completed":
      return { color: "#4CAF50", text: "Completato", icon: "trophy" as const };
    case "cancelled":
      return { color: "#F44336", text: "Cancellato", icon: "close-circle" as const };
    case "full":
      return { color: "#4CAF50", text: "Completo", icon: "checkmark-circle" as const };
    case "not_team_completed":
      return { color: "#FF9800", text: "Team non completi", icon: "people" as const };
    case "not_completed":
      return { color: "#FF9800", text: "Non completato", icon: "time" as const };
    case "open":
      return { color: "#2196F3", text: "Aperto", icon: "people" as const };
    default:
      return { color: "#999", text: effectiveStatus, icon: "help-circle" as const };
  }
};

/**
 * Ottiene i colori del team
 */
export const getTeamColors = (team: "A" | "B" | null) => {
  if (team === "A") {
    return {
      primary: "#2196F3",
      gradient: ["#2196F3", "#1976D2", "#1565C0"],
      light: "#E3F2FD",
      text: "white"
    };
  } else if (team === "B") {
    return {
      primary: "#F44336",
      gradient: ["#F44336", "#E53935", "#D32F2F"],
      light: "#FFEBEE",
      text: "white"
    };
  }
  return {
    primary: "#667eea",
    gradient: ["#667eea", "#764ba2"],
    light: "#f0f2f5",
    text: "white"
  };
};

/**
 * Ottiene l'icona del team
 */
export const getTeamIcon = (team: "A" | "B" | null) => {
  return team === "A" ? "people" : team === "B" ? "people" : "person-add";
};

/**
 * Ottiene l'ID utente da oggetto user (con fallback)
 */
export const getUserId = (user: any) => {
  return user?.id || user?._id || user?.userId;
};

/**
 * Confronta due utenti (con fallback a username/email)
 */
export const isSameUser = (user: any, targetUser: any) => {
  if (!targetUser) return false;
  
  const userId = getUserId(user);
  
  // Prima prova con ID
  if (userId && (userId === targetUser._id || userId === targetUser.id)) return true;
  
  // Fallback: confronta username
  if (user?.username && user.username === targetUser.username) return true;
  
  // Fallback: confronta email
  if (user?.email && user.email === targetUser.email) return true;
  
  // Fallback: estrai username dall'email e confronta
  if (user?.email && targetUser.username) {
    const usernameFromEmail = user.email.split('@')[0];
    if (usernameFromEmail === targetUser.username) return true;
  }
  
  // Fallback: caso inverso
  if (user?.username && targetUser.email) {
    const usernameFromEmail = targetUser.email.split('@')[0];
    if (user.username === usernameFromEmail) return true;
  }
  
  return false;
};

/**
 * Submits match score to the backend
 */
export const submitMatchScore = async (
  matchId: string,
  winner: 'A' | 'B',
  sets: { teamA: number; teamB: number }[],
  token: string
) => {
  try {
    const res = await fetch(`${API_URL}/matches/${matchId}/score`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ winner, sets }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Errore durante il salvataggio del risultato');
    }

    return await res.json();
  } catch (error: any) {
    throw error;
  }
};

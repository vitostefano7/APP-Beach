import API_URL from "../../../../../config/api";
import { BookingDetails, Player } from "./DettaglioPrenotazione.types";

export const assignPlayerToTeam = async (
  matchId: string,
  userId: string,
  team: "A" | "B" | null,
  token: string
) => {
  try {
    const res = await fetch(`${API_URL}/matches/${matchId}/players/${userId}/team`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ team }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Errore assegnazione team");
    }

    return true;
  } catch (error: any) {
    throw error;
  }
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

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

export const calculateDuration = (startTime: string, endTime: string) => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  return durationMinutes === 90 ? "1h 30m" : "1h";
};

export const searchUsers = async (query: string, booking: BookingDetails, token: string) => {
  if (query.length < 2) {
    return [];
  }

  try {
    const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const users = await res.json();
      const alreadyInMatch = booking.match.players.map((p: Player) => p.user._id);
      const filtered = users.filter((u: any) => !alreadyInMatch.includes(u._id));
      return filtered;
    }
    return [];
  } catch (error) {
    console.error("Errore ricerca:", error);
    return [];
  }
};

export const invitePlayer = async (matchId: string, username: string, token: string) => {
  const res = await fetch(`${API_URL}/matches/${matchId}/invite`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Errore invito");
  }

  return true;
};

export const respondToInvite = async (
  matchId: string, 
  response: "accept" | "decline", 
  team: "A" | "B" | undefined, 
  token: string
) => {
  const body: any = { action: response };
  if (team) body.team = team;
  
  const res = await fetch(`${API_URL}/matches/${matchId}/respond`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Errore risposta invito");
  }

  return true;
};

export const removePlayer = async (matchId: string, playerId: string, token: string) => {
  const res = await fetch(`${API_URL}/matches/${matchId}/players/${playerId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Errore rimozione giocatore");
  }

  return true;
};

export const joinMatch = async (matchId: string, team: "A" | "B", token: string) => {
  const res = await fetch(`${API_URL}/matches/${matchId}/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ team }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Errore nell'unione al match");
  }

  return true;
};

export const submitMatchScore = async (
  matchId: string,
  winner: "A" | "B",
  sets: { teamA: number; teamB: number }[],
  token: string
) => {
  const res = await fetch(`${API_URL}/matches/${matchId}/score`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ winner, sets }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Errore nel salvataggio del risultato");
  }

  return true;
};

// Funzione per lasciare il match (aggiunta)
export const leaveMatch = async (matchId: string, token: string) => {
  const res = await fetch(`${API_URL}/matches/${matchId}/leave`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Errore nell'abbandonare il match");
  }

  return true;
};

// Funzione per creare automaticamente un match (se dovesse servire)
export const createMatchForBooking = async (bookingId: string, token: string) => {
  const res = await fetch(`${API_URL}/bookings/${bookingId}/create-match`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Errore nella creazione del match");
  }

  return await res.json();
};

// Funzione per ottenere il giocatore corrente
export const getCurrentUserPlayer = (match: any, userId: string | undefined) => {
  if (!userId) return null;
  return match.players.find((p: Player) => p.user._id === userId);
};

// Funzione per verificare se l'utente è il creatore
export const isUserCreator = (match: any, userId: string | undefined) => {
  if (!userId) return false;
  return match.createdBy._id === userId;
};

// Funzione per ottenere le statistiche del match
export const getMatchStats = (match: any) => {
  const confirmedPlayers = match.players.filter((p: Player) => p.status === "confirmed");
  const pendingPlayers = match.players.filter((p: Player) => p.status === "pending");
  const teamAPlayers = confirmedPlayers.filter((p: Player) => p.team === "A");
  const teamBPlayers = confirmedPlayers.filter((p: Player) => p.team === "B");
  const unassignedPlayers = confirmedPlayers.filter((p: Player) => !p.team);

  return {
    confirmed: confirmedPlayers.length,
    pending: pendingPlayers.length,
    teamA: teamAPlayers.length,
    teamB: teamBPlayers.length,
    unassigned: unassignedPlayers.length,
    maxPlayersPerTeam: Math.floor(match.maxPlayers / 2),
  };
};

// Funzione per formattare la data di prenotazione (corretta)
export const formatBookingDateForDisplay = (booking: BookingDetails) => {
  // Usa la data della prenotazione (quando si gioca), non quando è stata creata
  const [day, month, year] = booking.date.split('/');
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
};
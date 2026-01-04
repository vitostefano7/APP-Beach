import API_URL from "../../../../../config/api";

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

export const searchUsers = async (query: string, booking: any, token: string) => {
  if (query.length < 2 || !booking?.matchId) {
    return [];
  }

  try {
    const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const users = await res.json();
      const alreadyInMatch = booking.match?.players?.map((p: any) => p.user._id) || [];
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
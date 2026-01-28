import API_URL from "../../../../../config/api";
import { Campo, CalendarDay } from "../types/field";

/* =======================
   FIELD DETAILS API
======================= */

/* ---------- CAMPI ---------- */

/**
 * 📋 Recupera i campi di una struttura
 */
export async function fetchCampiByStruttura(
  strutturaId: string
): Promise<Campo[]> {
  const res = await fetch(`${API_URL}/campi/struttura/${strutturaId}`);

  if (!res.ok) {
    throw new Error(`Errore fetch campi: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * 🎾 Recupera un campo singolo (pricing aggiornato)
 */
export async function fetchCampoById(campoId: string): Promise<Campo> {
  const res = await fetch(`${API_URL}/campi/${campoId}`);

  if (!res.ok) {
    throw new Error(`Errore fetch campo: ${res.status}`);
  }

  return res.json();
}

/* ---------- CALENDARIO ---------- */

/**
 * 📆 Recupera il calendario mensile di un campo
 */
export async function fetchCampoCalendar(
  campoId: string,
  monthStr: string
): Promise<CalendarDay[]> {
  const res = await fetch(
    `${API_URL}/campi/${campoId}/calendar?month=${monthStr}`
  );

  if (!res.ok) {
    throw new Error(`Errore fetch calendario: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/* ---------- UTENTE ---------- */

/**
 * ⭐ Preferenze utente (preferiti)
 */
export async function fetchUserPreferences(token: string) {
  const res = await fetch(`${API_URL}/users/preferences`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Errore fetch preferenze: ${res.status}`);
  }

  return res.json();
}

/**
 * ⭐ Aggiunge / rimuove struttura dai preferiti
 */
export async function toggleFavoriteStruttura(
  strutturaId: string,
  token: string,
  isCurrentlyFavorite: boolean
): Promise<void> {
  const res = await fetch(
    `${API_URL}/users/preferences/favorites/${strutturaId}`,
    {
      method: isCurrentlyFavorite ? "DELETE" : "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Errore toggle preferito: ${res.status}`);
  }
}

/* ---------- CHAT ---------- */

/**
 * 💬 Apre (o recupera) la chat con la struttura
 */
export async function openStrutturaChat(
  strutturaId: string,
  token: string
) {
  const res = await fetch(
    `${API_URL}/api/conversations/struttura/${strutturaId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Errore apertura chat: ${res.status}`);
  }

  return res.json();
}

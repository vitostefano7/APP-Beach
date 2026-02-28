import { useCallback, useState } from "react";
import API_URL from "../../../../config/api";
import {
  OwnerEarnings,
  Struttura,
  Booking,
  Campo,
  ProfileResponse,
} from "../types";

export const useOwnerProfile = (token: string | null) => {
  const [earnings, setEarnings] = useState<OwnerEarnings>({
    totalEarnings: 0,
    earnings: [],
  });
  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [campi, setCampi] = useState<Campo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setError("Token non disponibile");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profileRes, struttureRes, bookingsRes, earningsRes] = await Promise.all([
        fetch(`${API_URL}/users/me/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/strutture/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/bookings/owner`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/me/earnings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!profileRes.ok) {
        const errorText = await profileRes.text();
        throw new Error(`HTTP ${profileRes.status}: ${errorText || "Errore caricamento profilo"}`);
      }

      const profileData: ProfileResponse = await profileRes.json();
      const struttureData: Struttura[] = struttureRes.ok ? await struttureRes.json() : [];
      const bookingsData: Booking[] = bookingsRes.ok ? await bookingsRes.json() : [];

      const allCampi: Campo[] = [];
      for (const struttura of struttureData) {
        try {
          const campiRes = await fetch(
            `${API_URL}/campi/owner/struttura/${struttura._id || struttura.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (campiRes.ok) {
            const campiData = await campiRes.json();
            allCampi.push(...campiData);
          }
        } catch (err) {
          console.warn(`⚠️ Errore caricamento campi struttura ${struttura._id}:`, err);
        }
      }

      let earningsData: OwnerEarnings = { totalEarnings: 0, earnings: [] };
      if (earningsRes.ok) {
        try {
          earningsData = await earningsRes.json();
        } catch (err) {
          console.error("❌ Error parsing earnings:", err);
        }
      }

      setStrutture(struttureData);
      setBookings(bookingsData);
      setCampi(allCampi);
      setEarnings(earningsData);

      return profileData.user;
    } catch (err) {
      console.error("Fetch profile error:", err);
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { earnings, strutture, bookings, campi, loading, error, fetchProfile, setError };
};

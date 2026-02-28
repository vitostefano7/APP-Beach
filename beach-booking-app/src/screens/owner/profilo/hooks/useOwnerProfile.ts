import { useCallback, useState } from "react";
import API_URL from "../../../../config/api";
import { getCachedData, setCachedData } from "../../../../components/cache/cacheStorage";
import {
  Struttura,
  Booking,
  Campo,
  ProfileResponse,
  User,
} from "../types";

const OWNER_PROFILE_CACHE_KEY = "owner:profile:screen:v1";
const OWNER_PROFILE_CACHE_TTL_MS = 30_000;
const CAMPI_CONCURRENCY = 4;

interface OwnerProfileCachePayload {
  user: User;
  strutture: Struttura[];
  bookings: Booking[];
  campi: Campo[];
}

interface FetchProfileOptions {
  skipLoading?: boolean;
}

const fetchCampiForStrutture = async (
  token: string,
  struttureData: Struttura[]
): Promise<Campo[]> => {
  const allCampi: Campo[] = [];

  for (let index = 0; index < struttureData.length; index += CAMPI_CONCURRENCY) {
    const chunk = struttureData.slice(index, index + CAMPI_CONCURRENCY);

    const chunkResults = await Promise.allSettled(
      chunk.map(async (struttura) => {
        const strutturaId = struttura._id || struttura.id;
        if (!strutturaId) return [] as Campo[];

        const campiRes = await fetch(`${API_URL}/campi/owner/struttura/${strutturaId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!campiRes.ok) {
          return [] as Campo[];
        }

        const campiData = await campiRes.json();
        return Array.isArray(campiData) ? campiData : [];
      })
    );

    chunkResults.forEach((result) => {
      if (result.status === "fulfilled") {
        allCampi.push(...result.value);
      }
    });
  }

  return allCampi;
};

export const useOwnerProfile = (token: string | null) => {
  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [campi, setCampi] = useState<Campo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrateFromCache = useCallback(async () => {
    const cached = await getCachedData<OwnerProfileCachePayload>(
      OWNER_PROFILE_CACHE_KEY,
      OWNER_PROFILE_CACHE_TTL_MS
    );

    if (!cached) {
      return null;
    }

    setStrutture(cached.strutture || []);
    setBookings(cached.bookings || []);
    setCampi(cached.campi || []);
    setError(null);
    setLoading(false);
    setStatsLoading(false);

    return cached.user;
  }, []);

  const fetchProfile = useCallback(async ({ skipLoading = false }: FetchProfileOptions = {}) => {
    if (!token) {
      setError("Token non disponibile");
      setLoading(false);
      setStatsLoading(false);
      return;
    }

    try {
      if (!skipLoading) {
        setLoading(true);
      }
      setError(null);
      setStatsLoading(true);

      const [profileRes, struttureRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/users/me/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/strutture/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/bookings/owner`, {
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

      setStrutture(struttureData);
      setBookings(bookingsData);

      const allCampi = await fetchCampiForStrutture(token, struttureData);
      setCampi(allCampi);
      setStatsLoading(false);

      await setCachedData<OwnerProfileCachePayload>(OWNER_PROFILE_CACHE_KEY, {
        user: profileData.user,
        strutture: struttureData,
        bookings: bookingsData,
        campi: allCampi,
      });

      return profileData.user;
    } catch (err) {
      console.error("Fetch profile error:", err);
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
      setStatsLoading(false);
      throw err;
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, [token]);

  return {
    strutture,
    bookings,
    campi,
    loading,
    statsLoading,
    error,
    fetchProfile,
    hydrateFromCache,
    setError,
  };
};

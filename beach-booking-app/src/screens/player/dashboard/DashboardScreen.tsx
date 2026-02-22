import React, { useState, useContext, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  Text,
  Alert,
  FlatList,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { AuthContext } from "../../../context/AuthContext";
import API_URL from "../../../config/api";
import { useSuggestedItems } from './hooks/useSuggestedItems';
import { useGeographicMatchFiltering } from './hooks/useGeographicMatchFiltering';
import Header from "./components/Header";
// import StatsRow from "./components/StatsRow";
import NextMatchCard from "./components/NextMatchCard";
import InviteCard from "./components/InviteCard";
import RecentMatchesCarousel from "./components/RecentMatchesCarousel";
import EmptyStateCard from "./components/EmptyStateCard";
import OpenMatchCard from './components/OpenMatchCard';
import { SuggestedItemsCarousel } from './components/SuggestedItemsCarousel';
import { styles } from "./styles";

const { width: screenWidth } = Dimensions.get('window');
const DASHBOARD_FETCH_TIMEOUT_MS = 12000;
const INVITES_PREVIEW_COUNT = 3;
const INVITES_DASHBOARD_MAX_COUNT = 5;
const ENABLE_INVITES_PERF_LOGS = __DEV__;

const InviteCardTitle = ({ count, onViewAll }: { count: number, onViewAll: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={styles.sectionTitle}>Inviti in attesa</Text>
      {count > 0 && (
        <View style={styles.inviteCountBadge}>
          <Text style={styles.inviteCountText}>{count}</Text>
        </View>
      )}
    </View>
    <Pressable onPress={onViewAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={styles.sectionLink}>Vedi tutti</Text>
      <Ionicons name="chevron-forward" size={16} color="#2196F3" />
    </Pressable>
  </View>
);

const getValidPendingInvites = (invites: any[], userId: string) => {
  if (!invites || !userId) return [];
  
  return invites.filter(invite => {
    const match = invite.match || invite;
    const booking = invite.booking || match?.booking;
    const myPlayer = match?.players?.find((p: any) => p.user?._id === userId);
    const myStatus = myPlayer?.status || "unknown";
    
    if (myStatus !== "pending") {
      return false;
    }
    
    if (!booking?.date || !booking?.startTime) {
      return false;
    }
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2);
      
      const isExpired = new Date() > cutoffTime;
      
      return !isExpired;
    } catch (error) {
      console.error("Errore nel calcolo scadenza invito:", error);
      return false;
    }
  });
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextBooking, setNextBooking] = useState<any>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [showAllInvites, setShowAllInvites] = useState(false);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [openMatches, setOpenMatches] = useState<any[]>([]);
  const [openMatchesLoading, setOpenMatchesLoading] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const hasBootstrappedRef = React.useRef(false);
  const dashboardRunIdRef = React.useRef(0);
  const requestSeqRef = React.useRef(0);
  const openMatchesRequestKeyRef = React.useRef<string | null>(null);
  const openMatchesInFlightRef = React.useRef(false);
  const openMatchesDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const invitesTogglePerfRef = React.useRef<{
    startedAt: number;
    action: 'expand' | 'collapse';
    expectedCount: number;
  } | null>(null);
  
  // Hook per il filtraggio geografico
  const {
    userPreferences,
    visitedStruttureIds,
    gpsCoords,
    loadUserPreferences,
    loadVisitedStrutture,
    requestGPSLocation,
    filterMatchesByGeography,
    logFilteredMatchesDetails,
  } = useGeographicMatchFiltering(token);

  // const [stats, setStats] = useState({
  //   totalMatches: 0,
  //   wins: 0,
  //   winRate: 0,
  // });

  // Custom Hook per amici suggeriti
  const {
    suggestions: suggestedItems,
    loading: suggestionsLoading,
    error: suggestionsError,
    refetch: refreshSuggestions,
    sendFriendRequest,
    followStruttura,
  } = useSuggestedItems({ friendsLimit: 4, struttureLimit: 2, autoLoad: false });

  const fetchWithTimeout = useCallback(async (
    url: string,
    options: RequestInit = {},
    timeoutMs: number = DASHBOARD_FETCH_TIMEOUT_MS,
    label: string = 'request'
  ) => {
    const reqId = ++requestSeqRef.current;
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log(`🌐 [DASH-REQ#${reqId}] START ${label} | timeout=${timeoutMs}ms`);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      const elapsed = performance.now() - start;
      console.log(`🌐 [DASH-REQ#${reqId}] END ${label} | status=${response.status} | ${elapsed.toFixed(0)}ms`);
      return response;
    } catch (error: any) {
      const elapsed = performance.now() - start;
      if (error?.name === 'AbortError') {
        console.warn(`⏰ [DASH-REQ#${reqId}] TIMEOUT ${label} | ${elapsed.toFixed(0)}ms`);
      } else {
        console.error(`❌ [DASH-REQ#${reqId}] FAIL ${label} | ${elapsed.toFixed(0)}ms`, error);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      dashboardRunIdRef.current += 1;
      const runId = dashboardRunIdRef.current;
      console.log(`\n🔵 [FOCUS] useFocusEffect CHIAMATO | DASH#${runId}`);
      const focusStartTime = performance.now();
      const allTimings: any = {};
      
      // Funzione per stampare il resoconto
      const printReport = () => {
        const totalFocusTime = performance.now() - focusStartTime;
        const dashTimings = (window as any).__dashboardTimings || {};

        console.log("\n" + "=".repeat(50));
        console.log("📊 RESOCONTO PERFORMANCE DASHBOARD");
        console.log("=".repeat(50));
        console.log(`⏱️  Preferenze geografiche: ${typeof dashTimings.preferences === 'number' ? dashTimings.preferences.toFixed(0) + 'ms' : 'N/A'}`);
        console.log(`⏱️  Dati principali: ${typeof dashTimings.mainData === 'number' ? dashTimings.mainData.toFixed(0) + 'ms' : 'N/A'}`);
        console.log(`⏱️  Match aperti: ${typeof dashTimings.openMatches === 'number' ? dashTimings.openMatches.toFixed(0) + 'ms' : 'N/A'}`);
        console.log(`⏱️  Suggerimenti: ${typeof allTimings.suggestions === 'number' ? allTimings.suggestions.toFixed(0) + 'ms' : 'N/A'}`);
        console.log("-".repeat(50));
        console.log(`🎯 TEMPO TOTALE: ${typeof totalFocusTime === 'number' ? totalFocusTime.toFixed(0) : 0}ms (${typeof totalFocusTime === 'number' ? (totalFocusTime / 1000).toFixed(2) : 0}s)`);
        console.log("=".repeat(50) + "\n");
        console.log(`🧭 [DASH#${runId}] END focus run`);
        
        // Pulisci i dati temporanei
        delete (window as any).__dashboardTimings;
      };
      
      // Esegui tutte le operazioni e aspetta il completamento
      (async () => {
        // Carica dashboard e suggerimenti in parallelo
        const suggestionsStart = performance.now();
        const suggestionsPromise = refreshSuggestions().finally(() => {
          allTimings.suggestions = performance.now() - suggestionsStart;
        });

        await loadDashboardData();
        await suggestionsPromise;

        allTimings.suggestions = performance.now() - suggestionsStart;
        
        // Aspetta ancora un attimo per loadOpenMatches (chiamato da useEffect)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Stampa il report finale
        printReport();
      })();
    }, [])
  );

  // Richiedi GPS IMMEDIATAMENTE al mount del componente
  React.useEffect(() => {
    // Per nuovi utenti senza preferenze, il GPS è l'unico modo per mostrare match
    // Quindi lo richiediamo subito invece di aspettare 1 secondo
    requestGPSLocation();
  }, []); // Dipendenze vuote = solo al mount

  // Carica i match aperti quando cambiano le preferenze geografiche
  React.useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    const requestKey = JSON.stringify({
      gps: gpsCoords ? `${gpsCoords.lat.toFixed(3)},${gpsCoords.lng.toFixed(3)}` : null,
      preferred: userPreferences?.preferredLocation?.city || null,
      preferredCoords: userPreferences?.preferredLocation?.lat && userPreferences?.preferredLocation?.lng
        ? `${userPreferences.preferredLocation.lat.toFixed(3)},${userPreferences.preferredLocation.lng.toFixed(3)}`
        : null,
      visitedCount: visitedStruttureIds?.length || 0,
    });

    console.log(`🧭 [DASH#${dashboardRunIdRef.current}] [EFFECT-MATCH] requestKey=${requestKey}`);

    if (openMatchesRequestKeyRef.current === requestKey && openMatchesInFlightRef.current) {
      return;
    }

    if (openMatchesDebounceRef.current) {
      clearTimeout(openMatchesDebounceRef.current);
    }

    openMatchesDebounceRef.current = setTimeout(async () => {
      if (openMatchesInFlightRef.current && openMatchesRequestKeyRef.current === requestKey) {
        return;
      }

      openMatchesRequestKeyRef.current = requestKey;
      openMatchesInFlightRef.current = true;

      try {
        await loadOpenMatches();
      } finally {
        openMatchesInFlightRef.current = false;
      }
    }, 250);

    return () => {
      if (openMatchesDebounceRef.current) {
        clearTimeout(openMatchesDebounceRef.current);
      }
    };
  }, [gpsCoords, userPreferences, visitedStruttureIds, preferencesLoaded]);

  const loadDashboardData = async () => {
    console.log("\n📊 [LOAD-DASH] ========== INIZIO loadDashboardData ==========");
    const startTime = performance.now();
    const timings: Record<string, number> = {};
    
    try {
      if (!hasBootstrappedRef.current) {
        setLoading(true);
      }

      console.log("📊 [LOAD-DASH] Caricamento parallelo preferenze + dati principali...");

      const prefsStart = performance.now();
      const preferencesPromise = Promise.all([
        loadUserPreferences(),
        loadVisitedStrutture(),
      ]).finally(() => {
        timings.preferences = performance.now() - prefsStart;
        console.log(`📊 [LOAD-DASH] Preferenze caricate in ${typeof timings.preferences === 'number' ? timings.preferences.toFixed(0) : 0}ms`);
        setPreferencesLoaded(true);
      });

      const dataStart = performance.now();
      const mainDataPromise = Promise.all([
        loadNextBooking(),
        loadPendingInvites(),
        loadRecentMatchesAndStats(),
      ]).finally(() => {
        timings.mainData = performance.now() - dataStart;
        console.log(`📊 [LOAD-DASH] Dati principali caricati in ${typeof timings.mainData === 'number' ? timings.mainData.toFixed(0) : 0}ms`);
      });

      await Promise.all([preferencesPromise, mainDataPromise]);

    } catch (error) {
      console.error("❌ [LOAD-DASH] Errore caricamento dashboard:", error);
    } finally {
      timings.total = performance.now() - startTime;
      
      // Salva i tempi per il resoconto finale
      (window as any).__dashboardTimings = timings;

      console.log(`📊 [LOAD-DASH] setLoading(false) - Tempo totale: ${typeof timings.total === 'number' ? timings.total.toFixed(0) : 0}ms`);
      console.log("📊 [LOAD-DASH] ========== FINE loadDashboardData ==========\n");

      hasBootstrappedRef.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNextBooking = async () => {
    try {
      const bookingsRes = await fetchWithTimeout(`${API_URL}/bookings/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }, DASHBOARD_FETCH_TIMEOUT_MS, 'GET /bookings/me');
      
      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        
        // console.log("TUTTE le prenotazioni ricevute:", bookings.length);
        
        const now = new Date();
        
        const relevantBookings = bookings.filter((b: any) => {
          // console.log(`\n📋 Analizzo booking ${b._id}:`);
          // console.log(`   Data: ${b.date} ${b.startTime}-${b.endTime}`);
          // console.log(`   Status: ${b.status}`);
          // console.log(`   Campo: ${b.campo?.name}`);
          
          if (b.status !== "confirmed") {
            // console.log(`   ❌ ESCLUSA: status non confermato (${b.status})`);
            return false;
          }
          
          // Controlla se la partita è futura o in corso
          let isRelevantTime = false;
          try {
            const bookingStartTime = new Date(`${b.date}T${b.startTime}:00`);
            const bookingEndTime = new Date(`${b.date}T${b.endTime}:00`);
            // Include sia partite future che in corso
            isRelevantTime = bookingEndTime > now;
            // console.log(`   Ora: ${now.toLocaleString('it-IT')}`);
            // console.log(`   Fine match: ${bookingEndTime.toLocaleString('it-IT')}`);
            // console.log(`   È futura/in corso: ${isRelevantTime}`);
          } catch (error) {
            console.error("   ❌ Errore parsing data:", error);
            return false;
          }
          
          if (!isRelevantTime) {
            // console.log(`   ❌ ESCLUSA: già terminata`);
            return false;
          }
          
          const isMyBooking = b.isMyBooking;
          // console.log(`   isMyBooking: ${isMyBooking}`);
          // console.log(`   isInvitedPlayer: ${b.isInvitedPlayer}`);
          
          // Se è una prenotazione creata da me O sono un player invitato, mostrarla
          const shouldShow = isMyBooking || b.isInvitedPlayer;
          // console.log(`   Risultato finale: ${shouldShow ? '✅ INCLUSA' : '❌ ESCLUSA'} (myBooking: ${isMyBooking}, invited: ${b.isInvitedPlayer})`);
          
          return shouldShow;
        });
        
        // console.log("Prenotazioni rilevanti (mia o confermato):", relevantBookings.length);
        
        // if (relevantBookings.length === 0 && bookings.length > 0) {
        //   console.log("=== DEBUG TUTTE LE PRENOTAZIONI ===");
        //   bookings.forEach((b: any, index: number) => {
        //     console.log(`${index + 1}. ID: ${b._id}`);
        //     console.log(`   Data: ${b.date} ${b.startTime}`);
        //     console.log(`   Status: ${b.status}`);
        //     console.log(`   isMyBooking: ${b.isMyBooking}`);
        //     console.log(`   hasMatch: ${b.hasMatch}`);
        //     
        //     if (b.hasMatch && b.match && b.match.players) {
        //       const myPlayer = b.match.players.find((p: any) => {
        //         const playerUserId = p.user?._id || p.user || p.userId;
        //         return playerUserId === user?.id;
        //       });
        //       console.log(`   Mio player trovato:`, myPlayer ? 'SI' : 'NO');
        //       if (myPlayer) {
        //         console.log(`   Mio status: ${myPlayer.status}`);
        //         console.log(`   Mio team: ${myPlayer.team}`);
        //       }
        //     }
        //     console.log('---');
        //   });
        // }
        
        // ✅ ORDINA PER DATA/ORA CRESCENTE - La prima sarà la prossima partita disponibile
        relevantBookings.sort((a: any, b: any) => {
          const dateA = new Date(`${a.date}T${a.startTime}:00`).getTime();
          const dateB = new Date(`${b.date}T${b.startTime}:00`).getTime();
          return dateA - dateB;
        });
        
        // Prende solo la prima prenotazione (la più vicina nel tempo)
        setNextBooking(relevantBookings[0] || null);
        
        // if (relevantBookings.length > 0) {
        //   console.log("=== PROSSIMA PARTITA TROVATA ===");
        //   const next = relevantBookings[0];
        //   console.log("ID:", next._id);
        //   console.log("Data:", next.date);
        //   console.log("Orario:", next.startTime);
        //   console.log("Campo:", next.campo?.name);
        //   console.log("Creata da me:", next.isMyBooking);
        //   
        //   if (next.hasMatch && next.match) {
        //     const myPlayer = next.match.players?.find((p: any) => {
        //       const playerUserId = p.user?._id || p.user || p.userId;
        //       return playerUserId === user?.id;
        //     });
        //     console.log("Mio status nel match:", myPlayer?.status);
        //     console.log("Mio team nel match:", myPlayer?.team);
        //   }
        // } else {
        //   console.log("=== NESSUNA PARTITA RILEVANTE TROVATA ===");
        //   console.log("User ID:", user?.id);
        //   console.log("User name:", user?.name);
        // }
      }
    } catch (error) {
      console.error("Errore caricamento prossima prenotazione:", error);
    }
  };

  const loadPendingInvites = async () => {
    try {
      // console.log("=== CARICAMENTO INVITI PENDENTI ===");
      
      const res = await fetchWithTimeout(`${API_URL}/matches/pending-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      }, DASHBOARD_FETCH_TIMEOUT_MS, 'GET /matches/pending-invites');
      
      if (res.ok) {
        const allMatches = await res.json();
        // console.log("Tutti i match ricevuti:", allMatches.length);
        
        const pendingInvites = allMatches.filter((match: any) => {
          const myPlayer = match.players?.find((p: any) => 
            p.user?._id === user?.id
          );
          
          if (!myPlayer) {
            return false;
          }
          
          const isPendingStatus = myPlayer.status === "pending";
          const isCreator = match.createdBy?._id === user?.id;
          const isExpired = isInviteExpired(match);
          
          // console.log(`Match ${match._id}: pending=${isPendingStatus}, isCreator=${isCreator}, expired=${isExpired}`);
          
          return isPendingStatus && !isCreator && !isExpired;
        });
        
        // console.log("Inviti pendenti trovati:", pendingInvites.length);
        
        // if (pendingInvites.length > 0) {
        //   console.log("=== DEBUG DETTAGLIATO INVITI ===");
        //   pendingInvites.forEach((invite: any, index: number) => {
        //     const myPlayer = invite.players?.find((p: any) => p.user?._id === user?.id);
        //     console.log(`Invito ${index + 1}:`);
        //     console.log(`  Match ID: ${invite._id}`);
        //     console.log(`  Creato da: ${invite.createdBy?.name}`);
        //     console.log(`  Mio status: ${myPlayer?.status}`);
        //     console.log(`  Data: ${invite.booking?.date}`);
        //     console.log(`  Orario: ${invite.booking?.startTime}`);
        //   });
        // } else {
        //   console.log("❌ Nessun invito pendente trovato");
        //   console.log("User ID:", user?.id);
        //   console.log("Analisi match:");
        //   allMatches.forEach((match: any, idx: number) => {
        //     const myPlayer = match.players?.find((p: any) => p.user?._id === user?.id);
        //     console.log(`  Match ${idx + 1}: hasMyPlayer=${!!myPlayer}, myStatus=${myPlayer?.status}, isCreator=${match.createdBy?._id === user?.id}`);
        //   });
        // }
        
        setPendingInvites(pendingInvites);
      } else {
        console.error("Errore caricamento match:", res.status);
        setPendingInvites([]);
      }
    } catch (error) {
      console.error("Errore caricamento inviti:", error);
      setPendingInvites([]);
    }
  };

  const isInviteExpired = (match: any): boolean => {
    const booking = match.booking;
    if (!booking?.date || !booking?.startTime) {
      return false;
    }
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2);
      
      const now = new Date();
      return now > cutoffTime;
    } catch (error) {
      console.error("Errore nel calcolo scadenza:", error);
      return false;
    }
  };

  const loadOpenMatches = async () => {
    console.log("\n🎯 [LOAD-MATCH] ========== INIZIO loadOpenMatches ==========");
    const startTime = performance.now();
    
    try {
      setOpenMatchesLoading(true);

      // *** PRE-CHECK CRITERI GEOGRAFICI ***
      // ⚡ OTTIMIZZAZIONE: Controlla PRIMA di fare la chiamata API
      // Se non ci sono criteri geografici, evitiamo di sprecare 1.7s chiamando il server
      const hasGPS = !!gpsCoords;
      const hasPreferredCity = !!(userPreferences?.preferredLocation?.lat && userPreferences?.preferredLocation?.lng);
      const hasVisitedStructures = visitedStruttureIds && visitedStruttureIds.length > 0;
      
      // 🚀 Se non ci sono criteri, esci SUBITO senza chiamare l'API
      if (!hasGPS && !hasPreferredCity && !hasVisitedStructures) {
        setOpenMatches([]);
        return;
      }
      
      // Solo SE ci sono criteri geografici, procedi con la chiamata API
      const res = await fetchWithTimeout(`${API_URL}/matches?status=open`, {
        headers: { Authorization: `Bearer ${token}` },
      }, DASHBOARD_FETCH_TIMEOUT_MS, 'GET /matches?status=open');

      if (!res.ok) {
        console.error(`❌ [LOAD-MATCH] Errore risposta server: ${res.status}`);
        setOpenMatches([]);
        return;
      }

      const data = await res.json();
      const rawMatches = Array.isArray(data) ? data : Array.isArray(data.matches) ? data.matches : [];

      if (rawMatches.length === 0) {
        setOpenMatches([]);
        return;
      }

      // *** APPLICA FILTRO GEOGRAFICO ***
      
      // Determina modalità di filtro geografico
      let referenceLat: number | null = null;
      let referenceLng: number | null = null;
      let searchRadius = 30;
      let filterMode: 'gps' | 'preferred' | 'visited' = 'visited'; // default
      
      if (gpsCoords) {
        referenceLat = gpsCoords.lat;
        referenceLng = gpsCoords.lng;
        searchRadius = 30;
        filterMode = 'gps';
      } else if (userPreferences?.preferredLocation?.lat && userPreferences?.preferredLocation?.lng) {
        referenceLat = userPreferences.preferredLocation.lat;
        referenceLng = userPreferences.preferredLocation.lng;
        searchRadius = userPreferences.preferredLocation.radius || 30;
        filterMode = 'preferred';
      } else if (visitedStruttureIds && visitedStruttureIds.length > 0) {
        filterMode = 'visited';
      }
      
      // Applica il filtro geografico
      const geoFiltered = rawMatches.filter((match: any) => {
        const structureLat = match.booking?.campo?.struttura?.location?.lat;
        const structureLng = match.booking?.campo?.struttura?.location?.lng;
        const strutturaId = typeof match.booking?.campo?.struttura === 'object'
          ? match.booking?.campo?.struttura?._id
          : match.booking?.campo?.struttura;
        
        if (filterMode === 'gps' || filterMode === 'preferred') {
          if (referenceLat !== null && referenceLng !== null && structureLat && structureLng) {
            const R = 6371; // Raggio della Terra in km
            const dLat = (structureLat - referenceLat) * Math.PI / 180;
            const dLng = (structureLng - referenceLng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(referenceLat * Math.PI / 180) * Math.cos(structureLat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            // console.log(`📏 [Dashboard] ${match.booking?.campo?.struttura?.name || 'N/A'}: ${distance.toFixed(2)}km`);
            return distance <= searchRadius;
          }
          return false;
        } else if (filterMode === 'visited') {
          return visitedStruttureIds.includes(strutturaId);
        }
        return false;
      });
      
      if (geoFiltered.length === 0) {
        // console.log("⚠️ [Dashboard] Nessun match trovato dopo filtro geografico");
        setOpenMatches([]);
        return;
      }
      
      // console.log(`✅ [Dashboard] ${geoFiltered.length} match dopo filtro geografico`);

      const now = new Date();
      const filtered = geoFiltered.filter((match: any) => {
        if (!match?._id || match.status && ['completed', 'cancelled', 'full'].includes(match.status)) return false;
        if (match.isPublic === false) return false;

        const booking = match.booking;
        if (!booking || booking.status === 'cancelled') return false;
        if (!booking.date || !booking.startTime || !booking.endTime) return false;

        const bookingStart = new Date(`${booking.date}T${booking.startTime}:00`);
        const bookingEnd = new Date(`${booking.date}T${booking.endTime}:00`);
        if (Number.isNaN(bookingStart.getTime()) || Number.isNaN(bookingEnd.getTime())) return false;
        if (bookingEnd <= now) return false;

        const confirmedPlayers = match.players?.filter((p: any) => p.status === 'confirmed').length || 0;
        const maxPlayers = match.maxPlayers || 0;
        if (maxPlayers <= 0 || confirmedPlayers >= maxPlayers) return false;

        const alreadyJoined = match.players?.some((p: any) => p.user?._id === user?.id);
        if (alreadyJoined) return false;

        return true;
      });

      // console.log(`✅ [Dashboard] Partite dopo filtro iniziale: ${filtered.length}`);

      if (filtered.length === 0) {
        // console.log("ℹ️ [Dashboard] Nessun match disponibile dopo filtri base");
        setOpenMatches([]);
        return;
      }

      // Ordinamento per data crescente
      const sorted = filtered.sort((a, b) => {
        const dateA = a.booking?.date && a.booking?.startTime ? 
          new Date(`${a.booking.date}T${a.booking.startTime}`).getTime() : 0;
        const dateB = b.booking?.date && b.booking?.startTime ? 
          new Date(`${b.booking.date}T${b.booking.startTime}`).getTime() : 0;
        return dateA - dateB;
      });

      // Log della logica di filtraggio e ordinamento
      // console.log(`🎯 [Dashboard] Logica match aperti suggeriti:`);
      // console.log(`   - Filtrati: filtro geografico OBBLIGATORIO, partite aperte, pubbliche, non piene, non già joined`);
      // console.log(`   - Ordinati: per data crescente`);
      // console.log(`   - Mostrati: primi 10 match`);

      const finalMatches = sorted.slice(0, 10);
      console.log(`🧭 [DASH#${dashboardRunIdRef.current}] [OPEN-MATCHES] raw=${rawMatches.length} geo=${geoFiltered.length} eligible=${filtered.length} final=${finalMatches.length}`);
      setOpenMatches(finalMatches);
      
      // Log dettagliato per ogni card mostrata
      // console.log(`📋 Dettagli match dashboard mostrati (${finalMatches.length}):`);
      // finalMatches.forEach((match, index) => {
      //   const confirmedPlayers = match.players?.filter((p: any) => p.status === 'confirmed').length || 0;
      //   const maxPlayers = match.maxPlayers || 0;
      //   const struttura = match.booking?.campo?.struttura?.name || 'N/A';
      //   const citta = match.booking?.campo?.struttura?.location?.city || 'N/A';
      //   const dataOra = match.booking?.date && match.booking?.startTime ?
      //     `${match.booking.date} ${match.booking.startTime}` : 'N/A';
      //
      //   console.log(`   ${index + 1}. Match ${match._id?.slice(-6)} - ${struttura} (${citta}) - ${dataOra} - ${confirmedPlayers}/${maxPlayers} giocatori`);
      // });
      // 
      // console.log(`✅ [Dashboard] ${finalMatches.length} partite caricate e visualizzate`);
    } catch (error) {
      console.error('❌ [LOAD-MATCH] Errore caricamento partite aperte:', error);
      // In caso di errore, assicurati che la lista sia vuota
      setOpenMatches([]);
    } finally {
      const totalTime = performance.now() - startTime;
      setOpenMatchesLoading(false);
      console.log(`🎯 [LOAD-MATCH] Tempo totale: ${typeof totalTime === 'number' ? totalTime.toFixed(0) : 0}ms`);
      // Salva timing per resoconto finale
      if ((window as any).__dashboardTimings) {
        (window as any).__dashboardTimings.openMatches = totalTime;
      }
    }
  };

  const loadRecentMatchesAndStats = async () => {
    try {
      const matchesRes = await fetchWithTimeout(`${API_URL}/matches/me?status=completed`, {
        headers: { Authorization: `Bearer ${token}` },
      }, DASHBOARD_FETCH_TIMEOUT_MS, 'GET /matches/me?status=completed');
      
      if (matchesRes.ok) {
        const allMatches = await matchesRes.json();
        // console.log("Match completati ricevuti:", allMatches.length);
        
        // DEBUG: Verifica struttura
        // console.log("=== DEBUG STRUTTURA NEI MATCH ===");
        // allMatches.slice(0, 3).forEach((match: any, index: number) => {
        //   console.log(`Match ${index + 1}:`);
        //   console.log("  - Match ID:", match._id);
        //   console.log("  - Booking:", match.booking ? "presente" : "ASSENTE");
        //   console.log("  - Booking ID:", match.booking?._id);
        //   console.log("  - Campo:", match.booking?.campo ? "presente" : "ASSENTE");
        //   console.log("  - Campo name:", match.booking?.campo?.name);
        //   console.log("  - Struttura:", match.booking?.campo?.struttura ? "presente" : "ASSENTE");
        //   console.log("  - Struttura name:", match.booking?.campo?.struttura?.name);
        //   console.log("  - Score:", match.score ? "presente" : "ASSENTE");
        //   console.log("  - Score sets:", match.score?.sets?.length || 0);
        //   console.log("  - Winner:", match.winner || "non definito");
        // });
        
        const matchesWithScores = allMatches.filter((m: any) => 
          m.score?.sets?.length > 0
        );
        
        // console.log("Match con risultati:", matchesWithScores.length);
        
        const sortedMatches = matchesWithScores.sort((a: any, b: any) => {
          const dateA = new Date(a.playedAt || a.createdAt).getTime();
          const dateB = new Date(b.playedAt || b.createdAt).getTime();
          return dateB - dateA;
        });
        
        setRecentMatches(sortedMatches);

        // const myMatches = sortedMatches.filter((m: any) => {
        //   const myPlayer = m.players.find((p: any) => p.user._id === user?.id);
        //   return myPlayer && myPlayer.status === "confirmed";
        // });

        // const wins = myMatches.filter((m: any) => {
        //   const myPlayer = m.players.find((p: any) => p.user._id === user?.id);
        //   return myPlayer && myPlayer.team === m.winner;
        // }).length;

        // setStats({
        //   totalMatches: myMatches.length,
        //   wins,
        //   winRate: myMatches.length > 0 ? Math.round((wins / myMatches.length) * 100) : 0,
        // });
      }
    } catch (error) {
      console.error("Errore caricamento match:", error);
    }
  };

  const onRefresh = useCallback(() => {
    // console.log("Refresh manuale...");
    setRefreshing(true);
    loadDashboardData();
    refreshSuggestions();
  }, [refreshSuggestions]);

  const respondToInvite = useCallback(async (matchId: string, response: "accept" | "decline") => {
    try {
      // console.log("=== RISPOSTA INVITO ===");
      // console.log("Match ID:", matchId);
      // console.log("Risposta:", response);
      
      const myInvite = pendingInvites.find((inv: any) => inv._id === matchId);
      const myPlayer = myInvite?.players?.find((p: any) => p.user._id === user?.id);
      const assignedTeam = myPlayer?.team;
      
      // console.log("Team assegnato:", assignedTeam);
      
      const body: any = { action: response };
      
      if (response === "accept" && assignedTeam) {
        body.team = assignedTeam;
        // console.log("Includo team nella richiesta:", assignedTeam);
      }
      
      const res = await fetch(`${API_URL}/matches/${matchId}/respond`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // console.log("Status risposta:", res.status);
      
      if (res.ok) {
        // console.log("Invito risposto con successo");
        loadDashboardData();
      } else {
        const errorData = await res.json().catch(() => ({ message: "Errore sconosciuto" }));
        console.error("Errore risposta invito:", errorData);
        alert(errorData.message || "Errore nella risposta all'invito. Riprova.");
      }
    } catch (error) {
      console.error("Errore risposta invito:", error);
      alert("Errore nella risposta all'invito. Riprova.");
    }
  }, [pendingInvites, user?.id, token]);

  const handleViewAllInvites = useCallback(() => {
    // console.log("Navigating to all invites screen");
    navigation.navigate("TuttiInviti");
  }, [navigation]);

  const handlePressFriend = (friend: any) => {
    const friendId = friend.user?._id || friend._id;
    // console.log("Navigating to friend profile:", friendId);
    navigation.navigate("ProfiloUtente", {
      userId: friendId,
    });
  };

  const handleInviteFriend = (friendId: string) => {
    // console.log("Inviting friend:", friendId);
    Alert.alert(
      "Invita amico",
      "Vuoi invitare questo amico a una partita?",
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        {
          text: "Invita",
          onPress: () => {
            navigation.navigate("CreaPartita", {
              selectedFriendId: friendId,
            });
          }
        }
      ]
    );
  };

  const handleAddFriend = async (friendId: string, friendName: string) => {
    Alert.alert(
      "Segui utente",
      `Vuoi seguire ${friendName}?`,
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        {
          text: "Segui",
          onPress: async () => {
            try {
              const success = await sendFriendRequest(friendId);
              if (success) {
                Alert.alert("Successo", `Ora segui ${friendName}!`);
              }
            } catch (error) {
              Alert.alert("Errore", "Impossibile seguire questo utente");
            }
          }
        }
      ]
    );
  };

  const handlePressStruttura = (struttura: any) => {
    // Navigate to struttura details - pass full struttura object so target screen can use it directly
    navigation.navigate('DettaglioStruttura', { struttura });
  };

  const handleFollowStruttura = async (strutturaId: string) => {
    const struttura = suggestedItems.find(item => item.type === 'struttura' && item.data._id === strutturaId)?.data;
    if (!struttura) return;

    Alert.alert(
      "Segui struttura",
      `Vuoi seguire ${struttura.name}?`,
      [
        {
          text: "Annulla",
          style: "cancel"
        },
        {
          text: "Segui",
          onPress: async () => {
            try {
              const success = await followStruttura(strutturaId);
              if (success) {
                Alert.alert("Successo", `Ora segui ${struttura.name}!`);
              }
            } catch (error) {
              Alert.alert("Errore", "Impossibile seguire questa struttura");
            }
          }
        }
      ]
    );
  };

  const validPendingInvites = useMemo(
    () => getValidPendingInvites(pendingInvites || [], user?.id || ""),
    [pendingInvites, user?.id]
  );

  const dashboardInvites = useMemo(
    () => validPendingInvites.slice(0, INVITES_DASHBOARD_MAX_COUNT),
    [validPendingInvites]
  );

  const visibleInvites = useMemo(
    () => (showAllInvites
      ? dashboardInvites
      : dashboardInvites.slice(0, INVITES_PREVIEW_COUNT)),
    [showAllInvites, dashboardInvites]
  );

  const handleInvitesSectionLayout = useCallback(() => {
    if (!ENABLE_INVITES_PERF_LOGS) return;

    const perf = invitesTogglePerfRef.current;
    if (!perf) return;
    if (visibleInvites.length !== perf.expectedCount) return;

    const elapsed = performance.now() - perf.startedAt;
    console.log(`📈 [INVITES-PERF] ${perf.action} tap→layout: ${elapsed.toFixed(0)}ms | cards=${visibleInvites.length}`);
    invitesTogglePerfRef.current = null;
  }, [visibleInvites.length]);

  React.useEffect(() => {
    if (!ENABLE_INVITES_PERF_LOGS) return;
    console.log(
      `📈 [INVITES-PERF] snapshot | total=${validPendingInvites.length} visible=${visibleInvites.length} showAll=${showAllInvites}`
    );
  }, [showAllInvites, validPendingInvites.length, visibleInvites.length]);

  const toggleShowAllInvites = useCallback(() => {
    setShowAllInvites((current) => {
      const next = !current;

      if (ENABLE_INVITES_PERF_LOGS) {
        const expectedCount = next
          ? dashboardInvites.length
          : Math.min(dashboardInvites.length, INVITES_PREVIEW_COUNT);

        invitesTogglePerfRef.current = {
          startedAt: performance.now(),
          action: next ? 'expand' : 'collapse',
          expectedCount,
        };

        console.log(`📈 [INVITES-PERF] tap ${next ? 'expand' : 'collapse'} | targetCards=${expectedCount}`);
      }

      return next;
    });
  }, [dashboardInvites.length]);
  
  const completedMatches = recentMatches.filter((match: any) => 
    match.status === "completed" && match.score?.sets?.length > 0
  );

  const renderSuggestedItemsSection = () => {
    return (
      <SuggestedItemsCarousel
        items={suggestedItems}
        onPressFriend={handlePressFriend}
        onInviteFriend={(friendId) => {
          const friend = suggestedItems.find(item => item.type === 'friend' && item.data.user?._id === friendId)?.data;
          if (friend) {
            handleAddFriend(friendId, friend.user?.name || friend.name);
          }
        }}
        onPressStruttura={handlePressStruttura}
        onFollowStruttura={handleFollowStruttura}
        onViewAll={() => navigation.navigate("CercaAmici")}
      />
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: 'white' }]} edges={['top']}>
        <StatusBar backgroundColor="white" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Caricamento dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleJoinMatch = async (match: any) => {
    const bookingId = match.booking?._id;
    if (!bookingId) {
      Alert.alert("Errore", "ID prenotazione non disponibile");
      return;
    }
    navigation.navigate('DettaglioPrenotazione', { bookingId, openJoinModal: true });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: 'white' }]} edges={['top', 'bottom']}>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 70 }}
      >
        {refreshing && (
          <View style={{ paddingVertical: 10, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#2196F3" />
          </View>
        )}
        <Header user={user} pendingInvites={validPendingInvites} />

        {/* <StatsRow stats={stats} /> */}

        {/* Quick Action Buttons */}
        <View style={styles.quickActionsContainer}>
          <Pressable 
            style={styles.quickActionButton}
            onPress={() => {
              // Naviga alla tab Strutture del bottom tab navigator
              navigation.getParent()?.navigate("StruttureTab");
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            <Text style={styles.quickActionText}>Prenota un campo</Text>
          </Pressable>
          
          <Pressable 
            style={styles.quickActionButton}
            onPress={() => navigation.getParent()?.navigate('Social')}
          >
            <Ionicons name="people-outline" size={20} color="#2196F3" />
            <Text style={styles.quickActionText}>Community</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
      {nextBooking ? (() => {
        try {
          const now = new Date();
          const bookingStartTime = new Date(`${nextBooking.date}T${nextBooking.startTime}:00`);
          const bookingEndTime = new Date(`${nextBooking.date}T${nextBooking.endTime}:00`);
          
          if (now >= bookingStartTime && now <= bookingEndTime) {
            return "Partita in corso";
          }
        } catch (error) {
          // In caso di errore nel parsing delle date
        }
        return "La tua prossima partita";
      })() : "La tua prossima partita"}
    </Text>
            
            <Pressable onPress={() => navigation.navigate("LeMiePrenotazioni", { fromDashboard: true })}>
              <Text style={styles.sectionLink}>Calendario</Text>
            </Pressable>
          </View>
          
          {nextBooking ? (
            <NextMatchCard
              booking={nextBooking}
              onPress={() =>
                navigation.navigate("DettaglioPrenotazione", {
                  bookingId: nextBooking._id,
                })
              }
            />
          ) : (
            <EmptyStateCard
              icon="calendar-outline"
              title="Nessuna partita in programma"
              subtitle="Prenota un campo o unisciti a una partita"
              buttonText="Prenota ora"
              onPress={() => navigation.navigate("Strutture")}
              type="booking"
            />
          )}
        </View>

        {/* Inviti in attesa - mostrati prima delle partite aperte */}
        {validPendingInvites.length > 0 && (
          <View style={styles.section} onLayout={handleInvitesSectionLayout}>
            <View style={styles.sectionHeader}>
              <InviteCardTitle 
                count={validPendingInvites.length} 
                onViewAll={handleViewAllInvites}
              />
            </View>
            
            {visibleInvites.map((invite) => (
              <InviteCard
                key={invite._id || invite.match?._id}
                invite={invite}
                userId={user?.id}
                onRespond={respondToInvite}
              />
            ))}
            
            {dashboardInvites.length > INVITES_PREVIEW_COUNT && (
              <Pressable 
                style={styles.showMoreButton}
                onPress={toggleShowAllInvites}
              >
                <Text style={styles.showMoreText}>
                  {showAllInvites ? `Mostra meno` : `Mostra altri ${dashboardInvites.length - INVITES_PREVIEW_COUNT} inviti`}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#2196F3" style={ showAllInvites ? { transform: [{ rotate: '180deg' }] } : undefined } />
              </Pressable>
            )}
          </View>
        )}

        {/* Partite Aperte */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Partite Disponibili</Text>
            <Pressable onPress={() => navigation.navigate('CercaPartita')}>
              <Text style={styles.sectionLink}>Vedi tutte</Text>
            </Pressable>
          </View>
          {openMatches.length > 0 ? (
            <FlatList
              data={openMatches}
              renderItem={({ item }) => (
                <View style={{ width: screenWidth * 0.85, marginRight: 12 }}>
                  <OpenMatchCard
                    match={item}
                    onPress={() => {
                      const bookingId = item.booking?._id;
                      if (bookingId) {
                        navigation.navigate('DettaglioPrenotazione', { bookingId, fromOpenMatch: true });
                      }
                    }}
                    onJoin={() => handleJoinMatch(item)}
                  />
                </View>
              )}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4 }}
            />
          ) : openMatchesLoading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#2196F3" />
            </View>
          ) : (
            <EmptyStateCard
              icon="search-outline"
              title={
                userPreferences?.preferredLocation?.city 
                  ? `Non ci sono partite aperte intorno a ${userPreferences.preferredLocation.city} o in strutture in cui hai già giocato`
                  : "Non ci sono partite aperte in strutture in cui hai già giocato"
              }
              subtitle={
                userPreferences?.preferredLocation?.city
                  ? "Cerca tra tutte le partite disponibili"
                  : "Cerca tra tutte le partite o imposta una città preferita"
              }
              buttonText="Cerca partite"
              buttonIcon="search-outline"
              onPress={() => navigation.navigate('CercaPartita')}
              secondaryButtonText={!userPreferences?.preferredLocation?.city ? "Preferenze" : undefined}
              secondaryButtonIcon={!userPreferences?.preferredLocation?.city ? "settings-outline" : undefined}
              onSecondaryPress={!userPreferences?.preferredLocation?.city ? () => navigation.navigate('Preferenze') : undefined}
              type="match"
            />
          )}
        </View>

        {/* Carosello Ultime Partite */}
        {completedMatches.length > 0 ? (
          (() => {
            const matchesToShow = completedMatches.slice(0, 10);
            // console.log(
            //   "======== DEBUG ULTIME PARTITE =========\n" +
            //   "Numero partite mostrate: ", matchesToShow.length,
            //   "\nID partite: ", matchesToShow.map(m => m._id),
            //   "\nTotale partite concluse con risultato: ", completedMatches.length
            // );
            return (
              <RecentMatchesCarousel
                matches={matchesToShow}
                userId={user?.id}
                onPressMatch={(bookingId) => {
                  if (bookingId) {
                    navigation.navigate("DettaglioPrenotazione", {
                      bookingId,
                    });
                  }
                }}
                onViewAll={() => navigation.navigate("Storico", { initialFilter: "past", showBackButton: true })}
              />
            );
          })()
        ) : recentMatches.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ultime Partite</Text>
              <Pressable onPress={() => navigation.navigate("Storico", { initialFilter: "past" })}>
                <Text style={styles.sectionLink}>Storico</Text>
              </Pressable>
            </View>
            <View style={styles.noCompletedMatches}>
              <Ionicons name="clipboard-outline" size={48} color="#ccc" />
              <Text style={styles.noCompletedMatchesText}>
                Nessuna partita completata con risultato
              </Text>
            </View>
          </View>
        ) : null}

        {/* Carosello Amici Suggeriti REALI */}
        {renderSuggestedItemsSection()}

      </ScrollView>
    </SafeAreaView>
  );
}

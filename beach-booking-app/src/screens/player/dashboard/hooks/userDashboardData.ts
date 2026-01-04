import { useContext, useState, useCallback } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import API_URL from "../../../../config/api";

export const useDashboardData = () => {
  const { token, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextBooking, setNextBooking] = useState<any>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMatches: 0,
    wins: 0,
    winRate: 0,
  });

  useFocusEffect(
    useCallback(() => {
      console.log("HomeScreen focus - caricamento dati...");
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log("=== INIZIO CARICAMENTO DASHBOARD ===");
      console.log("User ID:", user?.id);
      console.log("User name:", user?.name);

      // Carica prossima prenotazione
      await loadNextBooking();

      // Carica inviti pendenti - usa il nuovo metodo
      await loadPendingInvitesImproved();

      // Carica ultimi match e statistiche
      await loadRecentMatchesAndStats();

    } catch (error) {
      console.error("Errore caricamento dashboard:", error);
    } finally {
      console.log("=== FINE CARICAMENTO DASHBOARD ===");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNextBooking = async () => {
    try {
      const bookingsRes = await fetch(`${API_URL}/bookings/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        
        console.log("TUTTE le prenotazioni ricevute:", bookings.length);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = bookings
          .filter((b: any) => {
            const bookingDate = new Date(b.date);
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate >= today && b.status === "confirmed";
          })
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        console.log("Prenotazioni future confermate:", upcoming.length);
        setNextBooking(upcoming[0] || null);
      }
    } catch (error) {
      console.error("Errore caricamento prenotazioni:", error);
    }
  };

  const loadPendingInvitesImproved = async () => {
    try {
      console.log("=== CARICAMENTO INVITI MIGLIORATO ===");
      
      // Prima prova vari endpoint
      const endpoints = [
        `${API_URL}/matches/pending-invites`,
        `${API_URL}/matches/invites/pending`,
        `${API_URL}/invites/pending`,
        `${API_URL}/matches?status=draft&player=${user?.id}`,
        `${API_URL}/matches/pending-invites/me`,
      ];
      
      let invites: any[] = [];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Provando endpoint: ${endpoint}`);
          const res = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          console.log(`Status ${endpoint}:`, res.status);
          
          if (res.ok) {
            const data = await res.json();
            console.log(`Endpoint ${endpoint} successo, dati:`, data.length);
            invites = data;
            break;
          } else if (res.status !== 404) {
            console.log(`Endpoint ${endpoint} errore:`, res.status);
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} errore fetch:`, error);
        }
      }
      
      // Se nessun endpoint ha funzionato, carica tutti i match e filtra
      if (invites.length === 0) {
        console.log("Nessun endpoint specifico trovato, carico tutti i match...");
        invites = await loadPendingInvitesFromAllMatches();
      }
      
      console.log("Inviti pendenti finali:", invites.length);
      
      // Debug dettagliato degli inviti
      if (invites.length > 0) {
        console.log("=== DEBUG DETTAGLIATO INVITI ===");
        invites.forEach((invite, index) => {
          const match = invite.match || invite;
          console.log(`Invito ${index + 1}:`);
          console.log(`  Match ID: ${match._id}`);
          console.log(`  Match status: ${match.status}`);
          console.log(`  Creato da: ${match.createdBy?.name} (${match.createdBy?._id})`);
          
          if (match.players && match.players.length > 0) {
            console.log(`  Numero players: ${match.players.length}`);
            match.players.forEach((player: any, pIndex: number) => {
              console.log(`  Player ${pIndex + 1}:`);
              console.log(`    User: ${player.user?.name} (${player.user?._id})`);
              console.log(`    Status: ${player.status}`);
              console.log(`    È l'utente corrente: ${player.user?._id === user?.id}`);
            });
          }
          
          // Trova il player dell'utente corrente
          const myPlayer = match.players?.find((p: any) => p.user?._id === user?.id);
          if (myPlayer) {
            console.log(`  Mio player trovato! Status: ${myPlayer.status}`);
          } else {
            console.log(`  ERRORE: Utente corrente non trovato nei players!`);
          }
          
          if (match.booking) {
            console.log(`  Prenotazione: ${match.booking.date} ${match.booking.startTime}`);
          }
          console.log('---');
        });
      }
      
      setPendingInvites(invites);
      
    } catch (error) {
      console.error("Errore caricamento inviti migliorato:", error);
      // Fallback all'alternativa
      const fallbackInvites = await loadPendingInvitesFromAllMatches();
      setPendingInvites(fallbackInvites);
    }
  };

  const loadPendingInvitesFromAllMatches = async (): Promise<any[]> => {
    try {
      console.log("Caricamento di TUTTI i match per filtrare inviti...");
      const allMatchesRes = await fetch(`${API_URL}/matches/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (allMatchesRes.ok) {
        const allMatches = await allMatchesRes.json();
        console.log("Tutti i match ricevuti:", allMatches.length);
        
        // Log dettagliato della struttura dei primi 3 match
        if (allMatches.length > 0) {
          console.log("=== STRUTTURA DEI PRIMI 3 MATCH ===");
          allMatches.slice(0, 3).forEach((match: any, index: number) => {
            console.log(`Match ${index + 1}:`, {
              id: match._id,
              status: match.status,
              playersCount: match.players?.length || 0,
              createdBy: match.createdBy?.name,
              hasBooking: !!match.booking
            });
            
            if (match.players && match.players.length > 0) {
              match.players.forEach((player: any, pIndex: number) => {
                console.log(`  Player ${pIndex + 1}: ${player.user?.name} - Status: ${player.status}`);
              });
            }
          });
        }
        
        // Filtra match dove l'utente è invitato e non ha ancora risposto
        const pendingInvitesFromMatches = allMatches.filter((match: any) => {
          // Verifica che ci siano players
          if (!match.players || !Array.isArray(match.players)) {
            console.log(`Match ${match._id} non ha array players valido`);
            return false;
          }
          
          // Trova il player corrispondente all'utente corrente
          const myPlayer = match.players.find((p: any) => {
            // Controlla che il player abbia user e che l'ID corrisponda
            const isCurrentUser = p.user && p.user._id === user?.id;
            if (isCurrentUser) {
              console.log(`Trovato player per utente ${user?.id} in match ${match._id}: status = ${p.status}`);
            }
            return isCurrentUser;
          });
          
          // Un invito è pendente se:
          // 1. L'utente è nella lista players
          // 2. Lo status del player è "pending" (non ha ancora risposto)
          // 3. OPZIONALE: Il match è in stato "draft" o "pending" (ma non sempre)
          const isPendingInvite = myPlayer && myPlayer.status === "pending";
          
          if (myPlayer && !isPendingInvite) {
            console.log(`Match ${match._id}: Player trovato ma status = ${myPlayer.status}, non è "pending"`);
          }
          
          return isPendingInvite;
        });
        
        console.log("Inviti pendenti (filtrati da tutti i match):", pendingInvitesFromMatches.length);
        
        // Log dettagliato degli inviti trovati
        if (pendingInvitesFromMatches.length > 0) {
          console.log("=== INVITI PENDENTI TROVATI ===");
          pendingInvitesFromMatches.forEach((invite: any, index: number) => {
            const myPlayer = invite.players.find((p: any) => p.user._id === user?.id);
            console.log(`Invito ${index + 1}:`);
            console.log(`  Match ID: ${invite._id}`);
            console.log(`  Match status: ${invite.status}`);
            console.log(`  Creato da: ${invite.createdBy?.name}`);
            console.log(`  Mio status: ${myPlayer?.status}`);
            console.log(`  Numero players: ${invite.players.length}`);
          });
        }
        
        return pendingInvitesFromMatches;
      }
      return [];
    } catch (error) {
      console.error("Errore caricamento alternativa inviti:", error);
      return [];
    }
  };

  const loadRecentMatchesAndStats = async () => {
    try {
      const matchesRes = await fetch(`${API_URL}/matches/me?status=completed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (matchesRes.ok) {
        const matches = await matchesRes.json();
        console.log("Match completati ricevuti:", matches.length);
        setRecentMatches(matches.slice(0, 5));

        // Calcola statistiche
        const myMatches = matches.filter((m: any) => {
          const myPlayer = m.players.find((p: any) => p.user._id === user?.id);
          return myPlayer && myPlayer.status === "confirmed";
        });

        const wins = myMatches.filter((m: any) => {
          const myPlayer = m.players.find((p: any) => p.user._id === user?.id);
          return myPlayer && myPlayer.team === m.winner;
        }).length;

        setStats({
          totalMatches: myMatches.length,
          wins,
          winRate: myMatches.length > 0 ? Math.round((wins / myMatches.length) * 100) : 0,
        });
      }
    } catch (error) {
      console.error("Errore caricamento match:", error);
    }
  };

  const onRefresh = () => {
    console.log("Refresh manuale...");
    setRefreshing(true);
    loadDashboardData();
  };

  const respondToInvite = async (matchId: string, response: "accept" | "decline") => {
    try {
      console.log("=== RISPOSTA INVITO ===");
      console.log("Match ID:", matchId);
      console.log("Risposta:", response);
      console.log("Utente:", user?.name);
      
      // Prima vediamo lo stato attuale del match
      try {
        const matchRes = await fetch(`${API_URL}/matches/${matchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (matchRes.ok) {
          const match = await matchRes.json();
          console.log("Stato attuale del match:");
          console.log("  Match status:", match.status);
          console.log("  Players:", match.players?.length);
          
          // Trova il player corrente
          const myPlayer = match.players?.find((p: any) => p.user?._id === user?.id);
          if (myPlayer) {
            console.log("  Mio status attuale:", myPlayer.status);
          }
        }
      } catch (debugError) {
        console.log("Debug match fallito:", debugError);
      }
      
      // Prova endpoint principale
      console.log("Chiamando endpoint /respond...");
      const res = await fetch(`${API_URL}/matches/${matchId}/respond`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: response }),
      });

      console.log("Status risposta /respond:", res.status);
      
      if (res.ok) {
        const result = await res.json();
        console.log("Invito risposto con successo:", result);
        loadDashboardData();
      } else {
        const errorText = await res.text();
        console.log("Errore endpoint /respond:", errorText);
        console.log("Provo endpoint alternativo...");
        await respondToInviteAlternative(matchId, response);
      }
    } catch (error) {
      console.error("Errore risposta invito:", error);
      alert("Errore nella risposta all'invito. Riprova.");
    }
  };

  const respondToInviteAlternative = async (matchId: string, response: "accept" | "decline") => {
    try {
      console.log("Provo endpoint alternativo /players/me...");
      
      // Alternativa 1: aggiorna lo stato del player
      const updateRes = await fetch(`${API_URL}/matches/${matchId}/players/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: response === "accept" ? "confirmed" : "declined" 
        }),
      });
      
      console.log("Status risposta /players/me:", updateRes.status);
      
      if (updateRes.ok) {
        const result = await updateRes.json();
        console.log("Stato player aggiornato con successo:", result);
        loadDashboardData();
      } else {
        // Alternativa 2: prova con un endpoint generico
        console.log("Provo endpoint generico di aggiornamento match...");
        await respondToInviteDirectUpdate(matchId, response);
      }
    } catch (error) {
      console.error("Errore risposta alternativa:", error);
    }
  };

  const respondToInviteDirectUpdate = async (matchId: string, response: "accept" | "decline") => {
    try {
      // Carica il match corrente
      const matchRes = await fetch(`${API_URL}/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!matchRes.ok) throw new Error("Impossibile caricare match");
      
      const match = await matchRes.json();
      
      // Aggiorna lo stato del player corrente
      const updatedPlayers = match.players.map((player: any) => {
        if (player.user._id === user?.id) {
          return {
            ...player,
            status: response === "accept" ? "confirmed" : "declined",
            respondedAt: new Date().toISOString()
          };
        }
        return player;
      });
      
      // Aggiorna il match
      const updateRes = await fetch(`${API_URL}/matches/${matchId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          players: updatedPlayers,
          // Se tutti hanno risposto, cambia stato del match
          status: updatedPlayers.every((p: any) => p.status !== "pending") ? "confirmed" : match.status
        }),
      });
      
      if (updateRes.ok) {
        console.log("Match aggiornato direttamente con successo");
        loadDashboardData();
      } else {
        throw new Error("Impossibile aggiornare match");
      }
    } catch (error) {
      console.error("Errore aggiornamento diretto:", error);
      alert("Impossibile rispondere all'invito. Contatta l'amministratore.");
    }
  };

  return {
    loading,
    refreshing,
    nextBooking,
    pendingInvites,
    recentMatches,
    stats,
    user,
    loadDashboardData,
    onRefresh,
    respondToInvite,
  };
};
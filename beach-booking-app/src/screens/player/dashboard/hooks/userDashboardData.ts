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

      // Carica inviti pendenti
      await loadPendingInvites();

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
      
      const now = new Date();
      
      // Filtra SOLO:
      // 1. Prenotazioni create dall'utente E attive
      // 2. Partite dove l'utente è giocatore confermato
      const relevantBookings = bookings.filter((b: any) => {
        // 1. Deve essere confermata
        if (b.status !== "confirmed") {
          console.log(`Booking ${b._id}: status non confermato (${b.status})`);
          return false;
        }
        
        // 2. Controlla se è futura
        let isFuture = false;
        try {
          const bookingDateTime = new Date(`${b.date}T${b.startTime}:00`);
          isFuture = bookingDateTime > now;
        } catch (error) {
          console.error("Errore parsing data:", error);
          return false;
        }
        
        if (!isFuture) {
          console.log(`Booking ${b._id}: non è futura`);
          return false;
        }
        
        // 3. CASO A: È una prenotazione creata dall'utente
        const isMyBooking = b.isMyBooking;
        
        // DEBUG: Verifica la struttura dei dati
        console.log(`Booking ${b._id}:`);
        console.log(`  - isMyBooking: ${b.isMyBooking}`);
        console.log(`  - hasMatch: ${b.hasMatch}`);
        if (b.hasMatch && b.match) {
          console.log(`  - match.players:`, b.match.players?.length || 0);
          console.log(`  - match.players array:`, JSON.stringify(b.match.players, null, 2));
          
          // Cerca l'utente nei giocatori in modo più robusto
          const myPlayer = b.match.players?.find((p: any) => {
            // Controlla diversi modi in cui l'ID utente potrebbe essere memorizzato
            const playerUserId = p.user?._id || p.user || p.userId;
            console.log(`  - Player check: ${playerUserId} vs ${user?.id}`);
            return playerUserId === user?.id;
          });
          
          console.log(`  - myPlayer trovato:`, myPlayer ? 'SI' : 'NO');
          if (myPlayer) {
            console.log(`  - myPlayer status:`, myPlayer.status);
            console.log(`  - myPlayer team:`, myPlayer.team);
          }
        }
        
        // 4. CASO B: Ha un match e l'utente è giocatore confermato
        let isConfirmedPlayer = false;
        if (b.hasMatch && b.match && b.match.players) {
          // Cerca l'utente nei giocatori
          const myPlayer = b.match.players.find((p: any) => {
            // Verifica in tutti i modi possibili
            const playerUserId = p.user?._id || p.user || p.userId;
            return playerUserId === user?.id;
          });
          
          // Se trovato, controlla se è confermato
          if (myPlayer) {
            isConfirmedPlayer = myPlayer.status === "confirmed";
            console.log(`  - isConfirmedPlayer: ${isConfirmedPlayer} (status: ${myPlayer.status})`);
          }
        }
        
        // MOSTRA se: è una mia prenotazione OPPURE sono confermato nel match
        const shouldShow = isMyBooking || isConfirmedPlayer;
        console.log(`  - Should show: ${shouldShow} (myBooking: ${isMyBooking}, confirmed: ${isConfirmedPlayer})`);
        
        return shouldShow;
      });
      
      console.log("Prenotazioni rilevanti (mia o confermato):", relevantBookings.length);
      
      // Se non ne troviamo, vediamo quali sono tutte le prenotazioni per debug
      if (relevantBookings.length === 0 && bookings.length > 0) {
        console.log("=== DEBUG TUTTE LE PRENOTAZIONI ===");
        bookings.forEach((b: any, index: number) => {
          console.log(`${index + 1}. ID: ${b._id}`);
          console.log(`   Data: ${b.date} ${b.startTime}`);
          console.log(`   Status: ${b.status}`);
          console.log(`   isMyBooking: ${b.isMyBooking}`);
          console.log(`   hasMatch: ${b.hasMatch}`);
          
          if (b.hasMatch && b.match && b.match.players) {
            const myPlayer = b.match.players.find((p: any) => {
              const playerUserId = p.user?._id || p.user || p.userId;
              return playerUserId === user?.id;
            });
            console.log(`   Mio player trovato:`, myPlayer ? 'SI' : 'NO');
            if (myPlayer) {
              console.log(`   Mio status: ${myPlayer.status}`);
              console.log(`   Mio team: ${myPlayer.team}`);
            }
          }
          console.log('---');
        });
      }
      
      // Ordina per data/orario crescente (le più vicine per prime)
      relevantBookings.sort((a: any, b: any) => {
        const dateA = new Date(`${a.date}T${a.startTime}:00`).getTime();
        const dateB = new Date(`${b.date}T${b.startTime}:00`).getTime();
        return dateA - dateB;
      });
      
      setNextBooking(relevantBookings[0] || null);
      
      // DEBUG: Log dettagliato
      if (relevantBookings.length > 0) {
        console.log("=== PROSSIMA PARTITA TROVATA ===");
        const next = relevantBookings[0];
        console.log("ID:", next._id);
        console.log("Data:", next.date);
        console.log("Orario:", next.startTime);
        console.log("Campo:", next.campo?.name);
        console.log("Creata da me:", next.isMyBooking);
        
        if (next.hasMatch && next.match) {
          const myPlayer = next.match.players?.find((p: any) => {
            const playerUserId = p.user?._id || p.user || p.userId;
            return playerUserId === user?.id;
          });
          console.log("Mio status nel match:", myPlayer?.status);
          console.log("Mio team nel match:", myPlayer?.team);
        }
      } else {
        console.log("=== NESSUNA PARTITA RILEVANTE TROVATA ===");
        console.log("User ID:", user?.id);
        console.log("User name:", user?.name);
      }
    }
  } catch (error) {
    console.error("Errore caricamento prossima prenotazione:", error);
  }
};

  const loadPendingInvites = async () => {
    try {
      console.log("=== CARICAMENTO INVITI PENDENTI ===");
      
      // Usa SOLO l'endpoint che esiste
      const res = await fetch(`${API_URL}/matches/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const allMatches = await res.json();
        console.log("Tutti i match ricevuti:", allMatches.length);
        
        // Filtra gli inviti pendenti
        const pendingInvites = allMatches.filter((match: any) => {
          // Verifica che l'utente sia nei players
          const myPlayer = match.players?.find((p: any) => 
            p.user?._id === user?.id
          );
          
          if (!myPlayer) {
            return false; // L'utente non è in questo match
          }
          
          // Controlli per determinare se è un invito pendente:
          // 1. L'utente deve avere status "pending"
          const isPendingStatus = myPlayer.status === "pending";
          
          // 2. L'utente NON deve essere il creatore del match
          const isCreator = match.createdBy?._id === user?.id;
          
          // 3. Controlla se è scaduto (opzionale, puoi farlo anche lato client dopo)
          const isExpired = isInviteExpired(match);
          
          // È un invito pendente se:
          // - Lo status è "pending"
          // - Non è il creatore
          // - Non è scaduto (se vuoi escludere quelli scaduti)
          return isPendingStatus && !isCreator && !isExpired;
        });
        
        console.log("Inviti pendenti trovati:", pendingInvites.length);
        
        // DEBUG dettagliato
        if (pendingInvites.length > 0) {
          console.log("=== DEBUG DETTAGLIATO INVITI ===");
          pendingInvites.forEach((invite: any, index: number) => {
            const myPlayer = invite.players?.find((p: any) => p.user?._id === user?.id);
            console.log(`Invito ${index + 1}:`);
            console.log(`  Match ID: ${invite._id}`);
            console.log(`  Creato da: ${invite.createdBy?.name}`);
            console.log(`  Mio status: ${myPlayer?.status}`);
            console.log(`  Data: ${invite.booking?.date}`);
            console.log(`  Orario: ${invite.booking?.startTime}`);
          });
        }
        
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

  // Helper per verificare se un invito è scaduto
  const isInviteExpired = (match: any): boolean => {
    const booking = match.booking;
    if (!booking?.date || !booking?.startTime) {
      return false;
    }
    
    try {
      const matchDateTime = new Date(`${booking.date}T${booking.startTime}`);
      const cutoffTime = new Date(matchDateTime);
      cutoffTime.setHours(cutoffTime.getHours() - 2); // Scade 2 ore prima
      
      const now = new Date();
      return now > cutoffTime;
    } catch (error) {
      console.error("Errore nel calcolo scadenza:", error);
      return false;
    }
  };

  const loadRecentMatchesAndStats = async () => {
  try {
    const matchesRes = await fetch(`${API_URL}/matches/me?status=completed`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (matchesRes.ok) {
      const allMatches = await matchesRes.json();
      console.log("Match completati ricevuti:", allMatches.length);
      
      // Filtra solo quelli con risultati
      const matchesWithScores = allMatches.filter((m: any) => 
        m.score?.sets?.length > 0
      );
      
      console.log("Match con risultati:", matchesWithScores.length);
      
      // Ordina per data (le più recenti per prime)
      const sortedMatches = matchesWithScores.sort((a: any, b: any) => {
        const dateA = new Date(a.playedAt || a.createdAt).getTime();
        const dateB = new Date(b.playedAt || b.createdAt).getTime();
        return dateB - dateA; // Decrescente (recenti prima)
      });
      
      setRecentMatches(sortedMatches);

      // Calcola statistiche (usa tutti i match completati con risultati)
      const myMatches = sortedMatches.filter((m: any) => {
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
    
    // ✅ Trova il match per ottenere il team assegnato
    const myInvite = pendingInvites.find((inv: any) => inv._id === matchId);
    const myPlayer = myInvite?.players?.find((p: any) => p.user._id === user?.id);
    const assignedTeam = myPlayer?.team;
    
    console.log("Team assegnato:", assignedTeam);
    
    // Costruisci il body della richiesta
    const body: any = { action: response };
    
    // ✅ Se c'è un team assegnato e stai accettando, includilo
    if (response === "accept" && assignedTeam) {
      body.team = assignedTeam;
      console.log("Includo team nella richiesta:", assignedTeam);
    }
    
    const res = await fetch(`${API_URL}/matches/${matchId}/respond`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Status risposta:", res.status);
    
    if (res.ok) {
      console.log("Invito risposto con successo");
      
      // Rilancia immediatamente l'aggiornamento
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
};

  return {
    loading,
    refreshing,
    nextBooking,
    pendingInvites, // Questi ora sono solo gli inviti pendenti VALIDI
    recentMatches,
    stats,
    user,
    loadDashboardData,
    onRefresh,
    respondToInvite,
  };
};
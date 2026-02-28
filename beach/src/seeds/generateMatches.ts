// seeds/generateMatches.ts

import Match from "../models/Match";
import { randomInt, randomElement } from "./config";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function generateMatches(players: any[], campi: any[], savedBookings: any[], strutture: any[]) {
  const seedScaleRaw = Number(process.env.SEED_SCALE ?? "1");
  const seedScale = Number.isFinite(seedScaleRaw) && seedScaleRaw > 0 ? seedScaleRaw : 1;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Inizio della giornata di oggi
  const pastBookings = savedBookings.filter((b: any) => new Date(b.date) < todayStart);
  const futureBookings = savedBookings.filter((b: any) => new Date(b.date) >= todayStart);
  const campoById = new Map<string, any>(
    campi.map((campo: any) => [campo._id.toString(), campo])
  );
  const strutturaById = new Map<string, any>(
    strutture.map((struttura: any) => [struttura._id.toString(), struttura])
  );

  const bookingMetaById = new Map<string, { strutturaId: string; sportCode: string; maxPlayers: number }>();
  for (const booking of savedBookings) {
    const bookingId = booking._id.toString();
    const campo = campoById.get(booking.campo.toString());
    const sportCode = typeof campo?.sport === "object" ? campo.sport.code : campo?.sport;
    const strutturaId = booking.struttura?.toString() ?? campo?.struttura?.toString() ?? "";
    const maxPlayers = booking.numberOfPeople || campo?.maxPlayers || 4;

    bookingMetaById.set(bookingId, {
      strutturaId,
      sportCode: sportCode || "",
      maxPlayers,
    });
  }

  const matches: any[] = [];
  const matchCounters = { completed: 0, noResult: 0, inProgress: 0, open: 0, full: 0, cancelled: 0, withInvites: 0 };
  // Traccia quanti inviti ha ricevuto ogni utente (almeno 2 per utente)
  const userInviteCount = new Map<string, number>();
  players.forEach((p: any) => userInviteCount.set(p._id.toString(), 0));
  // Helper function per verificare se una struttura supporta split payment
  const canBePublicByStrutturaId = (strutturaId: string) => {
    if (!strutturaId) return false;
    return strutturaById.get(strutturaId)?.isCostSplittingEnabled || false;
  };

  const canBePublic = (booking: any) => {
    const strutturaId = booking.struttura?.toString() || bookingMetaById.get(booking._id.toString())?.strutturaId || "";
    return canBePublicByStrutturaId(strutturaId);
  };

  // Helper per ottenere maxPlayers dal booking o dal campo
  const getMaxPlayers = (booking: any) => {
    // Se il booking ha numberOfPeople (sport con pricing per giocatori), usa quello
    if (booking.numberOfPeople) {
      return booking.numberOfPeople;
    }
    
    // Altrimenti usa maxPlayers del campo
    const campo = campoById.get(booking.campo.toString());
    return campo?.maxPlayers || 4; // default 4 se campo non trovato
  };

  // ============================================
  // MATCH PASSATI COMPLETATI (con risultato)
  // Per ogni booking passato con numberOfPeople
  // ============================================
  const pastWithPeople = pastBookings.filter((b: any) => b.numberOfPeople);
  
  for (const booking of pastWithPeople) {
    const creator = booking.user;
    let maxPlayers = getMaxPlayers(booking);
    
    // ✅ Assicurati che maxPlayers sia pari per avere team bilanciati
    if (maxPlayers % 2 !== 0) {
      maxPlayers = maxPlayers - 1; // Riduci di 1 per renderlo pari
    }
    
    const playersPerTeam = maxPlayers / 2;

    const matchPlayers: any[] = [];
    const selectedPlayers: string[] = [creator.toString()];

    // Aggiungi il creatore al team A
    matchPlayers.push({
      user: creator,
      team: "A",
      status: "confirmed",
      joinedAt: new Date(booking.date),
      respondedAt: new Date(booking.date),
    });

    // Aggiungi altri giocatori fino a maxPlayers
    for (let j = 1; j < maxPlayers; j++) {
      let player: any;
      do {
        player = randomElement(players);
      } while (selectedPlayers.includes(player._id.toString()));
      selectedPlayers.push(player._id.toString());
      
      const joinDate = new Date(booking.date);
      joinDate.setHours(joinDate.getHours() - randomInt(1, 24));
      
      // ✅ Distribuzione bilanciata: primi playersPerTeam vanno in A, gli altri in B
      const currentTeamACount = j;
      const team = currentTeamACount < playersPerTeam ? "A" : "B";
      
      matchPlayers.push({
        user: player._id,
        team: team,
        status: "confirmed",
        joinedAt: joinDate,
        respondedAt: joinDate,
      });
    }

    // Genera risultato realistico in base al tipo di sport
    const sportCode = bookingMetaById.get(booking._id.toString())?.sportCode;
    const sportStr = (sportCode || '').toLowerCase();
    
    // Determina il tipo di sport
    const isSetBased = sportStr.includes('volley') || sportStr.includes('tennis') || sportStr === 'padel';
    const isPointBased = sportStr.includes('calcio') || sportStr.includes('calcetto') || 
                         sportStr.includes('calciotto') || sportStr === 'basket';
    
    let sets: any[] = [];
    let winner: 'A' | 'B' | null = null;
    
    if (isPointBased) {
      // Sport point-based: un solo punteggio finale
      // Calcio/Basket: punteggi tra 0-5 per calcio, 50-100 per basket
      let teamA, teamB;
      if (sportStr === 'basket') {
        // Basket: punteggi più alti, pareggio raro ma possibile
        teamA = randomInt(65, 95);
        teamB = randomInt(65, 95);
        // 10% possibilità di pareggio
        if (Math.random() < 0.1) {
          teamB = teamA;
        }
      } else {
        // Calcio: punteggi bassi, pareggio comune
        teamA = randomInt(0, 4);
        teamB = randomInt(0, 4);
        // 30% possibilità di pareggio
        if (Math.random() < 0.3) {
          teamB = teamA;
        }
      }
      
      sets.push({ teamA, teamB });
      winner = teamA > teamB ? "A" : (teamB > teamA ? "B" : null);
    } else {
      // Sport set-based: 2-3 set
      let winsA = 0;
      let winsB = 0;
      const maxPoints = sportStr.includes('beach') && sportStr.includes('volley') ? 21 : 
                       sportStr === 'volley' ? 25 : 6; // 6 per tennis/padel
      
      for (let s = 0; s < 3; s++) {
        if (winsA === 2 || winsB === 2) break;
        
        let teamA, teamB;
        if (maxPoints === 6) {
          // Tennis/Padel: giochi per set
          do {
            teamA = randomInt(4, 7);
            teamB = randomInt(4, 7);
          } while (teamA === teamB);
        } else {
          // Volley/Beach Volley: punti per set
          const minPoints = Math.floor(maxPoints * 0.7);
          do {
            teamA = randomInt(minPoints, maxPoints);
            teamB = randomInt(minPoints, maxPoints);
          } while (teamA === teamB);
        }
        
        sets.push({ teamA, teamB });
        if (teamA > teamB) winsA++;
        else winsB++;
      }
      winner = winsA > winsB ? "A" : "B";
    }

    matches.push({
      booking: booking._id,
      createdBy: creator,
      players: matchPlayers,
      maxPlayers: maxPlayers,
      isPublic: canBePublic(booking),
      score: { sets },
      winner: winner,
      playedAt: new Date(booking.date),
      status: "completed",
    });
    matchCounters.completed++;
  }

  // Match passati senza numberOfPeople (sport senza pricing per giocatori) - senza risultato
  const pastWithoutPeople = pastBookings.filter((b: any) => !b.numberOfPeople);
  for (const booking of pastWithoutPeople) {
    const creator = booking.user;
    // Trova il campo per ottenere maxPlayers
    const campo = campoById.get(booking.campo.toString());
    const maxPlayers = campo?.maxPlayers || 12; // default 12 se campo non trovato
    
    // Calcola il 50% dei giocatori
    const numPlayers = Math.floor(maxPlayers / 2);
    const playersPerTeam = Math.floor(numPlayers / 2);
    
    const matchPlayers: any[] = [];
    const selectedPlayers: string[] = [creator.toString()];
    
    // Aggiungi il creatore al team A
    matchPlayers.push({
      user: creator,
      team: "A",
      status: "confirmed",
      joinedAt: new Date(booking.date),
      respondedAt: new Date(booking.date),
    });
    
    // Aggiungi altri giocatori fino a numPlayers (50% di maxPlayers)
    for (let j = 1; j < numPlayers; j++) {
      let player: any;
      do {
        player = randomElement(players);
      } while (selectedPlayers.includes(player._id.toString()));
      selectedPlayers.push(player._id.toString());
      
      const joinDate = new Date(booking.date);
      joinDate.setHours(joinDate.getHours() - randomInt(1, 24));
      
      matchPlayers.push({
        user: player._id,
        team: j < playersPerTeam ? "A" : "B",
        status: "confirmed",
        joinedAt: joinDate,
        respondedAt: joinDate,
      });
    }
    
    matches.push({
      booking: booking._id,
      createdBy: creator,
      players: matchPlayers,
      maxPlayers: maxPlayers,
      isPublic: false,
      playedAt: new Date(booking.date),
      status: "not_completed",
    });
    matchCounters.noResult++;
  }

  // ============================================
  // MATCH PUBBLICI PASSATI CON TEAM INCOMPLETI (cancellati)
  // Partite pubbliche che non si sono svolte per mancanza di giocatori
  // ============================================
  // Usa solo booking che NON sono già stati usati per i match completati
  const usedPastBookingIds = new Set(matches.map(m => m.booking.toString()));
  const publicPastBookingsWithPeople = pastBookings
    .filter((b: any) => b.numberOfPeople && canBePublic(b) && !usedPastBookingIds.has(b._id.toString()))
    .slice(0, Math.floor(pastBookings.length * 0.05)); // 5% dei booking passati

  for (const booking of publicPastBookingsWithPeople) {
    const creator = booking.user;
    const maxPlayers = getMaxPlayers(booking);
    const incompletePlayerCount = Math.floor(maxPlayers * 0.6); // 60% dei giocatori necessari

    const matchPlayers: any[] = [];
    const selectedPlayers: string[] = [creator.toString()];

    // Aggiungi il creatore
    matchPlayers.push({
      user: creator,
      team: "A",
      status: "confirmed",
      joinedAt: new Date(booking.date),
      respondedAt: new Date(booking.date),
    });

    // Aggiungi altri giocatori fino a incompletePlayerCount
    for (let j = 1; j < incompletePlayerCount; j++) {
      let player: any;
      do {
        player = randomElement(players);
      } while (selectedPlayers.includes(player._id.toString()));
      selectedPlayers.push(player._id.toString());
      
      const joinDate = new Date(booking.date);
      joinDate.setHours(joinDate.getHours() - randomInt(1, 24));
      
      matchPlayers.push({
        user: player._id,
        team: j < maxPlayers / 2 ? "A" : "B",
        status: "confirmed",
        joinedAt: joinDate,
        respondedAt: joinDate,
      });
    }

    matches.push({
      booking: booking._id,
      createdBy: creator,
      players: matchPlayers,
      maxPlayers: maxPlayers,
      isPublic: true,
      playedAt: new Date(booking.date),
      status: "cancelled",
    });
    matchCounters.cancelled++;
  }

  // ============================================
  // MATCH FUTURI APERTI
  // Almeno 1 match aperto per ogni sport di ogni struttura
  // ============================================
  
  // Raggruppa i campi per struttura e sport
  const strutturaPerSport = new Map<string, Map<string, any[]>>();
  for (const campo of campi) {
    const strutturaId = campo.struttura.toString();
    const sportCode = typeof campo.sport === 'object' ? campo.sport.code : campo.sport;
    
    if (!strutturaPerSport.has(strutturaId)) {
      strutturaPerSport.set(strutturaId, new Map());
    }
    const sportMap = strutturaPerSport.get(strutturaId)!;
    if (!sportMap.has(sportCode)) {
      sportMap.set(sportCode, []);
    }
    sportMap.get(sportCode)!.push(campo);
  }
  
  // Match aperti: almeno 1 per ogni sport di ogni struttura CHE SUPPORTA SPLIT PAYMENT
  const openMatchBookings: any[] = [];
  const usedBookingIds = new Set<string>();
  const futureBookingsByStrutturaSport = new Map<string, any[]>();

  for (const booking of futureBookings) {
    const bookingId = booking._id.toString();
    const meta = bookingMetaById.get(bookingId);
    if (!meta?.strutturaId || !meta.sportCode) continue;

    const key = `${meta.strutturaId}::${meta.sportCode}`;
    if (!futureBookingsByStrutturaSport.has(key)) {
      futureBookingsByStrutturaSport.set(key, []);
    }
    futureBookingsByStrutturaSport.get(key)!.push(booking);
  }
  
  for (const [strutturaId, sportMap] of strutturaPerSport) {
    // ✅ VERIFICA CHE LA STRUTTURA SUPPORTI SPLIT PAYMENT
    if (!canBePublicByStrutturaId(strutturaId)) {
      continue; // Salta questa struttura se non supporta split payment
    }
    
    for (const [sportCode] of sportMap) {
      // Trova booking futuri per questo sport che non sono già stati usati
      const key = `${strutturaId}::${sportCode}`;
      const availableBookings = (futureBookingsByStrutturaSport.get(key) || []).filter(
        (b: any) => !usedBookingIds.has(b._id.toString())
      );
      
      if (availableBookings.length > 0) {
        const booking = randomElement(availableBookings);
        openMatchBookings.push(booking);
        usedBookingIds.add(booking._id.toString());
      }
    }
  }
  
  // Booking rimanenti per match normali
  const regularFutureBookings = futureBookings.filter((b: any) => !usedBookingIds.has(b._id.toString()));

  // Crea match aperti (organizzatore + 1 altro giocatore + inviti pending)
  for (const booking of openMatchBookings) {
    const creator = booking.user;
    const maxPlayers = getMaxPlayers(booking);
    const isPublic = canBePublic(booking);

    // Trova un altro giocatore random che ha confermato
    let otherPlayer: any;
    do {
      otherPlayer = randomElement(players);
    } while (otherPlayer._id.toString() === creator.toString());

    const matchPlayers: any[] = [
      {
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      },
      {
        user: otherPlayer._id,
        team: "B",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      },
    ];

    // Aggiungi inviti pending se pubblico (assicurati di non superare maxPlayers)
    if (isPublic) {
      const currentPlayers = matchPlayers.length;
      const availableSlots = maxPlayers - currentPlayers;
      const numInvites = availableSlots > 0 ? randomInt(1, Math.min(3, availableSlots)) : 0; // 1-3 inviti
      const selectedPlayers = [creator.toString(), otherPlayer._id.toString()];
      let teamACount = 1;
      
      for (let i = 0; i < numInvites; i++) {
        let invitedPlayer: any;
        do {
          invitedPlayer = randomElement(players);
        } while (selectedPlayers.includes(invitedPlayer._id.toString()));
        selectedPlayers.push(invitedPlayer._id.toString());
        
        matchPlayers.push({
          user: invitedPlayer._id,
          team: teamACount < maxPlayers / 2 ? "A" : "B",
          status: "pending",
          joinedAt: new Date(),
        });
        if (teamACount < maxPlayers / 2) teamACount++;
        
        // Incrementa il contatore di inviti per questo utente
        const currentCount = userInviteCount.get(invitedPlayer._id.toString()) || 0;
        userInviteCount.set(invitedPlayer._id.toString(), currentCount + 1);
      }
      matchCounters.withInvites++;
    }

    matches.push({
      booking: booking._id,
      createdBy: creator,
      players: matchPlayers,
      maxPlayers: maxPlayers,
      isPublic: isPublic,
      status: "open",
    });
    matchCounters.open++;
  }

  // ============================================
  // MATCH FUTURI NORMALI (completi o aperti)
  // ============================================
  for (const booking of regularFutureBookings) {
    const creator = booking.user;
    const maxPlayers = getMaxPlayers(booking);
    const isPublic = canBePublic(booking);
    const isFull = Math.random() > 0.5; // 50% completi, 50% aperti

    if (isFull && booking.numberOfPeople) {
      const playersPerTeam = maxPlayers / 2;
      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator.toString()];

      matchPlayers.push({
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      });

      for (let j = 1; j < maxPlayers; j++) {
        let player: any;
        do {
          player = randomElement(players);
        } while (selectedPlayers.includes(player._id.toString()));
        selectedPlayers.push(player._id.toString());
        
        matchPlayers.push({
          user: player._id,
          team: j < playersPerTeam ? "A" : "B",
          status: "confirmed",
          joinedAt: new Date(),
          respondedAt: new Date(),
        });
      }

      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: matchPlayers,
        maxPlayers: maxPlayers,
        isPublic: canBePublic(booking),
        status: "full",
      });
      matchCounters.full++;
    } else {
      // Match aperto con solo organizzatore + possibili inviti
      const matchPlayers: any[] = [
        {
          user: creator,
          team: "A",
          status: "confirmed",
          joinedAt: new Date(),
          respondedAt: new Date(),
        },
      ];

      // Aggiungi inviti pending se pubblico (assicurati di non superare maxPlayers)
      if (isPublic) {
        const currentPlayers = matchPlayers.length;
        const availableSlots = maxPlayers - currentPlayers;
        const numInvites = availableSlots > 0 ? randomInt(1, Math.min(4, availableSlots)) : 0; // 1-4 inviti
        const selectedPlayers = [creator.toString()];
        let teamACount = 1;
        
        for (let i = 0; i < numInvites; i++) {
          let invitedPlayer: any;
          do {
            invitedPlayer = randomElement(players);
          } while (selectedPlayers.includes(invitedPlayer._id.toString()));
          selectedPlayers.push(invitedPlayer._id.toString());
          
          matchPlayers.push({
            user: invitedPlayer._id,
            team: teamACount < maxPlayers / 2 ? "A" : "B",
            status: "pending",
            joinedAt: new Date(),
          });
          if (teamACount < maxPlayers / 2) teamACount++;
          
          // Incrementa il contatore di inviti per questo utente
          const currentCount = userInviteCount.get(invitedPlayer._id.toString()) || 0;
          userInviteCount.set(invitedPlayer._id.toString(), currentCount + 1);
        }
        matchCounters.withInvites++;
      }

      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: matchPlayers,
        maxPlayers: maxPlayers,
        isPublic: isPublic,
        status: "open",
      });
      matchCounters.open++;
    }
  }

  // ============================================
  // ASSICURA CHE OGNI UTENTE ABBIA ALMENO 2 INVITI
  // ============================================
  const usersNeedingInvites = players.filter((p: any) => (userInviteCount.get(p._id.toString()) || 0) < 2);
  
  if (usersNeedingInvites.length > 0) {
    console.log(`🔄 Aggiunta di inviti per ${usersNeedingInvites.length} utenti che ne hanno meno di 2...`);
    
    // Trova match pubblici aperti che possono accogliere più inviti
    const openPublicMatches = matches.filter(m => 
      m.status === "open" && 
      m.isPublic && 
      m.players.length < m.maxPlayers - 1 // lascia spazio per almeno 1 invito
    );
    
    for (const user of usersNeedingInvites) {
      const currentInvites = userInviteCount.get(user._id.toString()) || 0;
      const invitesNeeded = 2 - currentInvites;
      
      for (let i = 0; i < invitesNeeded && i < openPublicMatches.length; i++) {
        const match = openPublicMatches[i];
        
        // Verifica che l'utente non sia già nel match
        if (match.players.some((p: any) => p.user.toString() === user._id.toString())) {
          continue;
        }
        
        // Verifica che ci sia spazio
        if (match.players.length >= match.maxPlayers) {
          continue;
        }
        
        // Aggiungi l'invito
        match.players.push({
          user: user._id,
          team: match.players.filter((p: any) => p.team === "A").length < match.maxPlayers / 2 ? "A" : "B",
          status: "pending",
          joinedAt: new Date(),
        });
        
        userInviteCount.set(user._id.toString(), (userInviteCount.get(user._id.toString()) || 0) + 1);
      }
    }
  }

  // Rimuovi score e winner da match non conclusi
  for (const m of matches) {
    if (m.status !== "completed") {
      delete m.score;
      delete m.winner;
    }
  }

  // ============================================
  // MATCH APERTI EXTRA - 20 utenti con 10 partite aperte ciascuno
  // ============================================
  console.log(`🎲 Creazione match aperti extra per garantire copertura...`);
  console.time("⏱️ Extra open matches");
  const Booking = (await import("../models/Booking")).default;
  
  // Popola i campi con lo sport
  const campiPopulated = await Promise.all(
    campi.map(async (campo: any) => {
      if (!campo.sport || typeof campo.sport === 'string') {
        return await campo.populate('sport');
      }
      return campo;
    })
  );
  
  // Seleziona utenti random (scalabile via SEED_SCALE)
  const extraUsersCount = Math.max(1, Math.round(20 * seedScale));
  const extraBookingsPerUser = Math.max(1, Math.round(10 * seedScale));
  const selectedUsers = [...players].sort(() => Math.random() - 0.5).slice(0, Math.min(extraUsersCount, players.length));
  const extraBookings: any[] = [];
  
  for (const user of selectedUsers) {
    // Crea booking futuri per questo utente
    for (let i = 0; i < extraBookingsPerUser; i++) {
      // Seleziona struttura random
      const struttura = randomElement(strutture);
      if (!struttura) continue;
      
      // Seleziona campo random dalla struttura
      const campiStruttura = campiPopulated.filter((c: any) => c.struttura.toString() === struttura._id.toString());
      if (campiStruttura.length === 0) continue;
      
      const campo = randomElement(campiStruttura);
      
      // Data futura random (1-15 giorni)
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + randomInt(1, 15));
      
      // Orario e durata
      const hour = randomInt(9, 20);
      const duration = randomElement([1, 1.5]);
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = duration === 1 ? hour + 1 : hour + 1;
      const endMinutes = duration === 1.5 ? "30" : "00";
      const endTime = `${String(endHour).padStart(2, "0")}:${endMinutes}`;
      
      // Numero giocatori basato sullo sport
      const sport = campo.sport;
      let numPeople = undefined;
      
      if (sport?.allowsPlayerPricing && sport?.minPlayers) {
        const possibleCounts = [];
        for (let n = sport.minPlayers; n <= sport.maxPlayers; n += 2) {
          possibleCounts.push(n);
        }
        numPeople = randomElement(possibleCounts);
      }
      
      const totalPrice = randomInt(30, 50);
      const bookingType = numPeople ? "public" : "private";
      const paymentMode = bookingType === "public" ? "split" : "full";
      const unitPrice = numPeople ? Math.round(totalPrice / numPeople) : undefined;
      const splitInitialPayment = unitPrice ? Math.min(totalPrice, unitPrice) : Math.max(1, Math.round(totalPrice / 2));
      const payments = paymentMode === "split"
        ? [
            {
              user: user._id,
              amount: splitInitialPayment,
              method: "card",
              status: "completed",
              createdAt: new Date(),
            },
          ]
        : [];
      
      extraBookings.push({
        user: user._id,
        campo: campo._id,
        struttura: struttura._id,
        date: futureDate.toISOString().split("T")[0],
        startTime,
        endTime,
        duration,
        price: totalPrice,
        numberOfPeople: numPeople,
        unitPrice: unitPrice,
        payments,
        status: "confirmed",
        bookingType,
        paymentMode,
        ownerEarnings: totalPrice,
      });
    }
  }
  
  // Salva i booking extra
  const savedExtraBookings = await Booking.insertMany(extraBookings);
  console.log(`✅ Creati ${savedExtraBookings.length} booking extra per match aperti`);
  
  // Crea i match aperti basati su questi booking
  for (const booking of savedExtraBookings) {
    const creator = booking.user;
    const maxPlayers = getMaxPlayers(booking);
    const isPublic = canBePublic(booking._id);
    
    // Trova un altro giocatore random che ha confermato
    let otherPlayer: any;
    do {
      otherPlayer = randomElement(players);
    } while (otherPlayer._id.toString() === creator.toString());
    
    const matchPlayers: any[] = [
      {
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      },
      {
        user: otherPlayer._id,
        team: "B",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      },
    ];
    
    // Aggiungi inviti pending se pubblico
    if (isPublic) {
      const currentPlayers = matchPlayers.length;
      const availableSlots = maxPlayers - currentPlayers;
      const numInvites = availableSlots > 0 ? randomInt(1, Math.min(3, availableSlots)) : 0;
      const selectedPlayers = [creator.toString(), otherPlayer._id.toString()];
      let teamACount = 1;
      
      for (let i = 0; i < numInvites; i++) {
        let invitedPlayer: any;
        do {
          invitedPlayer = randomElement(players);
        } while (selectedPlayers.includes(invitedPlayer._id.toString()));
        selectedPlayers.push(invitedPlayer._id.toString());
        
        matchPlayers.push({
          user: invitedPlayer._id,
          team: teamACount < maxPlayers / 2 ? "A" : "B",
          status: "pending",
          joinedAt: new Date(),
        });
        if (teamACount < maxPlayers / 2) teamACount++;
        
        const currentCount = userInviteCount.get(invitedPlayer._id.toString()) || 0;
        userInviteCount.set(invitedPlayer._id.toString(), currentCount + 1);
      }
      matchCounters.withInvites++;
    }
    
    matches.push({
      booking: booking._id,
      createdBy: creator,
      players: matchPlayers,
      maxPlayers: maxPlayers,
      isPublic: isPublic,
      status: "open",
    });
    matchCounters.open++;
  }
  
  console.log(`✅ Creati ${savedExtraBookings.length} match aperti extra distribuiti tra le strutture`);
  console.timeEnd("⏱️ Extra open matches");

  // Controllo: ogni match deve avere almeno l'organizzatore in un team
  const invalidMatches = matches.filter(m => m.players.length === 0 || !m.players.some((p: any) => p.user.toString() === m.createdBy.toString()));
  if (invalidMatches.length > 0) {
    console.log(`❌ Trovati ${invalidMatches.length} match senza organizzatore o privi di giocatori`);
    invalidMatches.forEach(m => console.log(`   - Match ${m._id || 'nuovo'} per booking ${m.booking}`));
  } else {
    console.log(`✅ Tutti i match hanno almeno l'organizzatore`);
  }

  const savedMatches = await Match.insertMany(matches);
  
  // Calcola statistiche sugli inviti
  const usersWithLessThan2Invites = Array.from(userInviteCount.values()).filter(count => count < 2).length;
  const totalInvites = Array.from(userInviteCount.values()).reduce((sum, count) => sum + count, 0);
  const avgInvitesPerUser = (totalInvites / players.length).toFixed(1);
  
  console.log(`✅ Creati ${savedMatches.length} match:`);
  console.log(`   - ${matchCounters.completed} completati con risultato`);
  console.log(`   - ${matchCounters.noResult} da completare (senza risultato)`);
  console.log(`   - ${matchCounters.cancelled} cancellati (pubblici con team incompleti)`);
  console.log(`   - ${matchCounters.open} aperti`);
  console.log(`   - ${matchCounters.full} completi`);
  console.log(`   - ${matchCounters.withInvites} con inviti pending`);
  console.log(`📨 Inviti generati:`);
  console.log(`   - Totale inviti: ${totalInvites}`);
  console.log(`   - Media per utente: ${avgInvitesPerUser}`);
  console.log(`   - Utenti con meno di 2 inviti: ${usersWithLessThan2Invites}`);

  // 🔥 AGGIORNA I BOOKING CON IL RIFERIMENTO AL MATCH
  console.log(`🔄 Aggiornamento booking con riferimenti ai match...`);
  console.time("⏱️ Booking-match linking");

  const BATCH_SIZE = 1000;
  for (let i = 0; i < savedMatches.length; i += BATCH_SIZE) {
    const batch = savedMatches.slice(i, i + BATCH_SIZE);
    const operations = batch.map((match: any) => ({
      updateOne: {
        filter: { _id: match.booking },
        update: {
          $set: {
            match: match._id,
            hasMatch: true,
            matchId: match._id.toString(),
          },
        },
      },
    }));

    if (operations.length > 0) {
      await Booking.bulkWrite(operations, { ordered: false });
    }
  }
  console.timeEnd("⏱️ Booking-match linking");
  console.log(`✅ Booking aggiornati con riferimenti ai match`);

  return savedMatches;
}

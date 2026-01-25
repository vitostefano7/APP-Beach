// seeds/generateMatches.ts

import Match from "../models/Match";
import { randomInt, randomElement } from "./config";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function generateMatches(players: any[], campi: any[], savedBookings: any[], strutture: any[]) {
  const today = new Date();
  const pastBookings = savedBookings.filter((b: any) => new Date(b.date) < today);
  const futureBookings = savedBookings.filter((b: any) => new Date(b.date) >= today);

  const matches: any[] = [];
  const matchCounters = { completed: 0, noResult: 0, inProgress: 0, open: 0, full: 0, draft: 0 };

  // Helper function per verificare se una struttura supporta split payment
  const canBePublic = (bookingId: any) => {
    const booking = savedBookings.find((b: any) => b._id.toString() === bookingId.toString());
    if (!booking) return false;
    const struttura = strutture.find((s: any) => s._id.toString() === booking.struttura.toString());
    return struttura?.isCostSplittingEnabled || false;
  };

  // Helper per ottenere maxPlayers da numberOfPeople del booking
  const getMaxPlayers = (booking: any) => {
    return booking.numberOfPeople || 4; // default 4 se non specificato
  };

  // ============================================
  // MATCH PASSATI COMPLETATI (con risultato)
  // Per ogni booking passato con numberOfPeople
  // ============================================
  const pastWithPeople = pastBookings.filter((b: any) => b.numberOfPeople);
  
  for (const booking of pastWithPeople) {
    const creator = booking.user;
    const maxPlayers = getMaxPlayers(booking);
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
      
      matchPlayers.push({
        user: player._id,
        team: j < playersPerTeam ? "A" : "B",
        status: "confirmed",
        joinedAt: joinDate,
        respondedAt: joinDate,
      });
    }

    // Genera risultato realistico
    const sets: any[] = [];
    let winsA = 0;
    let winsB = 0;
    for (let s = 0; s < 3; s++) {
      if (winsA === 2 || winsB === 2) break;
      // Beach volley: max 21 punti per squadra, no pareggi
      let teamA, teamB;
      do {
        teamA = randomInt(15, 21);
        teamB = randomInt(15, 21);
      } while (teamA === teamB); // no pareggi
      sets.push({ teamA, teamB });
      if (teamA > teamB) winsA++;
      else winsB++;
    }

    matches.push({
      booking: booking._id,
      createdBy: creator,
      players: matchPlayers,
      maxPlayers: maxPlayers,
      isPublic: canBePublic(booking._id),
      score: { sets },
      winner: winsA > winsB ? "A" : "B",
      playedAt: new Date(booking.date),
      status: "completed",
    });
    matchCounters.completed++;
  }

  // Match passati senza numberOfPeople (volley) - senza risultato
  const pastVolley = pastBookings.filter((b: any) => !b.numberOfPeople);
  for (const booking of pastVolley) {
    const creator = booking.user;
    
    matches.push({
      booking: booking._id,
      createdBy: creator,
      players: [
        {
          user: creator,
          team: "A",
          status: "confirmed",
          joinedAt: new Date(booking.date),
          respondedAt: new Date(booking.date),
        },
      ],
      maxPlayers: 10, // volley
      isPublic: false,
      playedAt: new Date(booking.date),
      status: "completed",
    });
    matchCounters.noResult++;
  }

  // ============================================
  // MATCH FUTURI APERTI (1 per player)
  // Organizzatore + 1 altro utente
  // ============================================
  // Identifica i booking per le partite aperte (quelli con _isOpenMatch flag non viene salvato,
  // quindi usiamo l'ultimo booking futuro di ogni utente)
  const userFutureBookings: Map<string, any[]> = new Map();
  for (const booking of futureBookings) {
    const usrId = booking.user.toString();
    if (!userFutureBookings.has(usrId)) {
      userFutureBookings.set(usrId, []);
    }
    userFutureBookings.get(usrId)!.push(booking);
  }

  // Per ogni utente, prendi l'ultimo booking futuro come "partita aperta"
  const openMatchBookings: any[] = [];
  const regularFutureBookings: any[] = [];
  
  for (const [userId, userBookings] of userFutureBookings) {
    // Ordina per data, l'ultimo è quello per la partita aperta
    userBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (userBookings.length > 0) {
      // L'ultimo booking futuro è per la partita aperta
      openMatchBookings.push(userBookings[userBookings.length - 1]);
      // Il resto sono normali
      regularFutureBookings.push(...userBookings.slice(0, -1));
    }
  }

  // Crea match aperti (organizzatore + 1 altro giocatore)
  for (const booking of openMatchBookings) {
    const creator = booking.user;
    const maxPlayers = getMaxPlayers(booking);

    // Trova un altro giocatore random
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

    const isPublic = canBePublic(booking._id);
    matches.push({
      booking: booking._id,
      createdBy: creator,
      players: matchPlayers,
      maxPlayers: maxPlayers,
      isPublic: isPublic,
      status: isPublic ? "open" : "draft",
    });
    if (isPublic) matchCounters.open++;
    else matchCounters.draft++;
  }

  // ============================================
  // MATCH FUTURI NORMALI (completi o draft)
  // ============================================
  for (const booking of regularFutureBookings) {
    const creator = booking.user;
    const maxPlayers = getMaxPlayers(booking);
    const isFull = Math.random() > 0.5; // 50% completi, 50% draft

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
        isPublic: canBePublic(booking._id),
        status: "full",
      });
      matchCounters.full++;
    } else {
      // Draft con solo organizzatore
      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: [
          {
            user: creator,
            status: "confirmed",
            joinedAt: new Date(),
            respondedAt: new Date(),
          },
        ],
        maxPlayers: maxPlayers,
        isPublic: false,
        status: "draft",
      });
      matchCounters.draft++;
    }
  }

  // ============================================
  // MATCH PER BOOKING OGGI (draft/completi)
  // ============================================
  const todayBookings = savedBookings.filter((b: any) => {
    const bDate = new Date(b.date);
    return bDate.toDateString() === today.toDateString();
  });

  const bookingsWithMatch = matches.map((m) => m.booking.toString());
  const todayWithoutMatch = todayBookings.filter((b: any) => !bookingsWithMatch.includes(b._id.toString()));

  for (const booking of todayWithoutMatch) {
    const creator = booking.user;
    const maxPlayers = getMaxPlayers(booking);

    matches.push({
      booking: booking._id,
      createdBy: creator,
      players: [
        {
          user: creator,
          status: "confirmed",
          joinedAt: new Date(),
          respondedAt: new Date(),
        },
      ],
      maxPlayers: maxPlayers,
      isPublic: false,
      status: "draft",
    });
    matchCounters.draft++;
  }

  // Rimuovi score e winner da match non conclusi
  for (const m of matches) {
    if (m.status !== "completed") {
      delete m.score;
      delete m.winner;
    }
  }
  const savedMatches = await Match.insertMany(matches);
  console.log(`✅ Creati ${savedMatches.length} match:`);
  console.log(`   - ${matchCounters.completed} completati con risultato (beach)`);
  console.log(`   - ${matchCounters.noResult} completati senza risultato (volley)`);
  console.log(`   - ${matchCounters.open} aperti (2/${openMatchBookings.length > 0 ? getMaxPlayers(openMatchBookings[0]) : '?'} giocatori)`);
  console.log(`   - ${matchCounters.full} completi`);
  console.log(`   - ${matchCounters.draft} in bozza/privati`);

  return savedMatches;
}

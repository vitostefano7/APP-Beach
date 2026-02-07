// seeds/generateBookings.ts

import Booking from "../models/Booking";
import CampoCalendarDay from "../models/campoCalendarDay";
import { randomInt, randomElement } from "./config";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

// Helper per creare una prenotazione
function createBooking(
  player: any,
  campo: any,
  struttura: any,
  date: Date,
  numPeople: number | undefined
) {
  const hour = randomInt(9, 20);
  const duration = randomElement([1, 1.5]);
  const startTime = `${String(hour).padStart(2, "0")}:00`;
  const endHour = duration === 1 ? hour + 1 : hour + 1;
  const endMinutes = duration === 1.5 ? "30" : "00";
  const endTime = `${String(endHour).padStart(2, "0")}:${endMinutes}`;
  const bookingType = numPeople ? "public" : "private";
  const paymentMode = bookingType === "public" ? "split" : "full";
  const totalPrice = randomInt(30, 50);
  const unitPrice = numPeople ? Math.round(totalPrice / numPeople) : undefined;

  return {
    user: player._id,
    campo: campo._id,
    struttura: struttura?._id,
    date: formatDate(date),
    startTime,
    endTime,
    duration,
    price: totalPrice,
    numberOfPeople: numPeople,
    unitPrice: unitPrice,
    payments: [],
    status: "confirmed",
    bookingType,
    paymentMode,
    ownerEarnings: totalPrice,
  };
}

export async function generateBookings(players: any[], campi: any[], strutture: any[]) {
  const bookings: any[] = [];
  const today = new Date();

  // Popola lo sport per tutti i campi per poter filtrare
  console.log("🔄 Popolamento sport per campi...");
  const campiPopulated = await Promise.all(
    campi.map(async (campo) => {
      const populated = await campo.populate('sport');
      return populated;
    })
  );

  // Raggruppa campi per codice sport
  const campiPerSport = new Map<string, any[]>();
  for (const campo of campiPopulated) {
    if (campo.sport?.code) {
      if (!campiPerSport.has(campo.sport.code)) {
        campiPerSport.set(campo.sport.code, []);
      }
      campiPerSport.get(campo.sport.code)!.push(campo);
    }
  }

  const sportCodes = Array.from(campiPerSport.keys());
  console.log(`📊 Sport disponibili: ${sportCodes.join(", ")}`);
  sportCodes.forEach(code => {
    console.log(`   - ${code}: ${campiPerSport.get(code)!.length} campi`);
  });

  for (const player of players) {
    // ============================================
    // ALMENO 1 PRENOTAZIONE PER OGNI SPORT
    // ============================================
    const sportBookingsCount = new Map<string, number>();
    
    // Inizializza contatori per ogni sport
    sportCodes.forEach(code => sportBookingsCount.set(code, 0));
    
    // Lista di booking da creare
    const playerBookings: any[] = [];
    
    // 1. Crea almeno 2 booking passati per ogni sport
    for (const sportCode of sportCodes) {
      for (let j = 0; j < 2; j++) { // Loop 2 volte per ogni sport
        const campiForSport = campiPerSport.get(sportCode)!;
        if (campiForSport.length === 0) continue;
        
        const campo: any = randomElement(campiForSport);
        if (!campo || !campo.struttura) continue;
        
        const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
        if (!struttura) continue;
        
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - randomInt(2, 30));
        
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
        
        playerBookings.push(createBooking(player, campo, struttura, pastDate, numPeople));
        sportBookingsCount.set(sportCode, sportBookingsCount.get(sportCode)! + 1);
      }
    }
    
    // 2. Aggiungi altre prenotazioni passate casuali per varietà (2 booking)
    for (let i = 0; i < 2; i++) {
      const sportCode = randomElement(sportCodes);
      const campiForSport = campiPerSport.get(sportCode)!;
      if (campiForSport.length === 0) continue;
      
      const campo: any = randomElement(campiForSport);
      if (!campo || !campo.struttura) continue;
      
      const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
      if (!struttura) continue;
      
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - randomInt(2, 30));
      
      const sport = campo.sport;
      let numPeople = undefined;
      
      if (sport?.allowsPlayerPricing && sport?.minPlayers) {
        const possibleCounts = [];
        for (let n = sport.minPlayers; n <= sport.maxPlayers; n += 2) {
          possibleCounts.push(n);
        }
        numPeople = randomElement(possibleCounts);
      }
      
      playerBookings.push(createBooking(player, campo, struttura, pastDate, numPeople));
      sportBookingsCount.set(sportCode, sportBookingsCount.get(sportCode)! + 1);
    }

    // 3. Aggiungi 2 prenotazioni per oggi (sport casuali)
    for (let i = 0; i < 2; i++) {
      const sportCode = randomElement(sportCodes);
      const campiForSport = campiPerSport.get(sportCode)!;
      if (campiForSport.length === 0) continue;
      
      const campo: any = randomElement(campiForSport);
      if (!campo || !campo.struttura) continue;
      
      const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
      if (!struttura) continue;
      
      const sport = campo.sport;
      let numPeople = undefined;
      
      if (sport?.allowsPlayerPricing && sport?.minPlayers) {
        const possibleCounts = [];
        for (let n = sport.minPlayers; n <= sport.maxPlayers; n += 2) {
          possibleCounts.push(n);
        }
        numPeople = randomElement(possibleCounts);
      }
      
      playerBookings.push(createBooking(player, campo, struttura, today, numPeople));
      sportBookingsCount.set(sportCode, sportBookingsCount.get(sportCode)! + 1);
    }

    // 4. Aggiungi 4 prenotazioni future (sport casuali)
    for (let i = 0; i < 4; i++) {
      const sportCode = randomElement(sportCodes);
      const campiForSport = campiPerSport.get(sportCode)!;
      if (campiForSport.length === 0) continue;
      
      const campo: any = randomElement(campiForSport);
      if (!campo || !campo.struttura) continue;
      
      const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
      if (!struttura) continue;
      
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + randomInt(1, 10));
      
      const sport = campo.sport;
      let numPeople = undefined;
      
      if (sport?.allowsPlayerPricing && sport?.minPlayers) {
        const possibleCounts = [];
        for (let n = sport.minPlayers; n <= sport.maxPlayers; n += 2) {
          possibleCounts.push(n);
        }
        numPeople = randomElement(possibleCounts);
      }
      
      playerBookings.push(createBooking(player, campo, struttura, futureDate, numPeople));
      sportBookingsCount.set(sportCode, sportBookingsCount.get(sportCode)! + 1);
    }
    
    // Aggiungi tutti i booking del player
    bookings.push(...playerBookings);
  }

  const savedBookings = await Booking.insertMany(bookings);
  
  // Calcola statistiche per sport
  const bookingsPerSport = new Map<string, number>();
  for (const booking of savedBookings) {
    const campo = campiPopulated.find((c: any) => c._id.toString() === booking.campo.toString());
    if (campo?.sport?.code) {
      bookingsPerSport.set(
        campo.sport.code, 
        (bookingsPerSport.get(campo.sport.code) || 0) + 1
      );
    }
  }
  
  console.log(`✅ Create ${savedBookings.length} prenotazioni`);
  console.log(`   - ${players.length} giocatori`);
  console.log(`   - Media ${(savedBookings.length / players.length).toFixed(1)} prenotazioni per giocatore`);
  console.log(`📊 Distribuzione per sport:`);
  Array.from(bookingsPerSport.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      console.log(`   - ${code}: ${count} booking`);
    });

  // Disabilita gli slot prenotati nel calendario
  for (const booking of savedBookings) {
    await CampoCalendarDay.updateOne(
      {
        campo: booking.campo,
        date: booking.date,
        "slots.time": booking.startTime,
      },
      {
        $set: { "slots.$.enabled": false },
      }
    );
  }
  console.log(`✅ Disabilitati ${savedBookings.length} slot nel calendario`);

  return savedBookings;
}

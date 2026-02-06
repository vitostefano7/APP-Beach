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

  // Separa campi per sport - ora usiamo il codice dello sport
  const beachCampi = campiPopulated.filter((c: any) => c.sport?.code === "beach_volley");
  const volleyCampi = campiPopulated.filter((c: any) => c.sport?.code === "volley");
  const otherCampi = campiPopulated.filter((c: any) => 
    c.sport?.code && c.sport.code !== "beach_volley" && c.sport.code !== "volley"
  );

  console.log(`📊 Campi per sport: ${beachCampi.length} beach volley, ${volleyCampi.length} volley, ${otherCampi.length} altri`);

  // Se non ci sono campi beach volley, usa campi generici
  const bookingCampi = beachCampi.length > 0 ? beachCampi : campiPopulated.slice(0, Math.min(5, campiPopulated.length));

  for (const player of players) {
    // ============================================
    // 4 PRENOTAZIONI PASSATE
    // ============================================
    
    // Usa campi disponibili in modo flessibile
    const availableCampi = bookingCampi.length > 0 ? bookingCampi : campiPopulated;
    
    if (availableCampi.length === 0) {
      console.warn(`⚠️ Nessun campo disponibile per player ${player.name}`);
      continue;
    }
    
    // 1-3. Prenotazioni con numero giocatori variabile
    for (let i = 0; i < 3; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - randomInt(2, 30));
      const campo: any = randomElement(availableCampi);
      
      // Verifica se il campo esiste e ha struttura
      if (!campo || !campo.struttura) {
        console.warn(`⚠️ Campo senza struttura, skip booking`);
        continue;
      }
      
      const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
      
      if (!struttura) {
        console.warn(`⚠️ Struttura non trovata per campo ${campo.name}`);
        continue;
      }
      
      // Numero giocatori basato sullo sport (se disponibile e supporta player pricing)
      const sport = campo.sport;
      let numPeople = undefined;
      
      if (sport?.allowsPlayerPricing && sport?.minPlayers) {
        // Usa un numero tra min e max per sport che supportano split
        const possibleCounts = [];
        for (let n = sport.minPlayers; n <= sport.maxPlayers; n += 2) {
          possibleCounts.push(n);
        }
        numPeople = randomElement(possibleCounts);
      }
      
      bookings.push(createBooking(player, campo, struttura, pastDate, numPeople));
    }

    // 4. Volley o altro sport (senza split)
    const pastDate4 = new Date(today);
    pastDate4.setDate(pastDate4.getDate() - randomInt(2, 30));
    const anyCampo: any = randomElement(volleyCampi.length > 0 ? volleyCampi : availableCampi);
    
    if (anyCampo && anyCampo.struttura) {
      const strutturaVolley = strutture.find((s: any) => s._id.toString() === anyCampo.struttura.toString());
      if (strutturaVolley) {
        bookings.push(createBooking(player, anyCampo, strutturaVolley, pastDate4, undefined));
      }
    }

    // ============================================
    // 2 PRENOTAZIONI OGGI
    // ============================================
    for (let i = 0; i < 2; i++) {
      const campo: any = randomElement(availableCampi);
      
      if (!campo || !campo.struttura) continue;
      
      const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
      if (!struttura) continue;
      
      // Numero giocatori casuale se lo sport lo supporta
      const sport = campo.sport;
      let numPeople = undefined;
      
      if (sport?.allowsPlayerPricing && sport?.minPlayers) {
        const possibleCounts = [];
        for (let n = sport.minPlayers; n <= sport.maxPlayers; n += 2) {
          possibleCounts.push(n);
        }
        numPeople = randomElement(possibleCounts);
      }
      
      bookings.push(createBooking(player, campo, struttura, today, numPeople));
    }

    // ============================================
    // 4 PRENOTAZIONI FUTURE
    // ============================================
    for (let i = 0; i < 4; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + randomInt(1, 10));
      const campo: any = randomElement(availableCampi);
      
      if (!campo || !campo.struttura) continue;
      
      const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
      if (!struttura) continue;
      
      // Numero giocatori casuale se lo sport lo supporta
      const sport = campo.sport;
      let numPeople = undefined;
      
      if (sport?.allowsPlayerPricing && sport?.minPlayers) {
        const possibleCounts = [];
        for (let n = sport.minPlayers; n <= sport.maxPlayers; n += 2) {
          possibleCounts.push(n);
        }
        numPeople = randomElement(possibleCounts);
      }
      
      bookings.push(createBooking(player, campo, struttura, futureDate, numPeople));
    }
  }

  const savedBookings = await Booking.insertMany(bookings);
  console.log(`✅ Create ${savedBookings.length} prenotazioni`);
  console.log(`   - Distribuite su ${bookingCampi.length} campi disponibili`);
  console.log(`   - Mix di sport: ${beachCampi.length} beach volley, ${volleyCampi.length} volley, ${otherCampi.length} altri`);

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

// seeds/generateBookings.ts

import Booking from "../models/Booking";
import CampoCalendarDay from "../models/campoCalendarDay";
import User from "../models/User";
import { randomInt, randomElement } from "./config";
import path from "path";
import os from "os";
import { Worker } from "worker_threads";

type WorkerSettings = {
  pastBookingsPerSport: number;
  extraPastBookings: number;
  todayBookings: number;
  futureBookingsCount: number;
};

type WorkerCampo = {
  _id: string;
  struttura: string;
  sport: {
    code: string;
    allowsPlayerPricing?: boolean;
    minPlayers?: number;
    maxPlayers?: number;
  };
};

function runBookingsWorker(
  workerPath: string,
  playerIds: string[],
  campiBySport: Record<string, WorkerCampo[]>,
  sportCodes: string[],
  settings: WorkerSettings,
  useTsNodeRegister: boolean
) {
  return new Promise<any[]>((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: { players: playerIds, campiBySport, sportCodes, settings },
      ...(useTsNodeRegister ? { execArgv: ["-r", "ts-node/register"] } : {}),
    });

    worker.on("message", (result) => resolve(result as any[]));
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Bookings worker terminato con codice ${code}`));
      }
    });
  });
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getOwnerCancelledRatio() {
  const defaultRatio = 0.2;
  const raw = Number(process.env.SEED_OWNER_CANCELLED_RATIO ?? defaultRatio.toString());
  if (!Number.isFinite(raw)) return defaultRatio;
  if (raw < 0) return 0;
  if (raw > 1) return 1;
  return raw;
}

function applyOwnerCancelledRefunds(bookings: any[], ratio: number) {
  if (!bookings.length || ratio <= 0) {
    return 0;
  }

  const targetCancelled = Math.min(
    bookings.length,
    Math.max(1, Math.round(bookings.length * ratio))
  );

  const indexes = bookings.map((_, index) => index);
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }

  let cancelledCount = 0;

  for (let i = 0; i < indexes.length && cancelledCount < targetCancelled; i++) {
    const booking = bookings[indexes[i]];
    if (!booking) continue;

    const refundAmountRaw = Number(booking.ownerEarnings ?? booking.price ?? 0);
    const refundAmount = Number.isFinite(refundAmountRaw) ? Math.max(0, refundAmountRaw) : 0;

    booking.status = "cancelled";
    booking.cancelledBy = "owner";
    booking.cancelledReason = "Chiusura straordinaria struttura (seed)";
    booking.payments = [
      {
        user: booking.user,
        amount: refundAmount,
        method: "card",
        status: "refunded",
        createdAt: new Date(),
      },
    ];

    cancelledCount += 1;
  }

  return cancelledCount;
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
  const seedScaleRaw = Number(process.env.SEED_SCALE ?? "1");
  const seedScale = Number.isFinite(seedScaleRaw) && seedScaleRaw > 0 ? seedScaleRaw : 1;
  const ownerCancelledRatio = getOwnerCancelledRatio();
  const pastBookingsPerSport = Math.max(1, Math.round(15 * seedScale));
  const extraPastBookings = Math.max(0, Math.round(30 * seedScale));
  const todayBookings = Math.max(1, Math.round(6 * seedScale));
  const futureBookingsCount = Math.max(1, Math.round(15 * seedScale));

  if (seedScale !== 1) {
    console.log(`⚙️ SEED_SCALE attivo: ${seedScale}`);
  }

  console.log(`💸 Quota cancellazioni owner con rimborso: ${(ownerCancelledRatio * 100).toFixed(1)}%`);

  const strutturaOwnerById = new Map<string, string>();
  for (const struttura of strutture) {
    if (!struttura?._id || !struttura?.owner) continue;
    strutturaOwnerById.set(struttura._id.toString(), struttura.owner.toString());
  }

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
  console.time("⏱️ Booking generation compute");

  const workersRaw = Number(process.env.SEED_WORKERS ?? "1");
  const maxWorkers = Math.max(1, Math.min(players.length || 1, os.cpus().length));
  const workerCount = Math.max(1, Math.min(Number.isFinite(workersRaw) ? Math.floor(workersRaw) : 1, maxWorkers));

  if (workerCount > 1) {
    console.log(`🧵 Generazione booking in multithread: ${workerCount} worker`);

    const workerCampiBySport: Record<string, WorkerCampo[]> = {};
    for (const [sportCode, campiForSport] of campiPerSport.entries()) {
      workerCampiBySport[sportCode] = campiForSport.map((campo: any) => ({
        _id: campo._id.toString(),
        struttura: campo.struttura.toString(),
        sport: {
          code: campo.sport.code,
          allowsPlayerPricing: campo.sport.allowsPlayerPricing,
          minPlayers: campo.sport.minPlayers,
          maxPlayers: campo.sport.maxPlayers,
        },
      }));
    }

    const playerIds = players.map((player: any) => player._id.toString());
    const chunkSize = Math.ceil(playerIds.length / workerCount);
    const chunks: string[][] = [];

    for (let i = 0; i < playerIds.length; i += chunkSize) {
      chunks.push(playerIds.slice(i, i + chunkSize));
    }

    const workerScript = __filename.endsWith(".ts") ? "generateBookingsWorker.ts" : "generateBookingsWorker.js";
    const workerPath = path.join(__dirname, "workers", workerScript);
    const useTsNodeRegister = workerScript.endsWith(".ts");
    const settings: WorkerSettings = {
      pastBookingsPerSport,
      extraPastBookings,
      todayBookings,
      futureBookingsCount,
    };

    const workerResults = await Promise.all(
      chunks.map((chunk) =>
        runBookingsWorker(
          workerPath,
          chunk,
          workerCampiBySport,
          sportCodes,
          settings,
          useTsNodeRegister
        )
      )
    );

    for (const result of workerResults) {
      bookings.push(...result);
    }
  } else {
    for (const player of players) {
      // ============================================
      // ALMENO 1 PRENOTAZIONE PER OGNI SPORT
      // ============================================
      const sportBookingsCount = new Map<string, number>();
      
      // Inizializza contatori per ogni sport
      sportCodes.forEach(code => sportBookingsCount.set(code, 0));
      
      // Lista di booking da creare
      const playerBookings: any[] = [];
      
      // 1. Crea booking passati per ogni sport
      for (const sportCode of sportCodes) {
        for (let j = 0; j < pastBookingsPerSport; j++) {
          const campiForSport = campiPerSport.get(sportCode)!;
          if (campiForSport.length === 0) continue;
          
          const campo: any = randomElement(campiForSport);
          if (!campo || !campo.struttura) continue;
          
          const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
          if (!struttura) continue;
          
          const pastDate = new Date(today);
          pastDate.setDate(pastDate.getDate() - randomInt(1, 90));
          
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
      
      // 2. Aggiungi altre prenotazioni passate casuali per varietà
      for (let i = 0; i < extraPastBookings; i++) {
        const sportCode = randomElement(sportCodes);
        const campiForSport = campiPerSport.get(sportCode)!;
        if (campiForSport.length === 0) continue;
        
        const campo: any = randomElement(campiForSport);
        if (!campo || !campo.struttura) continue;
        
        const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
        if (!struttura) continue;
        
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - randomInt(1, 90));
        
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

      // 3. Aggiungi prenotazioni per oggi (sport casuali)
      for (let i = 0; i < todayBookings; i++) {
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

      // 4. Aggiungi prenotazioni future (sport casuali)
      for (let i = 0; i < futureBookingsCount; i++) {
        const sportCode = randomElement(sportCodes);
        const campiForSport = campiPerSport.get(sportCode)!;
        if (campiForSport.length === 0) continue;
        
        const campo: any = randomElement(campiForSport);
        if (!campo || !campo.struttura) continue;
        
        const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
        if (!struttura) continue;
        
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + randomInt(1, 60));
        
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
      
      bookings.push(...playerBookings);
    }
  }

  const seededOwnerCancelledCount = applyOwnerCancelledRefunds(bookings, ownerCancelledRatio);
  console.log(`🚫 Booking cancellate dall'owner (seed): ${seededOwnerCancelledCount}`);
  console.timeEnd("⏱️ Booking generation compute");

  console.time("⏱️ Booking insertMany");
  const savedBookings = await Booking.insertMany(bookings);
  console.timeEnd("⏱️ Booking insertMany");
  
  // Calcola statistiche per sport
  const campoToSportCode = new Map<string, string>();
  for (const campo of campiPopulated) {
    if (campo?.sport?.code) {
      campoToSportCode.set(campo._id.toString(), campo.sport.code);
    }
  }

  const bookingsPerSport = new Map<string, number>();
  for (const booking of savedBookings) {
    const sportCode = campoToSportCode.get(booking.campo.toString());
    if (sportCode) {
      bookingsPerSport.set(
        sportCode,
        (bookingsPerSport.get(sportCode) || 0) + 1
      );
    }
  }

  // Aggiorna ledger owner (booking + refund)
  console.time("⏱️ Owner earnings ledger update");
  const ownerLedgerUpdates = new Map<
    string,
    { entries: Array<{ type: "booking" | "refund"; amount: number; booking: any; description: string; createdAt: Date }>; totalDelta: number }
  >();

  for (const booking of savedBookings) {
    const strutturaId = booking?.struttura?.toString?.();
    if (!strutturaId) continue;

    const ownerId = strutturaOwnerById.get(strutturaId);
    if (!ownerId) continue;

    const rawAmount = Number(booking.ownerEarnings ?? 0);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) continue;

    const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();

    if (!ownerLedgerUpdates.has(ownerId)) {
      ownerLedgerUpdates.set(ownerId, { entries: [], totalDelta: 0 });
    }

    const bucket = ownerLedgerUpdates.get(ownerId)!;

    if (booking.status === "confirmed") {
      bucket.entries.push({
        type: "booking",
        amount: rawAmount,
        booking: booking._id,
        description: "Guadagno prenotazione seed",
        createdAt,
      });
      bucket.totalDelta += rawAmount;
      continue;
    }

    const hasRefund = Array.isArray(booking.payments)
      ? booking.payments.some((payment: any) => payment?.status === "refunded")
      : false;

    if (booking.status === "cancelled" && booking.cancelledBy === "owner" && hasRefund) {
      bucket.entries.push({
        type: "refund",
        amount: -rawAmount,
        booking: booking._id,
        description: "Rimborso owner cancellation seed",
        createdAt,
      });
      bucket.totalDelta -= rawAmount;
    }
  }

  const ownerBulkOps: any[] = Array.from(ownerLedgerUpdates.entries())
    .filter(([, payload]) => payload.entries.length > 0)
    .map(([ownerId, payload]) => ({
      updateOne: {
        filter: { _id: ownerId },
        update: {
          $push: { earnings: { $each: payload.entries } },
          $inc: { totalEarnings: payload.totalDelta },
        },
      },
    }));

  if (ownerBulkOps.length > 0) {
    await User.bulkWrite(ownerBulkOps, { ordered: false });
  }
  console.timeEnd("⏱️ Owner earnings ledger update");

  const savedCancelledByOwner = savedBookings.filter(
    (booking: any) => booking.status === "cancelled" && booking.cancelledBy === "owner"
  ).length;
  const savedRefunded = savedBookings.filter(
    (booking: any) =>
      Array.isArray(booking.payments) && booking.payments.some((payment: any) => payment?.status === "refunded")
  ).length;
  
  console.log(`✅ Create ${savedBookings.length} prenotazioni`);
  console.log(`   - ${savedCancelledByOwner} cancellate dall'owner`);
  console.log(`   - ${savedRefunded} con rimborso registrato`);
  console.log(`   - ${players.length} giocatori`);
  console.log(`   - Media ${(savedBookings.length / players.length).toFixed(1)} prenotazioni per giocatore`);
  console.log(`📊 Distribuzione per sport:`);
  Array.from(bookingsPerSport.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      console.log(`   - ${code}: ${count} booking`);
    });

  // Disabilita gli slot prenotati nel calendario (bulk batch)
  console.time("⏱️ Calendar slot disable bulk");
  const BATCH_SIZE = 1000;
  for (let i = 0; i < savedBookings.length; i += BATCH_SIZE) {
    const batch = savedBookings.slice(i, i + BATCH_SIZE);
    const operations = batch.map((booking: any) => ({
      updateOne: {
        filter: {
          campo: booking.campo,
          date: booking.date,
          "slots.time": booking.startTime,
        },
        update: {
          $set: { "slots.$.enabled": false },
        },
      },
    }));

    if (operations.length > 0) {
      await CampoCalendarDay.bulkWrite(operations, { ordered: false });
    }
  }
  console.timeEnd("⏱️ Calendar slot disable bulk");
  console.log(`✅ Disabilitati ${savedBookings.length} slot nel calendario`);

  return savedBookings;
}

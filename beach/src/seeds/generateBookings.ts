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

  // Separa campi beach e volley
  const beachCampi = campi.filter((c: any) => c.sport === "beach volley");
  const volleyCampi = campi.filter((c: any) => c.sport === "volley");

  for (const player of players) {
    // ============================================
    // 4 PRENOTAZIONI PASSATE
    // ============================================
    
    // 1. Beach volley con 4 giocatori
    const pastDate1 = new Date(today);
    pastDate1.setDate(pastDate1.getDate() - randomInt(2, 30));
    const beachCampo1: any = randomElement(beachCampi);
    const struttura1 = strutture.find((s: any) => s._id.toString() === beachCampo1.struttura.toString());
    bookings.push(createBooking(player, beachCampo1, struttura1, pastDate1, 4));

    // 2. Beach volley con 6 giocatori
    const pastDate2 = new Date(today);
    pastDate2.setDate(pastDate2.getDate() - randomInt(2, 30));
    const beachCampo2: any = randomElement(beachCampi);
    const struttura2 = strutture.find((s: any) => s._id.toString() === beachCampo2.struttura.toString());
    bookings.push(createBooking(player, beachCampo2, struttura2, pastDate2, 6));

    // 3. Beach volley con 8 giocatori
    const pastDate3 = new Date(today);
    pastDate3.setDate(pastDate3.getDate() - randomInt(2, 30));
    const beachCampo3: any = randomElement(beachCampi);
    const struttura3 = strutture.find((s: any) => s._id.toString() === beachCampo3.struttura.toString());
    bookings.push(createBooking(player, beachCampo3, struttura3, pastDate3, 8));

    // 4. Volley (campo interno)
    const pastDate4 = new Date(today);
    pastDate4.setDate(pastDate4.getDate() - randomInt(2, 30));
    const volleyCampo: any = randomElement(volleyCampi);
    const strutturaVolley = strutture.find((s: any) => s._id.toString() === volleyCampo.struttura.toString());
    bookings.push(createBooking(player, volleyCampo, strutturaVolley, pastDate4, undefined));

    // ============================================
    // 2 PRENOTAZIONI OGGI (beach 6 o 8 giocatori)
    // ============================================
    for (let i = 0; i < 2; i++) {
      const beachCampo: any = randomElement(beachCampi);
      const struttura = strutture.find((s: any) => s._id.toString() === beachCampo.struttura.toString());
      const numPeople = randomElement([6, 8]);
      bookings.push(createBooking(player, beachCampo, struttura, today, numPeople));
    }

    // ============================================
    // 4 PRENOTAZIONI FUTURE (beach 6 o 8 giocatori)
    // ============================================
    for (let i = 0; i < 4; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + randomInt(1, 10));
      const beachCampo: any = randomElement(beachCampi);
      const struttura = strutture.find((s: any) => s._id.toString() === beachCampo.struttura.toString());
      const numPeople = randomElement([6, 8]);
      bookings.push(createBooking(player, beachCampo, struttura, futureDate, numPeople));
    }
  }

  const savedBookings = await Booking.insertMany(bookings);
  console.log(`✅ Create ${savedBookings.length} prenotazioni`);
  console.log(`   - ${players.length * 4} passate (per utente: 3 beach + 1 volley)`);
  console.log(`   - ${players.length * 2} oggi`);
  console.log(`   - ${players.length * 4} future`);

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

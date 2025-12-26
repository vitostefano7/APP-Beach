import mongoose, { Types } from "mongoose";
import bcrypt from "bcrypt";

import User from "./models/User";
import Struttura from "./models/Strutture";
import Campo from "./models/Campo";
import Booking from "./models/Booking";
import CampoCalendarDay from "./models/campoCalendarDay";
import PlayerProfile from "./models/PlayerProfile";
import UserPreferences from "./models/UserPreferences";

/* =========================
   CONFIG
========================= */
const MONGO_URI =
  "mongodb://admin:adminpass@127.0.0.1:27017/beach?authSource=admin";

const DEFAULT_PASSWORD = "123";
const SALT_ROUNDS = 10;

// 📅 ANNO DA GENERARE
const YEAR = new Date().getFullYear();

// ⏱️ SLOT DEFAULT
const OPEN_HOUR = 9;
const CLOSE_HOUR = 22;
const SLOT_MINUTES = 60;

/* =========================
   TYPES
========================= */
type BookingSeed = {
  user: Types.ObjectId;
  campo: Types.ObjectId;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "confirmed" | "cancelled";
};

/* =========================
   UTILS
========================= */
function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function generateSlots(): { time: string; enabled: boolean }[] {
  const slots: { time: string; enabled: boolean }[] = [];

  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    slots.push({
      time: `${String(h).padStart(2, "0")}:00`,
      enabled: true,
    });
  }

  return slots;
}

function generateYearDates(year: number): string[] {
  const dates: string[] = [];
  const date = new Date(year, 0, 1);

  while (date.getFullYear() === year) {
    dates.push(formatDate(date));
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

/* =========================
   SEED
========================= */
async function seed(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connesso");

    /* -------- CLEAN -------- */
    await Promise.all([
      Booking.deleteMany({}),
      CampoCalendarDay.deleteMany({}),
      Campo.deleteMany({}),
      Struttura.deleteMany({}),
      PlayerProfile.deleteMany({}),
      UserPreferences.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log("🧹 Database pulito");

    /* -------- USERS -------- */
    const password = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    const users = await User.insertMany([
      { name: "Mario Rossi", email: "mario@test.it", password, role: "player" },
      { name: "Giulia Verdi", email: "giulia@test.it", password, role: "player" },
      { name: "Luca Bianchi", email: "luca@test.it", password, role: "player" },
      { name: "Paolo Owner", email: "owner@test.it", password, role: "owner" },
    ]);

    const players = users.filter(u => u.role === "player");
    const owner = users.find(u => u.role === "owner")!;

    /* -------- PLAYER DATA -------- */
    await PlayerProfile.insertMany(
      players.map(p => ({
        user: p._id,
        matchesPlayed: 0,
        ratingAverage: 0,
      }))
    );

    await UserPreferences.insertMany(
      players.map(p => ({
        user: p._id,
        pushNotifications: true,
        darkMode: false,
      }))
    );

    /* -------- STRUTTURA -------- */
    const struttura = await Struttura.create({
      name: "VBB Sport Center",
      owner: owner._id,
      location: {
        address: "Via del Mare 12",
        city: "Brindisi",
        lat: 40.632,
        lng: 17.936,
        coordinates: [17.936, 40.632],
      },
      amenities: {
        toilets: true,
        lockerRoom: true,
        showers: true,
        parking: true,
        bar: true,
      },
      images: [],
      rating: { average: 4.5, count: 12 },
      isActive: true,
    });

    /* -------- CAMPI -------- */
    const campi = await Campo.insertMany([
      {
        struttura: struttura._id,
        name: "Campo Beach 1",
        sport: "beach_volley",
        surface: "sand",
        pricePerHour: 40,
        indoor: false,
        isActive: true,
      },
      {
        struttura: struttura._id,
        name: "Campo Padel 1",
        sport: "padel",
        surface: "hardcourt",
        pricePerHour: 50,
        indoor: true,
        isActive: true,
      },
    ]);

    /* -------- CALENDARIO ANNUALE -------- */
    const yearDates = generateYearDates(YEAR);
    const calendarDocs = [];

    for (const campo of campi) {
      for (const date of yearDates) {
        calendarDocs.push({
          campo: campo._id,
          date,
          slots: generateSlots(),
          isClosed: false,
        });
      }
    }

    await CampoCalendarDay.insertMany(calendarDocs);
    console.log(
      `📆 Calendario annuale creato: ${calendarDocs.length} giorni`
    );

    /* -------- BOOKINGS -------- */
    const bookings: BookingSeed[] = [];

    players.forEach((player, i) => {
      bookings.push(
        {
          user: player._id,
          campo: campi[0]._id,
          date: formatDate(new Date(YEAR, 5, 10)),
          startTime: "18:00",
          endTime: "19:00",
          price: campi[0].pricePerHour,
          status: "confirmed",
        },
        {
          user: player._id,
          campo: campi[1]._id,
          date: formatDate(new Date(YEAR, 2, 20)),
          startTime: "10:00",
          endTime: "11:00",
          price: campi[1].pricePerHour,
          status: "cancelled",
        }
      );
    });

    await Booking.insertMany(bookings);
    console.log("📅 Prenotazioni create");

    console.log("🌱 SEED ANNUALE COMPLETATO");
    process.exit(0);
  } catch (err) {
    console.error("❌ Errore seed:", err);
    process.exit(1);
  }
}

seed();

import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User, { IUser } from "./models/User";
import Struttura, { IStruttura } from "./models/Strutture";
import Campo, { ICampo } from "./models/Campo";
import Booking from "./models/Booking";
import PlayerProfile from "./models/PlayerProfile";
import UserPreferences from "./models/UserPreferences";

/* =========================
   CONFIG
========================= */
const MONGO_URI =
  "mongodb://admin:adminpass@127.0.0.1:27017/beach?authSource=admin";

const DEFAULT_PASSWORD = "123";
const SALT_ROUNDS = 10;

/* =========================
   CITTÀ ITALIA
========================= */
const CITIES = [
  { city: "Milano", lat: 45.4642, lng: 9.19 },
  { city: "Torino", lat: 45.0703, lng: 7.6869 },
  { city: "Bologna", lat: 44.4949, lng: 11.3426 },
  { city: "Firenze", lat: 43.7696, lng: 11.2558 },
  { city: "Roma", lat: 41.9028, lng: 12.4964 },
  { city: "Napoli", lat: 40.8518, lng: 14.2681 },
];

/* =========================
   UTILS
========================= */
function randomDate(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

/* =========================
   SEED
========================= */
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connesso");

    /* -------- CLEAN DB -------- */
    await Booking.deleteMany({});
    await Campo.deleteMany({});
    await Struttura.deleteMany({});
    await PlayerProfile.deleteMany({});
    await UserPreferences.deleteMany({});
    await User.deleteMany({});
    console.log("🧹 Database pulito");

    /* -------- PASSWORD -------- */
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    /* -------- USERS -------- */
    const users: IUser[] = await User.insertMany([
      { name: "Mario Rossi", email: "mario@test.it", password: hashedPassword, role: "player" },
      { name: "Luca Bianchi", email: "luca@test.it", password: hashedPassword, role: "player" },
      { name: "Giulia Verdi", email: "giulia@test.it", password: hashedPassword, role: "player" },
      { name: "Paolo Owner", email: "owner@test.it", password: hashedPassword, role: "owner" },
      { name: "Marco Owner", email: "owner2@test.it", password: hashedPassword, role: "owner" },
    ]);

    const owners = users.filter(u => u.role === "owner");
    const players = users.filter(u => u.role === "player");

    console.log("👤 Utenti creati:", users.length);

    /* -------- PLAYER PROFILES -------- */
    await PlayerProfile.insertMany(
      players.map(player => ({
        user: player._id,
        level: "amateur",
        matchesPlayed: 0,
        ratingAverage: 0,
      }))
    );

    await UserPreferences.insertMany(
      players.map(player => ({
        user: player._id,
        pushNotifications: true,
        darkMode: false,
        privacyLevel: "public",
      }))
    );

    console.log("🎮 Profili giocatore creati:", players.length);

    /* -------- STRUTTURE -------- */
    const strutture: IStruttura[] = await Struttura.insertMany(
      CITIES.map((c, i) => ({
        name: `Sport Center ${c.city}`,
        description: "Centro sportivo moderno",
        owner: owners[i % owners.length]._id,
        location: {
          address: `Via Sport ${i + 1}`,
          city: c.city,
          lat: c.lat + Math.random() * 0.01,
          lng: c.lng + Math.random() * 0.01,
          coordinates: [
            c.lng + Math.random() * 0.01,
            c.lat + Math.random() * 0.01,
          ],
        },
        amenities: {
          toilets: true,
          lockerRoom: true,
          showers: true,
          parking: true,
          restaurant: i % 2 === 0,
          bar: true,
        },
        openingHours: {
          monday: { open: "09:00", close: "22:00" },
          tuesday: { open: "09:00", close: "22:00" },
          wednesday: { open: "09:00", close: "22:00" },
        },
        images: [],
        rating: { average: 4.2, count: 10 },
        isActive: true,
        isFeatured: i % 2 === 0,
        isDeleted: false,
      }))
    );

    console.log("🏟️ Strutture create:", strutture.length);

    /* -------- CAMPI -------- */
    const campi: Partial<ICampo>[] = [];

    strutture.forEach((struttura, i) => {
      for (let n = 1; n <= 2; n++) {
        campi.push({
          struttura: struttura._id,
          name: `Campo ${n}`,
          sport: n % 2 === 0 ? "padel" : "beach_volley",
          surface: n % 2 === 0 ? "hardcourt" : "sand",
          maxPlayers: 4,
          indoor: n % 2 === 0,
          pricePerHour: 30 + i * 5,
          isActive: true,
        });
      }
    });

    const campiCreati = await Campo.insertMany(campi);
    console.log("🏐 Campi creati:", campiCreati.length);

    /* -------- BOOKINGS -------- */
    const bookings: any[] = [];

    players.forEach(player => {
      for (let i = 0; i < 2; i++) {
        const campo =
          campiCreati[Math.floor(Math.random() * campiCreati.length)];

        bookings.push({
          user: player._id,
          campo: campo._id,
          date: randomDate(i + 1),
          startTime: "18:00",
          endTime: "19:00",
          price: campo.pricePerHour,
          status: "confirmed",
        });
      }
    });

    await Booking.insertMany(bookings);
    console.log("📅 Prenotazioni create:", bookings.length);

    /* -------- UPDATE MATCHES PLAYED -------- */
    for (const player of players) {
      const count = bookings.filter(
        b => b.user.toString() === player._id.toString()
      ).length;

      await PlayerProfile.findOneAndUpdate(
        { user: player._id },
        { matchesPlayed: count }
      );
    }

    console.log("🌱 SEED COMPLETATO CON SUCCESSO");
    process.exit(0);
  } catch (err) {
    console.error("❌ Errore seed:", err);
    process.exit(1);
  }
}

seed();

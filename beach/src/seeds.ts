import mongoose, { Types } from "mongoose";
import bcrypt from "bcrypt";

import User from "./models/User";
import Struttura from "./models/Strutture";
import Campo from "./models/Campo";
import Booking from "./models/Booking";
import CampoCalendarDay from "./models/campoCalendarDay";
import PlayerProfile from "./models/PlayerProfile";
import UserPreferences from "./models/UserPreferences";
import Match from "./models/Match";

/* =========================
   CONFIG
========================= */
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://admin:adminpass@127.0.0.1:27017/beach?authSource=admin";

const DEFAULT_PASSWORD = "123";
const SALT_ROUNDS = 10;

// 📅 ANNI DA GENERARE (anno corrente + prossimo)
const CURRENT_YEAR = new Date().getFullYear();
const YEARS_TO_GENERATE = [CURRENT_YEAR, CURRENT_YEAR + 1];

// ⏱️ SLOT DEFAULT
const OPEN_HOUR = 9;
const CLOSE_HOUR = 22;

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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/* =========================
   SEED
========================= */
async function seed(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connesso");

    /* -------- CLEAN -------- */
    console.log("🧹 Pulizia database...");
    await Promise.all([
      Match.deleteMany({}),
      Booking.deleteMany({}),
      CampoCalendarDay.deleteMany({}),
      Campo.deleteMany({}),
      Struttura.deleteMany({}),
      PlayerProfile.deleteMany({}),
      UserPreferences.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log("✅ Database pulito");

    /* -------- USERS -------- */
    console.log("👥 Creazione utenti...");
    const password = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    const users = await User.insertMany([
      // Players
      { name: "Mario Rossi", email: "mario@test.it", password, role: "player", isActive: true },
      { name: "Giulia Verdi", email: "giulia@test.it", password, role: "player", isActive: true },
      { name: "Luca Bianchi", email: "luca@test.it", password, role: "player", isActive: true },
      { name: "Anna Ferrari", email: "anna@test.it", password, role: "player", isActive: true },
      { name: "Marco Colombo", email: "marco@test.it", password, role: "player", isActive: true },
      
      // Owners
      { name: "Paolo Owner Milano", email: "paolo@test.it", password, role: "owner", isActive: true },
      { name: "Sara Owner Roma", email: "sara@test.it", password, role: "owner", isActive: true },
      { name: "Vito Owner Brindisi", email: "vito@test.it", password, role: "owner", isActive: true },
    ]);

    const players = users.filter(u => u.role === "player");
    const owners = users.filter(u => u.role === "owner");

    console.log(`✅ Creati ${users.length} utenti (${players.length} player, ${owners.length} owner)`);

    /* -------- PLAYER PROFILES -------- */
    console.log("🏐 Creazione profili player...");
    const levels = ["beginner", "amateur", "advanced"];
    
    await PlayerProfile.insertMany(
      players.map(p => ({
        user: p._id,
        level: randomElement(levels),
        matchesPlayed: randomInt(0, 50),
        ratingAverage: Math.random() * 5,
      }))
    );

    /* -------- USER PREFERENCES -------- */
    console.log("⚙️ Creazione preferenze utenti...");
    const cities = [
      { name: "Milano", lat: 45.4642, lng: 9.1900 },
      { name: "Roma", lat: 41.9028, lng: 12.4964 },
      { name: "Brindisi", lat: 40.6320, lng: 17.9360 },
    ];

    await UserPreferences.insertMany(
      players.map((p, idx) => {
        const city = cities[idx % cities.length];
        return {
          user: p._id,
          pushNotifications: true,
          darkMode: Math.random() > 0.5,
          privacyLevel: randomElement(["public", "friends", "private"]),
          preferredLocation: {
            city: city.name,
            lat: city.lat,
            lng: city.lng,
            radius: randomElement([10, 20, 30, 50]),
          },
          favoriteStrutture: [],
          favoriteSports: Math.random() > 0.5 ? ["Beach Volley"] : ["Volley"],
          preferredTimeSlot: randomElement(["morning", "afternoon", "evening"]),
        };
      })
    );

    /* -------- STRUTTURE -------- */
    console.log("🏢 Creazione strutture...");
    
    const strutture = await Struttura.insertMany([
      // Milano
      {
        name: "Beach Volley Paradise Milano",
        description: "La migliore struttura di beach volley a Milano. Campi professionali in sabbia, spogliatoi moderni e bar.",
        owner: owners[0]._id,
        location: {
          address: "Via Tortona 35",
          city: "Milano",
          lat: 45.4542,
          lng: 9.1700,
          coordinates: [9.1700, 45.4542],
        },
        amenities: {
          toilets: true,
          lockerRoom: true,
          showers: true,
          parking: true,
          restaurant: false,
          bar: true,
        },
        openingHours: {
          monday: { open: "09:00", close: "22:00", closed: false },
          tuesday: { open: "09:00", close: "22:00", closed: false },
          wednesday: { open: "09:00", close: "22:00", closed: false },
          thursday: { open: "09:00", close: "22:00", closed: false },
          friday: { open: "09:00", close: "23:00", closed: false },
          saturday: { open: "08:00", close: "23:00", closed: false },
          sunday: { open: "08:00", close: "22:00", closed: false },
        },
        images: ["https://images.unsplash.com/photo-1612872087720-bb876e2e67d1"],
        rating: { average: 4.7, count: 45 },
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Volley Center Milano",
        description: "Centro polifunzionale con campi indoor e outdoor.",
        owner: owners[0]._id,
        location: {
          address: "Via Ripamonti 88",
          city: "Milano",
          lat: 45.4342,
          lng: 9.2100,
          coordinates: [9.2100, 45.4342],
        },
        amenities: {
          toilets: true,
          lockerRoom: true,
          showers: true,
          parking: true,
          restaurant: true,
          bar: true,
        },
        openingHours: {
          monday: { open: "09:00", close: "22:00", closed: false },
          tuesday: { open: "09:00", close: "22:00", closed: false },
          wednesday: { open: "09:00", close: "22:00", closed: false },
          thursday: { open: "09:00", close: "22:00", closed: false },
          friday: { open: "09:00", close: "22:00", closed: false },
          saturday: { open: "09:00", close: "22:00", closed: false },
          sunday: { open: "09:00", close: "20:00", closed: false },
        },
        images: ["https://images.unsplash.com/photo-1592656094267-764a45160876"],
        rating: { average: 4.5, count: 32 },
        isActive: true,
        isFeatured: false,
      },

      // Roma
      {
        name: "Beach Roma Ostia",
        description: "Campi beach volley vista mare a Ostia.",
        owner: owners[1]._id,
        location: {
          address: "Lungomare Paolo Toscanelli 150",
          city: "Roma",
          lat: 41.7350,
          lng: 12.2850,
          coordinates: [12.2850, 41.7350],
        },
        amenities: {
          toilets: true,
          lockerRoom: true,
          showers: true,
          parking: true,
          restaurant: true,
          bar: true,
        },
        openingHours: {
          monday: { open: "10:00", close: "20:00", closed: false },
          tuesday: { open: "10:00", close: "20:00", closed: false },
          wednesday: { open: "10:00", close: "20:00", closed: false },
          thursday: { open: "10:00", close: "20:00", closed: false },
          friday: { open: "10:00", close: "22:00", closed: false },
          saturday: { open: "09:00", close: "23:00", closed: false },
          sunday: { open: "09:00", close: "23:00", closed: false },
        },
        images: ["https://images.unsplash.com/photo-1545262810-77515befe149"],
        rating: { average: 4.8, count: 67 },
        isActive: true,
        isFeatured: true,
      },

      // Brindisi
      {
        name: "VBB Sport Center Brindisi",
        description: "Centro sportivo con campi beach volley professionali.",
        owner: owners[2]._id,
        location: {
          address: "Via del Mare 12",
          city: "Brindisi",
          lat: 40.6320,
          lng: 17.9360,
          coordinates: [17.9360, 40.6320],
        },
        amenities: {
          toilets: true,
          lockerRoom: true,
          showers: true,
          parking: true,
          restaurant: false,
          bar: true,
        },
        openingHours: {
          monday: { open: "09:00", close: "22:00", closed: false },
          tuesday: { open: "09:00", close: "22:00", closed: false },
          wednesday: { open: "09:00", close: "22:00", closed: false },
          thursday: { open: "09:00", close: "22:00", closed: false },
          friday: { open: "09:00", close: "23:00", closed: false },
          saturday: { open: "08:00", close: "23:00", closed: false },
          sunday: { open: "00:00", close: "00:00", closed: true },
        },
        images: [],
        rating: { average: 4.5, count: 23 },
        isActive: true,
        isFeatured: false,
      },

      // Struttura disattivata (test)
      {
        name: "Old Volley Club (CHIUSO)",
        description: "Struttura non più operativa.",
        owner: owners[0]._id,
        location: {
          address: "Via Esempio 1",
          city: "Milano",
          lat: 45.4500,
          lng: 9.1800,
          coordinates: [9.1800, 45.4500],
        },
        amenities: {
          toilets: false,
          lockerRoom: false,
          showers: false,
          parking: false,
          restaurant: false,
          bar: false,
        },
        openingHours: {},
        images: [],
        rating: { average: 0, count: 0 },
        isActive: false,
        isFeatured: false,
      },
    ]);

    console.log(`✅ Create ${strutture.length} strutture`);

    /* -------- CAMPI -------- */
    console.log("🏐 Creazione campi...");
    
    const campiData = [];

    // Beach Volley Paradise Milano - 3 campi beach
    for (let i = 1; i <= 3; i++) {
      campiData.push({
        struttura: strutture[0]._id,
        name: `Campo Beach ${i}`,
        sport: "beach_volley",
        surface: "sand",
        maxPlayers: 4,
        indoor: false,
        pricePerHour: 40 + (i * 5),
        isActive: true,
      });
    }

    // Volley Center Milano - 2 indoor + 1 outdoor
    campiData.push(
      {
        struttura: strutture[1]._id,
        name: "Campo Indoor 1",
        sport: "volley",
        surface: "pvc",
        maxPlayers: 12,
        indoor: true,
        pricePerHour: 50,
        isActive: true,
      },
      {
        struttura: strutture[1]._id,
        name: "Campo Indoor 2",
        sport: "volley",
        surface: "pvc",
        maxPlayers: 12,
        indoor: true,
        pricePerHour: 50,
        isActive: true,
      },
      {
        struttura: strutture[1]._id,
        name: "Campo Outdoor",
        sport: "volley",
        surface: "cement",
        maxPlayers: 12,
        indoor: false,
        pricePerHour: 35,
        isActive: true,
      }
    );

    // Beach Roma Ostia - 4 campi beach
    for (let i = 1; i <= 4; i++) {
      campiData.push({
        struttura: strutture[2]._id,
        name: `Beach Field ${i}`,
        sport: "beach_volley",
        surface: "sand",
        maxPlayers: 4,
        indoor: false,
        pricePerHour: 45,
        isActive: true,
      });
    }

    // VBB Sport Center Brindisi - 2 campi beach
    for (let i = 1; i <= 2; i++) {
      campiData.push({
        struttura: strutture[3]._id,
        name: `Campo Beach ${i}`,
        sport: "beach_volley",
        surface: "sand",
        maxPlayers: 4,
        indoor: false,
        pricePerHour: 40,
        isActive: true,
      });
    }

    const campi = await Campo.insertMany(campiData);
    console.log(`✅ Creati ${campi.length} campi`);

    /* -------- CALENDARIO ANNUALE -------- */
    console.log("📆 Generazione calendari annuali...");
    
    const calendarDocs = [];

    for (const year of YEARS_TO_GENERATE) {
      const yearDates = generateYearDates(year);
      
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
    }

    await CampoCalendarDay.insertMany(calendarDocs);
    console.log(`✅ Creati ${calendarDocs.length} giorni di calendario (${YEARS_TO_GENERATE.length} anni)`);

    /* -------- BOOKINGS -------- */
    console.log("📅 Creazione prenotazioni...");
    
    const bookings = [];
    const now = new Date();

    // Prenotazioni passate (per match)
    for (let i = 0; i < 20; i++) {
      const daysAgo = randomInt(1, 60);
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - daysAgo);
      
      const player = randomElement(players);
      const campo = randomElement(campi.filter(c => c.sport === "beach_volley"));
      const hour = randomInt(9, 20);

      bookings.push({
        user: player._id,
        campo: campo._id,
        date: formatDate(pastDate),
        startTime: `${String(hour).padStart(2, "0")}:00`,
        endTime: `${String(hour + 1).padStart(2, "0")}:00`,
        price: campo.pricePerHour,
        status: "confirmed",
      });
    }

    // Prenotazioni future
    for (let i = 0; i < 30; i++) {
      const daysAhead = randomInt(1, 90);
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      const player = randomElement(players);
      const campo = randomElement(campi);
      const hour = randomInt(9, 20);

      bookings.push({
        user: player._id,
        campo: campo._id,
        date: formatDate(futureDate),
        startTime: `${String(hour).padStart(2, "0")}:00`,
        endTime: `${String(hour + 1).padStart(2, "0")}:00`,
        price: campo.pricePerHour,
        status: Math.random() > 0.9 ? "cancelled" : "confirmed",
      });
    }

    const savedBookings = await Booking.insertMany(bookings);
    console.log(`✅ Create ${savedBookings.length} prenotazioni`);

    /* -------- MATCHES -------- */
    console.log("🏆 Creazione match...");
    
    const pastBookings = savedBookings.filter((b: any) => {
      const bookingDate = new Date(b.date);
      return bookingDate < now && b.status === "confirmed";
    });

    const matches = [];

    for (const booking of pastBookings.slice(0, 15)) {
      // Genera 2 o 3 set
      const numSets = randomElement([2, 3]);
      const sets = [];
      let teamAWins = 0;
      let teamBWins = 0;

      for (let i = 0; i < numSets; i++) {
        const teamAScore = randomInt(15, 21);
        const teamBScore = randomInt(15, 21);
        
        if (teamAScore > teamBScore) teamAWins++;
        else teamBWins++;

        sets.push({
          teamA: teamAScore,
          teamB: teamBScore,
        });

        // Se qualcuno ha vinto 2 set, stop
        if (teamAWins === 2 || teamBWins === 2) break;
      }

      matches.push({
        booking: booking._id,
        score: { sets },
        winner: teamAWins > teamBWins ? "A" : "B",
      });
    }

    await Match.insertMany(matches);
    console.log(`✅ Creati ${matches.length} match`);

    /* -------- FAVORITES -------- */
    console.log("⭐ Assegnazione strutture favorite...");
    
    for (const player of players) {
      const randomStrutture = strutture
        .filter(s => s.isActive)
        .sort(() => Math.random() - 0.5)
        .slice(0, randomInt(1, 3))
        .map(s => s._id);

      await UserPreferences.findOneAndUpdate(
        { user: player._id },
        { $set: { favoriteStrutture: randomStrutture } }
      );
    }

    console.log("✅ Preferiti assegnati");

    /* -------- SUMMARY -------- */
    console.log("\n" + "=".repeat(50));
    console.log("🌱 SEED COMPLETATO CON SUCCESSO!");
    console.log("=".repeat(50));
    console.log(`👥 Utenti:              ${users.length}`);
    console.log(`   - Players:           ${players.length}`);
    console.log(`   - Owners:            ${owners.length}`);
    console.log(`🏢 Strutture:           ${strutture.length}`);
    console.log(`🏐 Campi:               ${campi.length}`);
    console.log(`📆 Giorni calendario:   ${calendarDocs.length}`);
    console.log(`📅 Prenotazioni:        ${savedBookings.length}`);
    console.log(`🏆 Match:               ${matches.length}`);
    console.log("=".repeat(50));
    console.log("\n💡 CREDENZIALI:");
    console.log("   Email: mario@test.it | giulia@test.it | luca@test.it");
    console.log("   Email Owner: paolo@test.it | sara@test.it | vito@test.it");
    console.log("   Password: 123");
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Errore seed:", err);
    process.exit(1);
  }
}

seed();
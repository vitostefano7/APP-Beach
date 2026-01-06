// seeds.ts
import mongoose, { Types } from "mongoose";
import bcrypt from "bcrypt";

import User from "./models/User";
import PlayerProfile from "./models/PlayerProfile";
import UserPreferences from "./models/UserPreferences";
import Struttura from "./models/Strutture";
import Campo from "./models/Campo";
import CampoCalendarDay from "./models/campoCalendarDay";
import Booking from "./models/Booking";
import Match from "./models/Match";
import Event from "./models/Event";
import Friendship from "./models/Friendship";

/* =========================
   CONFIG
========================= */
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://admin:adminpass@127.0.0.1:27017/beach?authSource=admin";

const DEFAULT_PASSWORD = "123";
const SALT_ROUNDS = 10;

const MONTHS_TO_GENERATE = 15; // Rolling calendar di 15 mesi

/* =========================
   UTILS
========================= */
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * ✅ Genera slot ogni 30 minuti
 */
function generateHalfHourSlots(open: string, close: string) {
  const slots = [];
  let [h, m] = open.split(":").map(Number);

  while (true) {
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (time >= close) break;

    slots.push({ time, enabled: true });

    m += 30;
    if (m >= 60) {
      h++;
      m = 0;
    }
  }

  return slots;
}

/**
 * ✅ Genera date per i prossimi N mesi
 */
function generateDatesForMonths(months: number): string[] {
  const dates: string[] = [];
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + months);

  const d = new Date(start);
  while (d <= end) {
    dates.push(formatDate(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/* =========================
   SEED
========================= */
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connesso");

    /* -------- CLEAN -------- */
    await Promise.all([
      Friendship.deleteMany({}),
      Event.deleteMany({}),
      Match.deleteMany({}),
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

    const usersData = [
      // PLAYERS (20)
      { name: "Mario Rossi", email: "mario@test.it", username: "mario_rossi", role: "player" },
      { name: "Giulia Verdi", email: "giulia@test.it", username: "giulia_verdi", role: "player" },
      { name: "Luca Bianchi", email: "luca@test.it", username: "luca_b", role: "player" },
      { name: "Anna Ferrari", email: "anna@test.it", username: "anna_ferrari", role: "player" },
      { name: "Marco Esposito", email: "marco@test.it", username: "marco_esp", role: "player" },
      { name: "Sofia Romano", email: "sofia@test.it", username: "sofia_romano", role: "player" },
      { name: "Alessandro Gallo", email: "alex@test.it", username: "alex_gallo", role: "player" },
      { name: "Chiara Conti", email: "chiara@test.it", username: "chiara_c", role: "player" },
      { name: "Matteo Bruno", email: "matteo@test.it", username: "matteo_bruno", role: "player" },
      { name: "Elena Ricci", email: "elena@test.it", username: "elena_ricci", role: "player" },
      { name: "Davide Marino", email: "davide@test.it", username: "davide_m", role: "player" },
      { name: "Francesca Greco", email: "francesca@test.it", username: "franci_greco", role: "player" },
      { name: "Simone Lombardi", email: "simone@test.it", username: "simone_l", role: "player" },
      { name: "Valentina Costa", email: "valentina@test.it", username: "vale_costa", role: "player" },
      { name: "Andrea Fontana", email: "andrea@test.it", username: "andrea_f", role: "player" },
      { name: "Martina Serra", email: "martina@test.it", username: "martina_serra", role: "player" },
      { name: "Lorenzo Mancini", email: "lorenzo@test.it", username: "lorenzo_m", role: "player" },
      { name: "Alessia Villa", email: "alessia@test.it", username: "alessia_v", role: "player" },
      { name: "Gabriele Caruso", email: "gabriele@test.it", username: "gabri_caruso", role: "player" },
      { name: "Beatrice De Luca", email: "beatrice@test.it", username: "bea_deluca", role: "player" },
      
      // OWNERS (6)
      { name: "Paolo Proprietario", email: "paolo@test.it", username: "paolo_owner", role: "owner" },
      { name: "Sara Gestore", email: "sara@test.it", username: "sara_owner", role: "owner" },
      { name: "Roberto Beach", email: "roberto@test.it", username: "roberto_beach", role: "owner" },
      { name: "Laura Sport", email: "laura@test.it", username: "laura_sport", role: "owner" },
      { name: "Antonio Centro", email: "antonio@test.it", username: "antonio_centro", role: "owner" },
      { name: "Federica Arena", email: "federica@test.it", username: "fede_arena", role: "owner" },
    ];

    const users = await User.insertMany(
      usersData.map((u) => ({
        ...u,
        password,
        isActive: true,
        preferredSports: u.role === "player" ? [randomElement(["volleyball", "beach_volleyball"])] : [],
        location: u.role === "player" ? {
          type: "Point",
          coordinates: [9.19 + Math.random() * 0.5, 45.46 + Math.random() * 0.5],
        } : undefined,
      }))
    );

    const players = users.filter((u) => u.role === "player");
    const owners = users.filter((u) => u.role === "owner");

    console.log(`✅ Creati ${users.length} utenti (${players.length} player, ${owners.length} owner)`);

    /* -------- PLAYER PROFILES -------- */
    await PlayerProfile.insertMany(
      players.map((p) => ({
        user: p._id,
        level: randomElement(["beginner", "amateur", "advanced"]),
        matchesPlayed: randomInt(0, 50),
        ratingAverage: Math.random() * 5,
      }))
    );

    console.log(`✅ Creati ${players.length} player profiles`);

    /* -------- USER PREFERENCES -------- */
    const cities = ["Milano", "Roma", "Torino", "Bologna", "Firenze"];
    
    await UserPreferences.insertMany(
      players.map((p) => ({
        user: p._id,
        pushNotifications: Math.random() > 0.3,
        darkMode: Math.random() > 0.5,
        privacyLevel: randomElement(["public", "friends", "private"]),
        preferredLocation: {
          city: randomElement(cities),
          lat: 45.4642 + Math.random() * 2,
          lng: 9.19 + Math.random() * 2,
          radius: randomInt(10, 50),
        },
        favoriteStrutture: [],
        favoriteSports: [randomElement(["Beach Volley", "Volley"])],
        preferredTimeSlot: randomElement(["morning", "afternoon", "evening"]),
      }))
    );

    console.log(`✅ Create ${players.length} user preferences`);

    /* -------- FRIENDSHIPS -------- */
    const friendships = [];
    
    // Creiamo amicizie tra i primi 10 player
    const friendPlayers = players.slice(0, 10);
    
    for (let i = 0; i < friendPlayers.length; i++) {
      for (let j = i + 1; j < friendPlayers.length; j++) {
        // 70% probabilità di essere amici
        if (Math.random() > 0.3) {
          friendships.push({
            requester: friendPlayers[i]._id,
            recipient: friendPlayers[j]._id,
            status: "accepted",
            acceptedAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000),
          });
        }
      }
    }
    
    // Alcune richieste pending
    for (let i = 10; i < 15; i++) {
      friendships.push({
        requester: friendPlayers[0]._id,
        recipient: players[i]._id,
        status: "pending",
      });
    }
    
    await Friendship.insertMany(friendships);
    console.log(`✅ Create ${friendships.length} amicizie`);

    /* -------- STRUTTURE (8) -------- */
    const struttureData = [
      {
        name: "Beach Volley Milano Centro",
        description: "Centro beach volley professionale con 4 campi regolamentari e illuminazione notturna",
        owner: owners[0]._id,
        city: "Milano",
        lat: 45.4642,
        lng: 9.19,
        amenities: ["toilets", "lockerRoom", "showers", "parking", "bar", "restaurant"],
        rating: 4.8,
        count: 45,
        isFeatured: true,
      },
      {
        name: "Beach Roma Ostia",
        description: "Campi beach volley vista mare con area relax e bar",
        owner: owners[1]._id,
        city: "Roma",
        lat: 41.735,
        lng: 12.285,
        amenities: ["toilets", "showers", "parking", "bar"],
        rating: 4.7,
        count: 38,
        isFeatured: true,
      },
      {
        name: "Torino Beach Arena",
        description: "Arena beach volley coperta e scoperta, ideale per tutto l'anno",
        owner: owners[2]._id,
        city: "Torino",
        lat: 45.0703,
        lng: 7.6869,
        amenities: ["toilets", "lockerRoom", "showers", "parking"],
        rating: 4.5,
        count: 22,
        isFeatured: false,
      },
      {
        name: "Bologna Volley Club",
        description: "Centro sportivo con campi beach e indoor",
        owner: owners[3]._id,
        city: "Bologna",
        lat: 44.4949,
        lng: 11.3426,
        amenities: ["toilets", "lockerRoom", "showers", "parking", "bar"],
        rating: 4.6,
        count: 31,
        isFeatured: true,
      },
      {
        name: "Firenze Beach Sport",
        description: "Struttura moderna con 2 campi beach volley sabbia fine",
        owner: owners[4]._id,
        city: "Firenze",
        lat: 43.7696,
        lng: 11.2558,
        amenities: ["toilets", "showers", "parking"],
        rating: 4.3,
        count: 18,
        isFeatured: false,
      },
      {
        name: "Milano Beach Park",
        description: "Parco beach volley con 5 campi e area eventi",
        owner: owners[5]._id,
        city: "Milano",
        lat: 45.4520,
        lng: 9.2100,
        amenities: ["toilets", "lockerRoom", "showers", "parking", "bar", "restaurant"],
        rating: 4.9,
        count: 62,
        isFeatured: true,
      },
      {
        name: "Roma Nord Beach",
        description: "Centro beach volley zona nord con illuminazione LED",
        owner: owners[0]._id,
        city: "Roma",
        lat: 41.933,
        lng: 12.466,
        amenities: ["toilets", "showers", "parking", "bar"],
        rating: 4.4,
        count: 27,
        isFeatured: false,
      },
      {
        name: "Rimini Beach Experience",
        description: "Struttura fronte mare con campi beach e servizi premium",
        owner: owners[1]._id,
        city: "Rimini",
        lat: 44.0678,
        lng: 12.5695,
        amenities: ["toilets", "lockerRoom", "showers", "parking", "bar", "restaurant"],
        rating: 4.7,
        count: 41,
        isFeatured: true,
      },
    ];

    const strutture = await Struttura.insertMany(
      struttureData.map((s) => ({
        name: s.name,
        description: s.description,
        owner: s.owner,
        location: {
          address: `Via Test ${randomInt(1, 100)}`,
          city: s.city,
          lat: s.lat,
          lng: s.lng,
          coordinates: [s.lng, s.lat],
        },
        amenities: s.amenities,
        openingHours: {},
        images: [],
        rating: { average: s.rating, count: s.count },
        isActive: true,
        isFeatured: s.isFeatured,
        isDeleted: false,
      }))
    );

    console.log(`✅ Create ${strutture.length} strutture`);

    /* -------- CAMPI (20) -------- */
    const campiData: any[] = [];

    // Ogni struttura ha 2-3 campi
    strutture.forEach((struttura, idx) => {
      const numCampi = idx < 3 ? 3 : 2; // Prime 3 strutture hanno 3 campi

      for (let i = 1; i <= numCampi; i++) {
        const isBeach = Math.random() > 0.3;
        const isIndoor = !isBeach && Math.random() > 0.5;

        campiData.push({
          struttura: struttura._id,
          name: `Campo ${isBeach ? "Beach" : "Volley"} ${i}`,
          sport: isBeach ? "beach_volley" : "volley",
          surface: isBeach ? "sand" : isIndoor ? "pvc" : "cement",
          maxPlayers: 4,
          indoor: isIndoor,
          pricePerHour: randomInt(30, 50),
          isActive: true,
          pricingRules: {
            mode: Math.random() > 0.5 ? "flat" : "advanced",
            flatPrices: { oneHour: randomInt(30, 50), oneHourHalf: randomInt(42, 70) },
            basePrices: { oneHour: randomInt(30, 45), oneHourHalf: randomInt(42, 63) },
            timeSlotPricing: {
              enabled: Math.random() > 0.5,
              slots: Math.random() > 0.5 ? [
                {
                  start: "18:00",
                  end: "23:00",
                  label: "Sera",
                  prices: { oneHour: randomInt(40, 55), oneHourHalf: randomInt(56, 77) },
                },
              ] : [],
            },
            dateOverrides: { enabled: false, dates: [] },
            periodOverrides: { enabled: false, periods: [] },
            playerCountPricing: { enabled: false, prices: [] },
          },
          weeklySchedule: {
            monday: { enabled: true, open: "09:00", close: "22:00" },
            tuesday: { enabled: true, open: "09:00", close: "22:00" },
            wednesday: { enabled: true, open: "09:00", close: "22:00" },
            thursday: { enabled: true, open: "09:00", close: "22:00" },
            friday: { enabled: true, open: "09:00", close: "23:00" },
            saturday: { enabled: true, open: "08:00", close: "23:00" },
            sunday: { enabled: true, open: "08:00", close: "22:00" },
          },
        });
      }
    });

    const campi = await Campo.insertMany(campiData);
    console.log(`✅ Creati ${campi.length} campi`);

    /* -------- EVENTS (10) -------- */
    const eventsData = [];
    const eventTypes: any[] = ["tournament", "league", "friendly"];
    
    for (let i = 0; i < 10; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + randomInt(5, 30));
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (i < 3 ? 1 : randomInt(2, 7)));
      
      eventsData.push({
        name: `Evento ${i + 1} ${randomElement(["Beach Volley", "Volley"])}`,
        description: `Descrizione evento di prova ${i + 1}`,
        type: eventTypes[i % 3],
        organizer: randomElement(players)._id,
        struttura: randomElement(strutture)._id,
        startDate,
        endDate,
        sport: Math.random() > 0.5 ? "volleyball" : "beach_volleyball",
        maxParticipants: randomInt(8, 32),
        isPublic: Math.random() > 0.3,
        participants: [players[0]._id, players[1]._id, players[2]._id],
        status: randomElement(["draft", "open", "ongoing"]),
        coverImage: `https://picsum.photos/seed/event${i}/800/400`,
      });
    }
    
    const savedEvents = await Event.insertMany(eventsData);
    console.log(`✅ Creati ${savedEvents.length} eventi`);

    /* -------- CALENDARIO (Rolling 15 mesi) -------- */
    const dates = generateDatesForMonths(MONTHS_TO_GENERATE);
    const calendarDocs = [];

    const WEEK_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    for (const campo of campi) {
      for (const dateStr of dates) {
        const date = new Date(dateStr + "T12:00:00");
        const weekday = WEEK_MAP[date.getDay()] as keyof typeof campo.weeklySchedule;
        const schedule = campo.weeklySchedule[weekday];

        calendarDocs.push({
          campo: campo._id,
          date: dateStr,
          slots: schedule.enabled ? generateHalfHourSlots(schedule.open, schedule.close) : [],
          isClosed: !schedule.enabled,
        });
      }
    }

    await CampoCalendarDay.insertMany(calendarDocs);
    console.log(`✅ Creati ${calendarDocs.length} giorni di calendario (${campi.length} campi × ${dates.length} giorni)`);

    /* -------- BOOKINGS (50) -------- */
    const bookings = [];
    const today = new Date();

    // Prenotazioni passate (ultimi 30 giorni)
    for (let i = 0; i < 30; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - randomInt(1, 30));

      const campo = randomElement(campi);
      const player = randomElement(players);
      const hour = randomInt(9, 20);
      const duration = randomElement([1, 1.5]);
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = duration === 1 ? hour + 1 : hour + 1;
      const endMinutes = duration === 1.5 ? "30" : "00";
      const endTime = `${String(endHour).padStart(2, "0")}:${endMinutes}`;

      bookings.push({
        user: player._id,
        campo: campo._id,
        date: formatDate(pastDate),
        startTime,
        endTime,
        price: randomInt(30, 50),
        status: "confirmed",
      });
    }

    // Prenotazioni future (prossimi 10 giorni)
    for (let i = 0; i < 20; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + randomInt(0, 10));

      const campo = randomElement(campi);
      const player = randomElement(players);
      const hour = randomInt(9, 20);
      const duration = randomElement([1, 1.5]);
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = duration === 1 ? hour + 1 : hour + 1;
      const endMinutes = duration === 1.5 ? "30" : "00";
      const endTime = `${String(endHour).padStart(2, "0")}:${endMinutes}`;

      bookings.push({
        user: player._id,
        campo: campo._id,
        date: formatDate(futureDate),
        startTime,
        endTime,
        price: randomInt(30, 50),
        status: "confirmed",
      });
    }

    const savedBookings = await Booking.insertMany(bookings);
    console.log(`✅ Create ${savedBookings.length} prenotazioni`);

    // ✅ Disabilita gli slot prenotati nel calendario
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

    /* -------- MATCH (20 con players) -------- */
    const pastBookings = savedBookings.filter((b) => {
      const bookingDate = new Date(b.date);
      return bookingDate < today;
    });

    const matches = [];
    
    for (let i = 0; i < Math.min(20, pastBookings.length); i++) {
      const booking = pastBookings[i];
      
      // Scegli 4 giocatori casuali
      const matchPlayers = [];
      const selectedPlayers: string[] = [];
      
      for (let j = 0; j < 4; j++) {
        let player;
        do {
          player = randomElement(players);
        } while (selectedPlayers.includes(player._id.toString()));
        
        selectedPlayers.push(player._id.toString());
        matchPlayers.push({
          user: player._id,
          team: j < 2 ? "A" : "B",
          status: "confirmed",
          joinedAt: new Date(booking.date),
          respondedAt: new Date(booking.date),
        });
      }

      // Genera risultato realistico
      const sets = [];
      let winsA = 0;
      let winsB = 0;

      for (let s = 0; s < 3; s++) {
        if (winsA === 2 || winsB === 2) break;

        const teamA = randomInt(15, 25);
        const teamB = randomInt(15, 25);
        
        sets.push({ teamA, teamB });
        
        if (teamA > teamB) winsA++;
        else winsB++;
      }

      // Scegli un evento casuale per alcuni match
      const event = Math.random() > 0.7 ? randomElement(savedEvents)._id : undefined;

      matches.push({
        booking: booking._id,
        createdBy: matchPlayers[0].user,
        players: matchPlayers,
        maxPlayers: 4,
        isPublic: Math.random() > 0.5,
        score: { sets },
        winner: winsA > winsB ? "A" : "B",
        playedAt: new Date(booking.date),
        event,
        status: "completed",
      });
    }

    await Match.insertMany(matches);
    console.log(`✅ Creati ${matches.length} match completati con players`);

    /* -------- SUMMARY -------- */
    console.log("\n" + "=".repeat(50));
    console.log("🌱 SEED COMPLETATO CON SUCCESSO");
    console.log("=".repeat(50));
    console.log(`👥 Utenti: ${users.length} (${players.length} player, ${owners.length} owner)`);
    console.log(`🤝 Amicizie: ${friendships.length}`);
    console.log(`🎪 Eventi: ${savedEvents.length}`);
    console.log(`🏢 Strutture: ${strutture.length}`);
    console.log(`⚽ Campi: ${campi.length}`);
    console.log(`📅 Giorni calendario: ${calendarDocs.length}`);
    console.log(`📝 Prenotazioni: ${savedBookings.length}`);
    console.log(`🏆 Match: ${matches.length}`);
    console.log("=".repeat(50));
    console.log("🔑 Password per tutti gli utenti: 123");
    console.log("\n📧 UTENTI PLAYER:");
    players.slice(0, 5).forEach(p => {
      console.log(`   - ${p.email} (${p.username})`);
    });
    console.log(`   ... e altri ${players.length - 5} player`);
    console.log("\n👔 UTENTI OWNER:");
    owners.forEach(o => {
      console.log(`   - ${o.email} (${o.username})`);
    });
    console.log("=".repeat(50) + "\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Errore seed:", err);
    process.exit(1);
  }
}

seed();
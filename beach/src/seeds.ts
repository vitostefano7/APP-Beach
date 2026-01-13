// seeds.ts
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

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
import Conversation from "./models/Conversazione";
import Message from "./models/Message";
import Notification from "./models/Notification";

/* =========================
   CONFIG
========================= */
dotenv.config({ path: "./.env" });

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://admin:adminpass@127.0.0.1:27017/beach?authSource=admin";

const DEFAULT_PASSWORD = "123";
const SALT_ROUNDS = 10;

const MONTHS_TO_GENERATE = 3; // Rolling calendar di 3 mesi

/* =========================
   CLOUDINARY
========================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * Cartella avatar locali.
 * ✅ Deve puntare a: beach/images/profilo
 * Se lanci il seed dalla root "beach", va bene così.
 * Altrimenti metti un path assoluto.
 */
const AVATAR_DIR = path.join(process.cwd(), "images", "profilo");
const STRUTTURA_IMG_DIR = path.join(process.cwd(), "images", "struttura");

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
  const slots: { time: string; enabled: boolean }[] = [];
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
   AVATAR: READ + UPLOAD
========================= */
function getAvatarFiles(): string[] {
  if (!fs.existsSync(AVATAR_DIR)) return [];
  return fs
    .readdirSync(AVATAR_DIR)
    .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .map((file) => path.join(AVATAR_DIR, file));
}

async function uploadAvatarsToCloudinary(): Promise<string[]> {
  const files = getAvatarFiles();
  if (!files.length) {
    console.warn(`⚠️ Nessun file avatar trovato in: ${AVATAR_DIR}`);
    return [];
  }

  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!preset) {
    throw new Error("CLOUDINARY_UPLOAD_PRESET mancante nel .env");
  }

  const uploads = await Promise.all(
    files.map((file) =>
      cloudinary.uploader.upload(file, {
        folder: "avatars/users",
        upload_preset: preset,
      })
    )
  );

  return uploads.map((u) => u.secure_url);
}

function getStrutturaImageFiles(): string[] {
  if (!fs.existsSync(STRUTTURA_IMG_DIR)) return [];
  return fs
    .readdirSync(STRUTTURA_IMG_DIR)
    .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .map((file) => path.join(STRUTTURA_IMG_DIR, file));
}

async function uploadStrutturaImagesToCloudinary(): Promise<string[]> {
  const files = getStrutturaImageFiles();
  if (!files.length) {
    console.warn(`⚠️ Nessuna immagine struttura trovata in: ${STRUTTURA_IMG_DIR}`);
    return [];
  }

  const folder = process.env.CLOUDINARY_STRUTTURE_FOLDER || "images/struttura-images";
  const maxWidth = parseInt(process.env.CLOUDINARY_STRUTTURE_MAX_WIDTH || "1920");
  const maxHeight = parseInt(process.env.CLOUDINARY_STRUTTURE_MAX_HEIGHT || "1080");
  const quality = process.env.CLOUDINARY_STRUTTURE_QUALITY || "auto:good";

  const uploads = await Promise.all(
    files.map((file) =>
      cloudinary.uploader.upload(file, {
        folder: folder,
        resource_type: "image",
        transformation: [
          { width: maxWidth, height: maxHeight, crop: "limit" },
          { quality: quality },
          { fetch_format: "auto" }
        ]
      })
    )
  );

  return uploads.map((u) => u.secure_url);
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
      Message.deleteMany({}),
      Conversation.deleteMany({}),
      Notification.deleteMany({}),
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

    /* -------- AVATARS UPLOAD -------- */
    console.log(`☁️ Upload avatar da: ${AVATAR_DIR}`);
    const avatarUrls = await uploadAvatarsToCloudinary();
    if (avatarUrls.length) {
      console.log(`✅ Avatar caricati: ${avatarUrls.length}`);
    } else {
      console.log("ℹ️ Nessun avatar caricato: avatarUrl resterà vuoto");
    }

    /* -------- STRUTTURA IMAGES UPLOAD -------- */
    console.log(`☁️ Upload immagini strutture da: ${STRUTTURA_IMG_DIR}`);
    const strutturaImageUrls = await uploadStrutturaImagesToCloudinary();
    if (strutturaImageUrls.length) {
      console.log(`✅ Immagini strutture caricate: ${strutturaImageUrls.length}`);
    } else {
      console.log("ℹ️ Nessuna immagine struttura caricata");
    }

    /* -------- USERS -------- */
    const password = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    const usersData = [
      // PLAYERS (20)
      { name: "Mario", surname: "Rossi", email: "mario@test.it", username: "mario_rossi", role: "player" },
      { name: "Giulia", surname: "Verdi", email: "giulia@test.it", username: "giulia_verdi", role: "player" },
      { name: "Luca", surname: "Bianchi", email: "luca@test.it", username: "luca_b", role: "player" },
      { name: "Anna", surname: "Ferrari", email: "anna@test.it", username: "anna_ferrari", role: "player" },
      { name: "Marco", surname: "Esposito", email: "marco@test.it", username: "marco_esp", role: "player" },
      { name: "Sofia", surname: "Romano", email: "sofia@test.it", username: "sofia_romano", role: "player" },
      { name: "Alessandro", surname: "Gallo", email: "alex@test.it", username: "alex_gallo", role: "player" },
      { name: "Chiara", surname: "Conti", email: "chiara@test.it", username: "chiara_c", role: "player" },
      { name: "Matteo", surname: "Bruno", email: "matteo@test.it", username: "matteo_bruno", role: "player" },
      { name: "Elena", surname: "Ricci", email: "elena@test.it", username: "elena_ricci", role: "player" },
      { name: "Davide", surname: "Marino", email: "davide@test.it", username: "davide_m", role: "player" },
      { name: "Francesca", surname: "Greco", email: "francesca@test.it", username: "franci_greco", role: "player" },
      { name: "Simone", surname: "Lombardi", email: "simone@test.it", username: "simone_l", role: "player" },
      { name: "Valentina", surname: "Costa", email: "valentina@test.it", username: "vale_costa", role: "player" },
      { name: "Andrea", surname: "Fontana", email: "andrea@test.it", username: "andrea_f", role: "player" },
      { name: "Martina", surname: "Serra", email: "martina@test.it", username: "martina_serra", role: "player" },
      { name: "Lorenzo", surname: "Mancini", email: "lorenzo@test.it", username: "lorenzo_m", role: "player" },
      { name: "Alessia", surname: "Villa", email: "alessia@test.it", username: "alessia_v", role: "player" },
      { name: "Gabriele", surname: "Caruso", email: "gabriele@test.it", username: "gabri_caruso", role: "player" },
      { name: "Beatrice", surname: "De Luca", email: "beatrice@test.it", username: "bea_deluca", role: "player" },

      // OWNERS (6)
      { name: "Paolo", surname: "Proprietario", email: "paolo@test.it", username: "paolo_owner", role: "owner" },
      { name: "Sara", surname: "Gestore", email: "sara@test.it", username: "sara_owner", role: "owner" },
      { name: "Roberto", surname: "Beach", email: "roberto@test.it", username: "roberto_beach", role: "owner" },
      { name: "Laura", surname: "Sport", email: "laura@test.it", username: "laura_sport", role: "owner" },
      { name: "Antonio", surname: "Centro", email: "antonio@test.it", username: "antonio_centro", role: "owner" },
      { name: "Federica", surname: "Arena", email: "federica@test.it", username: "fede_arena", role: "owner" },
    ];

    const users = await User.insertMany(
      usersData.map((u, index) => ({
        ...u,
        password,
        isActive: true,

        // ✅ AVATAR URL (ciclico)
        avatarUrl: avatarUrls.length ? avatarUrls[index % avatarUrls.length] : undefined,

        preferredSports: u.role === "player" ? [randomElement(["volley", "beach volley"])] : [],
        location:
          u.role === "player"
            ? {
                type: "Point",
                coordinates: [9.19 + Math.random() * 0.5, 45.46 + Math.random() * 0.5],
              }
            : undefined,

        // Alcuni profili privati per test (Luca, Anna, Sofia, Chiara)
        profilePrivacy: u.role === "player" && (index === 2 || index === 3 || index === 5 || index === 7) ? "private" : "public",
      }))
    );

    const players = users.filter((u: any) => u.role === "player");
    const owners = users.filter((u: any) => u.role === "owner");

    console.log(`✅ Creati ${users.length} utenti (${players.length} player, ${owners.length} owner)`);

    /* -------- PLAYER PROFILES -------- */
    await PlayerProfile.insertMany(
      players.map((p: any) => ({
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
      players.map((p: any) => ({
        user: p._id,
        pushNotifications: Math.random() > 0.3,
        darkMode: Math.random() > 0.5,
        privacyLevel: randomElement(["public", "friends", "private"]),
        preferredLocation: {
          city: randomElement(cities),
          lat: 45.4642 + Math.random() * 2,
          lng: 9.19 + Math.random() * 2,
          radius: 30,
        },
        favoriteStrutture: [],
        favoriteSports: [randomElement(["Beach Volley", "Volley"])],
        preferredTimeSlot: randomElement(["morning", "afternoon", "evening"]),
      }))
    );

    console.log(`✅ Create ${players.length} user preferences`);

    /* -------- FRIENDSHIPS -------- */
    const friendships: any[] = [];

    // Legenda:
    // Mario (0), Giulia (1), Luca (2-PRIVATO), Anna (3-PRIVATO), Marco (4),
    // Sofia (5-PRIVATO), Alessandro (6), Chiara (7-PRIVATO), Matteo (8), Elena (9)

    // === SCENARI DI TEST SPECIFICI ===

    // 1. Mario → Luca: pending (Mario ha richiesto a Luca che è privato)
    friendships.push({
      requester: players[0]._id, // Mario
      recipient: players[2]._id, // Luca (privato)
      status: "pending",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // 2. Luca → Mario: accepted (Luca segue Mario - direzione opposta)
    friendships.push({
      requester: players[2]._id, // Luca
      recipient: players[0]._id, // Mario
      status: "accepted",
      acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // 3. Anna → Mario: pending (Anna privata ha richiesto Mario)
    friendships.push({
      requester: players[3]._id, // Anna (privato)
      recipient: players[0]._id, // Mario
      status: "pending",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    // 4. Mario → Sofia: accepted (Mario segue Sofia privata - lei ha accettato)
    friendships.push({
      requester: players[0]._id, // Mario
      recipient: players[5]._id, // Sofia (privato)
      status: "accepted",
      acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // 5. Sofia → Mario: accepted (follow reciproco)
    friendships.push({
      requester: players[5]._id, // Sofia
      recipient: players[0]._id, // Mario
      status: "accepted",
      acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // 6. Mario → Chiara: pending (Mario ha richiesto Chiara privata)
    friendships.push({
      requester: players[0]._id, // Mario
      recipient: players[7]._id, // Chiara (privato)
      status: "pending",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    });

    // 7. Chiara → Mario: pending (anche Chiara ha richiesto Mario)
    friendships.push({
      requester: players[7]._id, // Chiara
      recipient: players[0]._id, // Mario
      status: "pending",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // === AMICIZIE NORMALI TRA ALTRI UTENTI ===

    // Giulia e Marco: amici reciproci
    friendships.push(
      {
        requester: players[1]._id, // Giulia
        recipient: players[4]._id, // Marco
        status: "accepted",
        acceptedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        requester: players[4]._id, // Marco
        recipient: players[1]._id, // Giulia
        status: "accepted",
        acceptedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      }
    );

    // Alessandro segue Mario (pubblico, auto-accepted)
    friendships.push({
      requester: players[6]._id, // Alessandro
      recipient: players[0]._id, // Mario
      status: "accepted",
      acceptedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });

    // Mario segue Giulia (pubblico, auto-accepted)
    friendships.push({
      requester: players[0]._id, // Mario
      recipient: players[1]._id, // Giulia
      status: "accepted",
      acceptedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });

    // Matteo segue Mario
    friendships.push({
      requester: players[8]._id, // Matteo
      recipient: players[0]._id, // Mario
      status: "accepted",
      acceptedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    });

    // Elena segue Mario
    friendships.push({
      requester: players[9]._id, // Elena
      recipient: players[0]._id, // Mario
      status: "accepted",
      acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // Amicizie tra altri player (network più ampio)
    for (let i = 10; i < 15; i++) {
      if (players[i]) {
        // Alcuni seguono Mario
        friendships.push({
          requester: players[i]._id,
          recipient: players[0]._id,
          status: "accepted",
          acceptedAt: new Date(Date.now() - randomInt(1, 20) * 24 * 60 * 60 * 1000),
        });

        // Alcuni hanno amicizie reciproche tra loro
        if (i < 14 && players[i + 1]) {
          friendships.push(
            {
              requester: players[i]._id,
              recipient: players[i + 1]._id,
              status: "accepted",
              acceptedAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000),
            },
            {
              requester: players[i + 1]._id,
              recipient: players[i]._id,
              status: "accepted",
              acceptedAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000),
            }
          );
        }
      }
    }

    await Friendship.insertMany(friendships);
    console.log(`✅ Create ${friendships.length} amicizie`);
    console.log(`   - Scenari di test per privacy e stati diversi`);
    console.log(`   - Mario ha richieste pending verso: Luca, Chiara`);
    console.log(`   - Mario ha richieste incoming da: Anna, Chiara`);
    console.log(`   - Mario segue: Sofia (privata, accettata), Giulia`);
    console.log(`   - Mario è seguito da: Luca, Alessandro, Matteo, Elena, altri...`);

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
        lat: 45.452,
        lng: 9.21,
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
      struttureData.map((s) => {
        // ✅ Assegna randomicamente 2-4 immagini a ogni struttura
        const numImages = strutturaImageUrls.length > 0 ? randomInt(2, Math.min(4, strutturaImageUrls.length)) : 0;
        const strutturaImages: string[] = [];
        
        if (numImages > 0) {
          const shuffled = [...strutturaImageUrls].sort(() => 0.5 - Math.random());
          strutturaImages.push(...shuffled.slice(0, numImages));
        }

        return {
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
          openingHours: {
            monday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
            tuesday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
            wednesday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
            thursday: { closed: false, slots: [{ open: "09:00", close: "22:00" }] },
            friday: { closed: false, slots: [{ open: "09:00", close: "23:00" }] },
            saturday: { closed: false, slots: [{ open: "08:00", close: "23:00" }] },
            sunday: { closed: false, slots: [{ open: "08:00", close: "22:00" }] },
          },
          images: strutturaImages,
          rating: { average: s.rating, count: s.count },
          isActive: true,
          isFeatured: s.isFeatured,
          isDeleted: false,
        };
      })
    );

    console.log(`✅ Create ${strutture.length} strutture`);
    if (strutturaImageUrls.length > 0) {
      const totImagesAssigned = strutture.reduce((acc: number, s: any) => acc + s.images.length, 0);
      console.log(`   📸 ${totImagesAssigned} immagini assegnate alle strutture (2-4 per struttura)`);
    }

    /* -------- EVENTS (4) -------- */
    const eventsData = [
      {
        name: "Torneo Beach Volley Milano",
        description: "Torneo amatoriale 2x2 con gironi e finali.",
        type: "tournament",
        organizer: owners[0]._id,
        struttura: strutture[0]._id,
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sport: "beach volley",
        maxParticipants: 16,
        isPublic: true,
        participants: [players[0]._id, players[1]._id, players[2]._id],
        status: "open",
      },
      {
        name: "Lega Volley Indoor Roma",
        description: "Campionato a squadre 6x6 per livello intermedio.",
        type: "league",
        organizer: owners[1]._id,
        struttura: strutture[1]._id,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        sport: "volley",
        maxParticipants: 24,
        isPublic: false,
        participants: [players[3]._id, players[4]._id, players[5]._id],
        status: "open",
      },
      {
        name: "Amichevole Beach Torino",
        description: "Partita amichevole per nuovi iscritti.",
        type: "friendly",
        organizer: owners[2]._id,
        struttura: strutture[2]._id,
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        sport: "beach volley",
        isPublic: true,
        participants: [players[6]._id, players[7]._id],
        status: "open",
      },
      {
        name: "Torneo Estivo Rimini",
        description: "Evento open per tutti i livelli.",
        type: "tournament",
        organizer: owners[1]._id,
        struttura: strutture[7]._id,
        startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        sport: "beach volley",
        maxParticipants: 20,
        isPublic: true,
        participants: [players[8]._id, players[9]._id, players[10]._id],
        status: "open",
      },
    ];

    const events = await Event.insertMany(eventsData);
    console.log(`OK Creati ${events.length} eventi`);

    /* -------- CAMPI (20) -------- */
    const campiData: any[] = [];

    // Ogni struttura ha 2-3 campi
    strutture.forEach((struttura: any, idx: number) => {
      const numCampi = idx < 3 ? 3 : 2; // Prime 3 strutture hanno 3 campi

      for (let i = 1; i <= numCampi; i++) {
        const isBeach = Math.random() > 0.3;
        const isIndoor = !isBeach && Math.random() > 0.5;

        campiData.push({
          struttura: struttura._id,
          name: `Campo ${isBeach ? "Beach" : "Volley"} ${i}`,
          sport: isBeach ? "beach volley" : "volley",
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
              slots:
                Math.random() > 0.5
                  ? [
                      {
                        start: "18:00",
                        end: "23:00",
                        label: "Sera",
                        prices: { oneHour: randomInt(40, 55), oneHourHalf: randomInt(56, 77) },
                      },
                    ]
                  : [],
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

    /* -------- CALENDARIO (Rolling 3 mesi) -------- */
    const dates = generateDatesForMonths(MONTHS_TO_GENERATE);
    const calendarDocs: any[] = [];

    const WEEK_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

    for (const campo of campi as any[]) {
      for (const dateStr of dates) {
        const date = new Date(dateStr + "T12:00:00");
        const weekday = WEEK_MAP[date.getDay()] as keyof typeof campo.weeklySchedule;
        const schedule = campo.weeklySchedule[weekday];

        let allSlots: any[] = [];
        if (schedule.enabled && schedule.open && schedule.close) {
          allSlots = generateHalfHourSlots(schedule.open, schedule.close);
        }

        calendarDocs.push({
          campo: campo._id,
          date: dateStr,
          slots: allSlots,
          isClosed: !schedule.enabled || allSlots.length === 0,
        });
      }
    }

    await CampoCalendarDay.insertMany(calendarDocs);
    console.log(`✅ Creati ${calendarDocs.length} giorni di calendario (${campi.length} campi × ${dates.length} giorni)`);

    /* -------- BOOKINGS (50) -------- */
    const bookings: any[] = [];
    const today = new Date();

    // Prenotazioni passate (ultimi 30 giorni)
    for (let i = 0; i < 30; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - randomInt(1, 30));

      const campo: any = randomElement(campi as any[]);
      const player: any = randomElement(players as any[]);
      const hour = randomInt(9, 20);
      const duration = randomElement([1, 1.5]);
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = duration === 1 ? hour + 1 : hour + 1;
      const endMinutes = duration === 1.5 ? "30" : "00";
      const endTime = `${String(endHour).padStart(2, "0")}:${endMinutes}`;

      bookings.push({
        user: player._id,
        campo: campo._id,
        struttura: campo.struttura,
        date: formatDate(pastDate),
        startTime,
        endTime,
        duration,
        price: randomInt(30, 50),
        status: "confirmed",
        bookingType: Math.random() > 0.3 ? "public" : "private", // 70% pubbliche, 30% private
      });
    }

    // Prenotazioni future (prossimi 10 giorni)
    for (let i = 0; i < 20; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + randomInt(0, 10));

      const campo: any = randomElement(campi as any[]);
      const player: any = randomElement(players as any[]);
      const hour = randomInt(9, 20);
      const duration = randomElement([1, 1.5]);
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = duration === 1 ? hour + 1 : hour + 1;
      const endMinutes = duration === 1.5 ? "30" : "00";
      const endTime = `${String(endHour).padStart(2, "0")}:${endMinutes}`;

      bookings.push({
        user: player._id,
        campo: campo._id,
        struttura: campo.struttura,
        date: formatDate(futureDate),
        startTime,
        endTime,
        duration,
        price: randomInt(30, 50),
        status: "confirmed",
        bookingType: Math.random() > 0.3 ? "public" : "private", // 70% pubbliche, 30% private
      });
    }

    const savedBookings = await Booking.insertMany(bookings);
    console.log(`✅ Create ${savedBookings.length} prenotazioni`);

    // ✅ Disabilita gli slot prenotati nel calendario
    for (const booking of savedBookings as any[]) {
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

    /* -------- MATCH (vari tipi) -------- */
    const pastBookings = (savedBookings as any[]).filter((b) => {
      const bookingDate = new Date(b.date);
      return bookingDate < today;
    });

    const futureBookings = (savedBookings as any[]).filter((b) => {
      const bookingDate = new Date(b.date);
      return bookingDate >= today;
    });

    const matches: any[] = [];
    const matchCounters = { completed: 0, noResult: 0, inProgress: 0, open: 0, full: 0, draft: 0 };

    // 1. MATCH PASSATI COMPLETATI (con risultato) - 10 match
    for (let i = 0; i < Math.min(10, pastBookings.length); i++) {
      const booking = pastBookings[i];
      const creator = booking.user;

      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator.toString()];

      // Primo giocatore è il creatore del booking
      matchPlayers.push({
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(booking.date),
        respondedAt: new Date(booking.date),
      });

      // Altri 3 giocatori casuali
      for (let j = 1; j < 4; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
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
      const sets: any[] = [];
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

      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: matchPlayers,
        maxPlayers: 4,
        isPublic: true,
        score: { sets },
        winner: winsA > winsB ? "A" : "B",
        playedAt: new Date(booking.date),
        status: "completed",
      });
      matchCounters.completed++;
    }

    // 2. MATCH PASSATI SENZA RISULTATO - 5 match (per testare inserimento risultato)
    for (let i = 10; i < Math.min(15, pastBookings.length); i++) {
      const booking = pastBookings[i];
      const creator = booking.user;

      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator.toString()];

      matchPlayers.push({
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(booking.date),
        respondedAt: new Date(booking.date),
      });

      for (let j = 1; j < 4; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
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

      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: matchPlayers,
        maxPlayers: 4,
        isPublic: true,
        playedAt: new Date(booking.date),
        status: "completed",
      });
      matchCounters.noResult++;
    }

    // 3. MATCH IN CORSO (in_progress) - 2 match
    const now = new Date();
    const currentHour = now.getHours();

    for (let i = 0; i < 2; i++) {
      const campo: any = randomElement(campi as any[]);
      const creator: any = randomElement(players as any[]);

      // Orario: iniziato 30 minuti fa, finisce tra 30 minuti
      const startHour = currentHour - 1;
      const startTime = `${String(startHour).padStart(2, "0")}:30`;
      const endTime = `${String(currentHour + 1).padStart(2, "0")}:00`;

      const inProgressBooking = await Booking.create({
        user: creator._id,
        campo: campo._id,
        struttura: campo.struttura,
        date: formatDate(now),
        startTime,
        endTime,
        duration: 1.5,
        price: 40,
        status: "confirmed",
        bookingType: "public",
      });

      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator._id.toString()];

      matchPlayers.push({
        user: creator._id,
        team: "A",
        status: "confirmed",
        joinedAt: now,
        respondedAt: now,
      });

      for (let j = 1; j < 4; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
        } while (selectedPlayers.includes(player._id.toString()));

        selectedPlayers.push(player._id.toString());
        matchPlayers.push({
          user: player._id,
          team: j < 2 ? "A" : "B",
          status: "confirmed",
          joinedAt: now,
          respondedAt: now,
        });
      }

      matches.push({
        booking: inProgressBooking._id,
        createdBy: creator._id,
        players: matchPlayers,
        maxPlayers: 4,
        isPublic: true,
        status: "full",
      });
      matchCounters.inProgress++;
    }

    // 4. MATCH FUTURI APERTI (open) - 5 match (per testare inviti)
    for (let i = 0; i < Math.min(5, futureBookings.length); i++) {
      const booking = futureBookings[i];
      const creator = booking.user;

      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator.toString()];

      matchPlayers.push({
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      });

      // Solo 2 giocatori (mancano 2 posti)
      let player: any;
      do {
        player = randomElement(players as any[]);
      } while (selectedPlayers.includes(player._id.toString()));

      selectedPlayers.push(player._id.toString());
      matchPlayers.push({
        user: player._id,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      });

      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: matchPlayers,
        maxPlayers: 4,
        isPublic: true,
        status: "open",
      });
      matchCounters.open++;
    }

    // 5. MATCH FUTURI COMPLETI (full) - 5 match
    for (let i = 5; i < Math.min(10, futureBookings.length); i++) {
      const booking = futureBookings[i];
      const creator = booking.user;

      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator.toString()];

      matchPlayers.push({
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      });

      for (let j = 1; j < 4; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
        } while (selectedPlayers.includes(player._id.toString()));

        selectedPlayers.push(player._id.toString());
        matchPlayers.push({
          user: player._id,
          team: j < 2 ? "A" : "B",
          status: "confirmed",
          joinedAt: new Date(),
          respondedAt: new Date(),
        });
      }

      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: matchPlayers,
        maxPlayers: 4,
        isPublic: true,
        status: "full",
      });
      matchCounters.full++;
    }

    // 6. MATCH PER TUTTI I BOOKING RIMANENTI (draft/privati)
    const bookingsWithMatch = matches.map((m) => m.booking.toString());
    const bookingsWithoutMatch = (savedBookings as any[]).filter((b) => !bookingsWithMatch.includes(b._id.toString()));

    console.log(`\n📝 Creazione match per i ${bookingsWithoutMatch.length} booking rimanenti...`);

    for (const booking of bookingsWithoutMatch) {
      matches.push({
        booking: booking._id,
        createdBy: booking.user,
        players: [
          {
            user: booking.user,
            status: "confirmed",
            joinedAt: new Date(),
            respondedAt: new Date(),
          },
        ],
        maxPlayers: 4,
        isPublic: false,
        status: "draft",
      });
      matchCounters.draft++;
    }

    const savedMatches = await Match.insertMany(matches);
    console.log(`✅ Creati ${savedMatches.length} match:`);
    console.log(`   - ${matchCounters.completed} completati con risultato`);
    console.log(`   - ${matchCounters.noResult} completati senza risultato`);
    console.log(`   - ${matchCounters.inProgress} in corso`);
    console.log(`   - ${matchCounters.open} aperti (2/4 giocatori)`);
    console.log(`   - ${matchCounters.full} completi (4/4 giocatori)`);
    console.log(`   - ${matchCounters.draft} in bozza/privati`);

    /* -------- CONVERSATIONS -------- */
    const directConversations = (strutture as any[]).slice(0, 4).map((s: any, idx: number) => ({
      type: "direct",
      user: players[idx]._id,
      struttura: s._id,
      owner: s.owner,
      lastMessage: "Ciao! Vorrei info sui campi.",
      lastMessageAt: new Date(),
      unreadByUser: randomInt(0, 2),
      unreadByOwner: randomInt(0, 2),
    }));

    const groupConversations = (savedMatches as any[]).slice(0, 3).map((m: any, idx: number) => ({
      type: "group",
      participants: m.players.map((p: any) => p.user),
      match: m._id,
      groupName: `Match ${idx + 1}`,
      lastMessage: "Ci vediamo in campo!",
      lastMessageAt: new Date(),
      unreadCount: Object.fromEntries(m.players.map((p: any) => [p.user.toString(), randomInt(0, 2)])),
    }));

    const savedConversations = await Conversation.insertMany([...directConversations, ...groupConversations]);

    console.log(`OK Create ${savedConversations.length} conversazioni`);

    /* -------- MESSAGES -------- */
    const messages: any[] = [];

    for (const conv of savedConversations as any[]) {
      if (conv.type === "direct") {
        messages.push(
          {
            conversationId: conv._id,
            sender: conv.user,
            senderType: "user",
            content: "Ciao, posso prenotare per sabato?",
            read: true,
          },
          {
            conversationId: conv._id,
            sender: conv.owner,
            senderType: "owner",
            content: "Certo! Dimmi orario e campo.",
            read: false,
          }
        );
      } else {
        const senderId = conv.participants[0];
        messages.push({
          conversationId: conv._id,
          sender: senderId,
          senderType: "user",
          content: "Ragazzi, confermiamo l'orario?",
          read: false,
        });
      }
    }

    const savedMessages = await Message.insertMany(messages);
    console.log(`OK Creati ${savedMessages.length} messaggi`);

    /* -------- NOTIFICATIONS -------- */
    const notifications = [
      {
        recipient: players[0]._id,
        sender: players[1]._id,
        type: "new_follower",
        title: "Nuovo follower",
        message: `${players[1].name} ha iniziato a seguirti.`,
        relatedId: players[1]._id,
        relatedModel: "User",
      },
      {
        recipient: players[0]._id,
        sender: players[2]._id,
        type: "match_invite",
        title: "Invito partita",
        message: "Sei stato invitato a una partita.",
        relatedId: (savedMatches as any[])[0]._id,
        relatedModel: "Match",
      },
      {
        recipient: players[3]._id,
        sender: owners[0]._id,
        type: "match_start",
        title: "Match iniziato",
        message: "Il tuo match sta per iniziare.",
        relatedId: (savedMatches as any[])[1]._id,
        relatedModel: "Match",
      },
      {
        recipient: players[4]._id,
        sender: owners[1]._id,
        type: "match_result",
        title: "Risultato match",
        message: "Il risultato del match e' disponibile.",
        relatedId: (savedMatches as any[])[2]._id,
        relatedModel: "Match",
      },
    ];

    const savedNotifications = await Notification.insertMany(notifications);
    console.log(`OK Create ${savedNotifications.length} notifiche`);

    /* -------- SUMMARY -------- */
    console.log("\n" + "=".repeat(50));
    console.log("🌱 SEED COMPLETATO CON SUCCESSO");
    console.log("=".repeat(50));
    console.log(`👥 Utenti: ${users.length} (${players.length} player, ${owners.length} owner)`);
    console.log(`🤝 Amicizie: ${friendships.length}`);
    console.log(`🏟️ Strutture: ${strutture.length}`);
    console.log(`⚽ Campi: ${campi.length}`);
    console.log(`📅 Giorni calendario: ${calendarDocs.length}`);
    console.log(`📝 Prenotazioni: ${savedBookings.length}`);
    console.log(`🏆 Match: ${matches.length}`);
    console.log("=".repeat(50));
    console.log("🔑 Password per tutti gli utenti: 123");
    console.log("\n📧 UTENTI PLAYER:");
    players.slice(0, 5).forEach((p: any) => {
      console.log(`   - ${p.email} (${p.username})`);
    });
    console.log(`   ... e altri ${players.length - 5} player`);
    console.log("\n👔 UTENTI OWNER:");
    owners.forEach((o: any) => {
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

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
import StrutturaFollower from "./models/StrutturaFollower";
import UserFollower from "./models/UserFollower";
import Post from "./models/Post";
import CommunityEvent from "./models/CommunityEvent";
import Sport from "./models/Sport";
import { 
  seedSports, 
  getSportMapping, 
  getRandomSportForEnvironment,
  getRecommendedSurfaceForSport,
  getMaxPlayersForSport
} from "./seeds/seedSports";

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

/**
 * Converte openingHours della struttura in weeklySchedule per i campi
 * openingHours: { monday: { closed: boolean, slots: [{open, close}] } }
 * weeklySchedule: { monday: { enabled: boolean, open: string, close: string } }
 */
function convertOpeningHoursToWeeklySchedule(openingHours: any): any {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weeklySchedule: any = {};

  for (const day of days) {
    const dayHours = openingHours[day];
    if (!dayHours || dayHours.closed || !dayHours.slots || dayHours.slots.length === 0) {
      // Giorno chiuso
      weeklySchedule[day] = { enabled: false, open: "09:00", close: "22:00" };
    } else {
      // Giorno aperto - usa il primo slot disponibile
      const firstSlot = dayHours.slots[0];
      weeklySchedule[day] = {
        enabled: true,
        open: firstSlot.open || "09:00",
        close: firstSlot.close || "22:00",
      };
    }
  }

  return weeklySchedule;
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
      Post.deleteMany({}),
      UserFollower.deleteMany({}),
      StrutturaFollower.deleteMany({}),
      Message.deleteMany({}),
      Conversation.deleteMany({}),
      Notification.deleteMany({}),
      Friendship.deleteMany({}),
      Event.deleteMany({}),
      CommunityEvent.deleteMany({}),
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
      struttureData.map((s, idx) => {
        // ✅ Assegna randomicamente 2-4 immagini a ogni struttura
        const numImages = strutturaImageUrls.length > 0 ? randomInt(2, Math.min(4, strutturaImageUrls.length)) : 0;
        const strutturaImages: string[] = [];
        
        if (numImages > 0) {
          const shuffled = [...strutturaImageUrls].sort(() => 0.5 - Math.random());
          strutturaImages.push(...shuffled.slice(0, numImages));
        }

        // ✅ Prima struttura (Beach Volley Milano Centro) chiusa sabato/domenica per TESTING
        const isClosedWeekend = idx === 0;

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
            saturday: { closed: isClosedWeekend, slots: isClosedWeekend ? [] : [{ open: "08:00", close: "23:00" }] },
            sunday: { closed: isClosedWeekend, slots: isClosedWeekend ? [] : [{ open: "08:00", close: "22:00" }] },
          },
          images: strutturaImages,
          rating: { average: s.rating, count: s.count },
          isActive: true,
          isFeatured: s.isFeatured,
          isDeleted: false,
          // Abilita split dei costi per le prime 2 strutture (per test)
          isCostSplittingEnabled: idx < 2,
        };
      })
    );

    console.log(`✅ Create ${strutture.length} strutture`);
    if (strutturaImageUrls.length > 0) {
      const totImagesAssigned = strutture.reduce((acc: number, s: any) => acc + s.images.length, 0);
      console.log(`   📸 ${totImagesAssigned} immagini assegnate alle strutture (2-4 per struttura)`);
    }

    /* -------- STRUTTURA FOLLOWERS -------- */
    const strutturaFollowers: any[] = [];
    const strutturaFollowerKeys = new Set<string>(); // Per evitare duplicati

    // Helper per creare chiave unica
    const makeFollowerKey = (userId: string, strutturaId: string) => `${userId}-${strutturaId}`;

    // Utenti seguono strutture (players seguono varie strutture)
    players.forEach((player: any, idx: number) => {
      // Ogni player segue 1-3 strutture random
      const numToFollow = randomInt(1, 3);
      const shuffled = [...strutture].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numToFollow && i < shuffled.length; i++) {
        const key = makeFollowerKey(player._id.toString(), (shuffled[i] as any)._id.toString());
        if (!strutturaFollowerKeys.has(key)) {
          strutturaFollowerKeys.add(key);
          strutturaFollowers.push({
            user: player._id,
            struttura: (shuffled[i] as any)._id,
            status: "active",
            createdAt: new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000),
          });
        }
      }
    });

    // Mario segue specificamente le prime 2 strutture per i test (se non già presenti)
    const marioStruttura0Key = makeFollowerKey(players[0]._id.toString(), strutture[0]._id.toString());
    const marioStruttura1Key = makeFollowerKey(players[0]._id.toString(), strutture[1]._id.toString());
    
    if (!strutturaFollowerKeys.has(marioStruttura0Key)) {
      strutturaFollowerKeys.add(marioStruttura0Key);
      strutturaFollowers.push({
        user: players[0]._id,
        struttura: strutture[0]._id,
        status: "active",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });
    }
    
    if (!strutturaFollowerKeys.has(marioStruttura1Key)) {
      strutturaFollowerKeys.add(marioStruttura1Key);
      strutturaFollowers.push({
        user: players[0]._id,
        struttura: strutture[1]._id,
        status: "active",
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      });
    }

    await StrutturaFollower.insertMany(strutturaFollowers);
    console.log(`✅ Creati ${strutturaFollowers.length} StrutturaFollower (utenti seguono strutture)`);

    /* -------- USER FOLLOWERS -------- */
    const userFollowers: any[] = [];
    const userFollowerKeys = new Set<string>(); // Per evitare duplicati

    // Helper per creare chiave unica
    const makeUserFollowerKey = (strutturaId: string, userId: string) => `${strutturaId}-${userId}`;

    // Strutture seguono utenti che hanno giocato nelle loro strutture
    // Per ogni struttura, segui 3-5 player random
    strutture.forEach((struttura: any) => {
      const numToFollow = randomInt(3, 5);
      const shuffled = [...players].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numToFollow && i < shuffled.length; i++) {
        const key = makeUserFollowerKey(struttura._id.toString(), (shuffled[i] as any)._id.toString());
        if (!userFollowerKeys.has(key)) {
          userFollowerKeys.add(key);
          userFollowers.push({
            struttura: struttura._id,
            user: (shuffled[i] as any)._id,
            status: "active",
            createdAt: new Date(Date.now() - randomInt(1, 45) * 24 * 60 * 60 * 1000),
          });
        }
      }
    });

    // Prima struttura segue specificamente Mario e Giulia per i test (se non già presenti)
    const struttura0MarioKey = makeUserFollowerKey(strutture[0]._id.toString(), players[0]._id.toString());
    const struttura0GiuliaKey = makeUserFollowerKey(strutture[0]._id.toString(), players[1]._id.toString());
    
    if (!userFollowerKeys.has(struttura0MarioKey)) {
      userFollowerKeys.add(struttura0MarioKey);
      userFollowers.push({
        struttura: strutture[0]._id,
        user: players[0]._id, // Mario
        status: "active",
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      });
    }
    
    if (!userFollowerKeys.has(struttura0GiuliaKey)) {
      userFollowerKeys.add(struttura0GiuliaKey);
      userFollowers.push({
        struttura: strutture[0]._id,
        user: players[1]._id, // Giulia
        status: "active",
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      });
    }

    await UserFollower.insertMany(userFollowers);
    console.log(`✅ Creati ${userFollowers.length} UserFollower (strutture seguono utenti)`);

    /* -------- POSTS -------- */
    console.log(`\n🚀 Inizio creazione Post...`);
    const posts: any[] = [];

    // POST UTENTI (15 post)
    console.log(`📝 Preparazione post utenti...`);
    const postContents = [
      "Che bella partita oggi! 🏐",
      "Cerco compagni per una partita domani sera",
      "Qualcuno disponibile per un 2v2?",
      "Miglior campo dove ho giocato! 🔥",
      "Chi viene a giocare questo weekend?",
      "Alla ricerca di un team per il torneo",
      "Fantastica serata di beach volley!",
      "Qualcuno per una partita veloce?",
      "Ho bisogno di migliorare il mio servizio, consigli?",
      "Beach volley sotto le stelle ⭐",
      "Partita epica oggi!",
      "Chi è pronto per l'estate? 🏖️",
      "Nuovo record personale!",
      "Grazie a tutti per la bella partita!",
      "Non vedo l'ora di giocare ancora!",
    ];

    console.log(`📊 Creazione ${15} post utenti con likes e commenti...`);
    try {
      for (let i = 0; i < 15; i++) {
        try {
          if (i % 5 === 0) console.log(`   - Creato post utente ${i}/15...`);

          const author = randomElement(players as any[]);
          const content = randomElement(postContents);
          const likesCount = randomInt(0, 15);
          const likesUsers = new Set<string>();

          while (likesUsers.size < likesCount) {
            const randomPlayer = randomElement(players as any[]);
            likesUsers.add(randomPlayer._id.toString());
          }

          const commentsCount = randomInt(0, 5);
          const comments: any[] = [];

          for (let c = 0; c < commentsCount; c++) {
            const commenter = randomElement(players as any[]);
            comments.push({
              _id: new mongoose.Types.ObjectId(),
              user: commenter._id,
              text: randomElement([
                "Grande!",
                "Ci sono!",
                "Quando?",
                "Ottima idea!",
                "Conta su di me",
                "Sono d'accordo",
                "Bellissimo!",
              ]),
              createdAt: new Date(Date.now() - randomInt(1, 10) * 60 * 60 * 1000),
            });
          }

          posts.push({
            user: author._id,
            content,
            likes: Array.from(likesUsers),
            comments,
            isStrutturaPost: false,
            createdAt: new Date(Date.now() - randomInt(1, 20) * 24 * 60 * 60 * 1000),
          });
        } catch (err) {
          console.error(`❌ Errore durante la creazione del post utente index=${i}:`, err);
        }
      }
      console.log(`✅ Preparati ${posts.length} post utenti`);
    } catch (err) {
      console.error('❌ Errore nella sezione creazione post utenti:', err);
    }

    // POST STRUTTURE (10 post)
    console.log(`📝 Preparazione post strutture...`);
    const strutturaPostContents = [
      "Nuovi orari disponibili per il weekend! 🎉",
      "Torneo questo sabato, iscriviti ora!",
      "Offerta speciale: sconto 20% su prenotazioni serali",
      "I nostri campi sono pronti per voi! ☀️",
      "Grazie a tutti per il vostro supporto!",
      "Evento speciale in programma!",
      "Nuova illuminazione LED installata!",
      "Happy hour: prezzi ridotti dalle 18 alle 20",
      "Weekend di beach volley: chi viene?",
      "La stagione è iniziata alla grande!",
    ];

    console.log(`📊 Creazione ${10} post strutture con likes e commenti...`);
    let savedPosts: any[] = [];
    try {
      for (let i = 0; i < 10; i++) {
        try {
          if (i % 3 === 0) console.log(`   - Creato post struttura ${i}/10...`);

          const struttura = randomElement(strutture as any[]);
          const content = randomElement(strutturaPostContents);
          const maxLikes = (players as any[]).length;
          const likesCount = Math.min(randomInt(5, 25), maxLikes);
          const likesUsers = new Set<string>();

          while (likesUsers.size < likesCount) {
            const randomPlayer = randomElement(players as any[]);
            likesUsers.add(randomPlayer._id.toString());
          }

          const commentsCount = randomInt(0, 8);
          const comments: any[] = [];

          for (let c = 0; c < commentsCount; c++) {
            const commenter = randomElement(players as any[]);
            const isStrutturaComment = Math.random() > 0.7; // 30% commenti dalla struttura

            comments.push({
              _id: new mongoose.Types.ObjectId(),
              user: commenter._id,
              struttura: isStrutturaComment ? struttura._id : undefined,
              text: randomElement([
                "Ottimo!",
                "Ci sarò!",
                "Interessante",
                "Grazie per l'info",
                "Perfetto!",
                "Come posso prenotare?",
                "Fantastico!",
                "Quando inizia?",
              ]),
              createdAt: new Date(Date.now() - randomInt(1, 15) * 60 * 60 * 1000),
            });
          }

          posts.push({
            user: struttura.owner,
            content,
            struttura: struttura._id,
            isStrutturaPost: true,
            likes: Array.from(likesUsers),
            comments,
            createdAt: new Date(Date.now() - randomInt(1, 15) * 24 * 60 * 60 * 1000),
          });
        } catch (err) {
          console.error(`❌ Errore durante la creazione del post struttura index=${i}:`, err);
        }
      }

    console.log(`✅ Preparati ${posts.length} post totali (utenti + strutture)`);

    console.log(`💾 Inserimento ${posts.length} post nel database...`);
    try {
      savedPosts = await Post.insertMany(posts);
      console.log(`✅ Creati ${savedPosts.length} post (${posts.filter(p => !p.isStrutturaPost).length} utenti, ${posts.filter(p => p.isStrutturaPost).length} strutture)`);
    } catch (err) {
      console.error('❌ Errore durante Post.insertMany:', err);
    }
    } catch (err) {
      console.error('❌ Errore nella sezione creazione post strutture:', err);
    }

    /* -------- EVENTS (4) -------- */
    console.log(`\n🎉 Creazione Eventi...`);
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
    console.log(`✅ Creati ${events.length} eventi`);

    /* -------- COMMUNITY EVENTS (5) -------- */
    console.log(`\n🎊 Creazione Community Events...`);
    const communityEventsData = [
      {
        title: "Torneo Beach Volley Amatoriale",
        description: "Torneo aperto a tutti i livelli. Iscrizione gratuita!",
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        location: "Milano Beach Arena",
        organizer: players[0]._id,
        participants: [players[1]._id, players[2]._id, players[3]._id],
        maxParticipants: 16,
        status: "upcoming",
        struttura: strutture[0]._id,
        isStrutturaEvent: false,
      },
      {
        title: "Open Day Struttura",
        description: "Vieni a provare i nostri campi gratuitamente!",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: strutture[1].name,
        organizer: owners[1]._id,
        participants: [players[4]._id, players[5]._id],
        maxParticipants: 30,
        status: "upcoming",
        struttura: strutture[1]._id,
        isStrutturaEvent: true,
      },
      {
        title: "Clinic con Professionisti",
        description: "Allenamento tecnico con coach professionista",
        date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        location: strutture[5].name,
        organizer: owners[5]._id,
        participants: [players[6]._id, players[7]._id, players[8]._id],
        maxParticipants: 12,
        status: "upcoming",
        struttura: strutture[5]._id,
        isStrutturaEvent: true,
      },
      {
        title: "Beach Party & Volley",
        description: "Serata di beach volley e divertimento con DJ set",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        location: "Rimini Beach",
        organizer: players[9]._id,
        participants: [players[10]._id, players[11]._id],
        maxParticipants: 50,
        status: "upcoming",
        struttura: strutture[7]._id,
        isStrutturaEvent: false,
      },
      {
        title: "Campionato Estivo",
        description: "Campionato a squadre - Iscrizioni aperte",
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        location: "Bologna Volley Club",
        organizer: owners[3]._id,
        participants: [],
        maxParticipants: 24,
        status: "upcoming",
        struttura: strutture[3]._id,
        isStrutturaEvent: true,
      },
    ];

    const communityEvents = await CommunityEvent.insertMany(communityEventsData);
    console.log(`✅ Creati ${communityEvents.length} community events`);

    /* -------- CAMPI (20) -------- */
    const campiData: any[] = [];

    // Ogni struttura ha 2-3 campi
    strutture.forEach((struttura: any, idx: number) => {
      const numCampi = idx < 3 ? 3 : 2; // Prime 3 strutture hanno 3 campi

      for (let i = 1; i <= numCampi; i++) {
          const isBeach = Math.random() > 0.3;
          const isIndoor = !isBeach && Math.random() > 0.5;

          // deterministico prezzo base e possibili tariffe per-player
          const pricePerHour = randomInt(30, 50);
          const flatOne = randomInt(30, 50);
          const flatOneHalf = randomInt(42, 70);
          const baseOne = randomInt(30, 45);
          const baseOneHalf = randomInt(42, 63);

          // ✅ Abilita playerCountPricing per TUTTI i campi beach volley (non solo prime 2 strutture)
          const enablePlayerPricing = isBeach;
          const playerPrices = enablePlayerPricing
            ? [
                {
                  count: 4,
                  label: "4 giocatori",
                  prices: {
                    oneHour: Math.max(8, Math.round(pricePerHour / 4)),
                    oneHourHalf: Math.max(11, Math.round((pricePerHour * 1.4) / 4)),
                  },
                },
                {
                  count: 6,
                  label: "6 giocatori",
                  prices: {
                    oneHour: Math.max(6, Math.round(pricePerHour / 6)),
                    oneHourHalf: Math.max(8, Math.round((pricePerHour * 1.4) / 6)),
                  },
                },
                {
                  count: 8,
                  label: "8 giocatori",
                  prices: {
                    oneHour: Math.max(5, Math.round(pricePerHour / 8)),
                    oneHourHalf: Math.max(7, Math.round((pricePerHour * 1.4) / 8)),
                  },
                },
              ]
            : [];

          const campoMaxPlayers = isBeach ? randomInt(4, 8) : 10;

          // ✅ Pricing avanzato con esempi realistici
          const enableTimeSlot = Math.random() > 0.5;
          const enableDateOverride = idx === 0 && i === 1; // Solo primo campo della prima struttura
          const enablePeriodOverride = idx === 1 && i === 1; // Solo primo campo della seconda struttura

          // TimeSlot con giorni specifici (weekend vs feriali)
          const timeSlots = enableTimeSlot
            ? [
                {
                  start: "18:00",
                  end: "23:00",
                  label: "Serale Weekend",
                  prices: { oneHour: randomInt(45, 60), oneHourHalf: randomInt(63, 84) },
                  daysOfWeek: [5, 6, 0], // Ven, Sab, Dom
                },
                {
                  start: "18:00",
                  end: "23:00",
                  label: "Serale Feriale",
                  prices: { oneHour: randomInt(35, 50), oneHourHalf: randomInt(49, 70) },
                  daysOfWeek: [1, 2, 3, 4], // Lun-Gio
                },
              ]
            : [];

          // Date override per eventi speciali
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateOverrides = enableDateOverride
            ? [
                {
                  date: formatDate(tomorrow),
                  label: "Evento Speciale",
                  prices: { oneHour: 25, oneHourHalf: 35 },
                },
              ]
            : [];

          // Period override per estate/inverno
          const summerStart = new Date();
          summerStart.setMonth(5, 1); // 1 giugno
          const summerEnd = new Date();
          summerEnd.setMonth(8, 30); // 30 settembre
          const periodOverrides = enablePeriodOverride
            ? [
                {
                  startDate: formatDate(summerStart),
                  endDate: formatDate(summerEnd),
                  label: "Estate",
                  prices: { oneHour: randomInt(50, 65), oneHourHalf: randomInt(70, 91) },
                },
              ]
            : [];

          // ✅ Genera weeklySchedule dai openingHours della struttura
          const weeklySchedule = convertOpeningHoursToWeeklySchedule(struttura.openingHours);

          campiData.push({
            struttura: struttura._id,
            name: `Campo ${isBeach ? "Beach" : "Volley"} ${i}`,
            sport: isBeach ? "beach volley" : "volley",
            surface: isBeach ? "sand" : isIndoor ? "pvc" : "cement",
            maxPlayers: campoMaxPlayers,
            indoor: isIndoor,
            pricePerHour: pricePerHour,
            isActive: true,
            pricingRules: {
              mode: Math.random() > 0.5 ? "flat" : "advanced",
              flatPrices: { oneHour: flatOne, oneHourHalf: flatOneHalf },
              basePrices: { oneHour: baseOne, oneHourHalf: baseOneHalf },
              timeSlotPricing: {
                enabled: enableTimeSlot,
                slots: timeSlots,
              },
              dateOverrides: { enabled: enableDateOverride, dates: dateOverrides },
              periodOverrides: { enabled: enablePeriodOverride, periods: periodOverrides },
              playerCountPricing: { enabled: !!enablePlayerPricing, prices: playerPrices },
            },
            weeklySchedule,
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

      const bookingType = Math.random() > 0.3 ? "public" : "private"; // 70% pubbliche, 30% private
      const paymentMode = bookingType === "public" ? "split" : "full";
      const totalPrice = randomInt(30, 50);
      const numPeople = bookingType === "public" && campo.sport === "beach volley" ? randomInt(4, 6) : undefined;
      const unitPrice = numPeople ? Math.round(totalPrice / numPeople) : undefined;

      bookings.push({
        user: player._id,
        campo: campo._id,
        struttura: campo.struttura,
        date: formatDate(pastDate),
        startTime,
        endTime,
        duration,
        price: totalPrice,
        numberOfPeople: numPeople,
        unitPrice: unitPrice,
        status: "confirmed",
        bookingType,
        paymentMode,
        ownerEarnings: totalPrice, // Owner guadagna 100% del prezzo
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

      const bookingType = Math.random() > 0.3 ? "public" : "private"; // 70% pubbliche, 30% private
      const paymentMode = bookingType === "public" ? "split" : "full";
      const totalPrice = randomInt(30, 50);
      const numPeople = bookingType === "public" && campo.sport === "beach volley" ? randomInt(4, 6) : undefined;
      const unitPrice = numPeople ? Math.round(totalPrice / numPeople) : undefined;

      bookings.push({
        user: player._id,
        campo: campo._id,
        struttura: campo.struttura,
        date: formatDate(futureDate),
        startTime,
        endTime,
        duration,
        price: totalPrice,
        numberOfPeople: numPeople,
        unitPrice: unitPrice,
        status: "confirmed",
        bookingType,
        paymentMode,
        ownerEarnings: totalPrice, // Owner guadagna 100% del prezzo
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

    // 💰 Inizializza mappa guadagni owner (verrà popolata dopo con tutti i booking)
    const ownerEarningsMap = new Map<string, { total: number, earnings: any[] }>();

    // Calcola guadagni per i booking già salvati
    for (const booking of savedBookings as any[]) {
      const campo = campi.find((c: any) => c._id.toString() === booking.campo.toString());
      if (!campo) continue;

      const struttura = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
      if (!struttura) continue;

      const ownerId = struttura.owner.toString();
      const ownerEarnings = booking.ownerEarnings || 0;

      if (!ownerEarningsMap.has(ownerId)) {
        ownerEarningsMap.set(ownerId, { total: 0, earnings: [] });
      }

      const ownerData = ownerEarningsMap.get(ownerId)!;
      ownerData.total += ownerEarnings;
      ownerData.earnings.push({
        type: "booking",
        amount: ownerEarnings,
        booking: booking._id,
        description: `Guadagno da prenotazione ${campo.name} - ${booking.date} ${booking.startTime}`,
        createdAt: new Date(booking.createdAt || booking.date),
      });
    }

    console.log(`💰 Calcolati guadagni per ${savedBookings.length} prenotazioni base`);

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
    const matchCounters = { completed: 0, noResult: 0, inProgress: 0, open: 0, full: 0 };

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

      // Altri 3 giocatori casuali con respondedAt
      for (let j = 1; j < 4; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
        } while (selectedPlayers.includes(player._id.toString()));

        selectedPlayers.push(player._id.toString());
        const joinDate = new Date(booking.date);
        joinDate.setHours(joinDate.getHours() - randomInt(1, 24)); // Joined prima del match
        
        matchPlayers.push({
          user: player._id,
          team: j < 2 ? "A" : "B",
          status: "confirmed",
          joinedAt: joinDate,
          respondedAt: joinDate, // ✅ Aggiunto respondedAt
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
        const joinDate = new Date(booking.date);
        joinDate.setHours(joinDate.getHours() - randomInt(1, 48));
        
        matchPlayers.push({
          user: player._id,
          team: j < 2 ? "A" : "B",
          status: "confirmed",
          joinedAt: joinDate,
          respondedAt: joinDate, // ✅ Aggiunto respondedAt
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
      const inProgressCampo: any = randomElement(campi as any[]);
      const creator: any = randomElement(players as any[]);

      // Orario: iniziato 30 minuti fa, finisce tra 30 minuti
      const startHour = currentHour - 1;
      const startTime = `${String(startHour).padStart(2, "0")}:30`;
      const endTime = `${String(currentHour + 1).padStart(2, "0")}:00`;

      const inProgressBooking = await Booking.create({
        user: creator._id,
        campo: inProgressCampo._id,
        struttura: inProgressCampo.struttura,
        date: formatDate(now),
        startTime,
        endTime,
        duration: 1.5,
        price: 40,
        status: "confirmed",
        bookingType: "public",
        paymentMode: "split",
        ownerEarnings: 40, // Owner guadagna 100% del prezzo
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

      // 💰 Aggiungi guadagno owner per booking in progress
      const bookingCampo: any = campi.find((c: any) => c._id.toString() === inProgressBooking.campo.toString());
      if (bookingCampo) {
        const bookingStruttura: any = strutture.find((s: any) => s._id.toString() === bookingCampo.struttura.toString());
        if (bookingStruttura) {
          const ownerId = bookingStruttura.owner.toString();
          const ownerEarnings = inProgressBooking.ownerEarnings || 0;

          if (!ownerEarningsMap.has(ownerId)) {
            ownerEarningsMap.set(ownerId, { total: 0, earnings: [] });
          }

          const ownerData = ownerEarningsMap.get(ownerId)!;
          ownerData.total += ownerEarnings;
          ownerData.earnings.push({
            type: "booking",
            amount: ownerEarnings,
            booking: inProgressBooking._id,
            description: `Guadagno da prenotazione ${bookingCampo.name} - ${inProgressBooking.date} ${inProgressBooking.startTime}`,
            createdAt: new Date(),
          });
        }
      }
    }

    // Aggiorna gli owner con i guadagni (inclusi booking in progress)
    for (const [ownerId, data] of ownerEarningsMap.entries()) {
      await User.findByIdAndUpdate(ownerId, {
        $set: {
          earnings: data.earnings,
          totalEarnings: data.total,
        },
      });
      console.log(`   💰 Owner ${ownerId}: €${data.total} da ${data.earnings.length} prenotazioni`);
    }

    console.log(`✅ Guadagni totali assegnati a ${ownerEarningsMap.size} owner`);

    // 4. MATCH FUTURI APERTI (open) - 5 match con stati misti
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

      // ✅ Match con mix di stati: 1 confirmed, 1 pending, 1 declined (2 slot liberi)
      const statuses = ["confirmed", "pending"];
      
      for (let j = 0; j < 2; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
        } while (selectedPlayers.includes(player._id.toString()));

        selectedPlayers.push(player._id.toString());
        const status = statuses[j];
        const joinDate = new Date();
        joinDate.setHours(joinDate.getHours() - randomInt(1, 12));
        
        matchPlayers.push({
          user: player._id,
          team: j === 0 ? "A" : "B",
          status: status,
          joinedAt: joinDate,
          respondedAt: status === "confirmed" ? joinDate : undefined, // Solo confirmed ha respondedAt
        });
      }

      // Aggiungi anche un declined player per test
      if (Math.random() > 0.5) {
        let declinedPlayer: any;
        do {
          declinedPlayer = randomElement(players as any[]);
        } while (selectedPlayers.includes(declinedPlayer._id.toString()));

        const declineDate = new Date();
        declineDate.setHours(declineDate.getHours() - randomInt(1, 6));
        
        matchPlayers.push({
          user: declinedPlayer._id,
          team: "B",
          status: "declined",
          joinedAt: declineDate,
          respondedAt: declineDate,
        });
      }

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

    // 6. MATCH PER TUTTI I BOOKING RIMANENTI (privati o aperti)
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
    console.log(`   - ${matchCounters.open} aperti`);

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

    /* -------- NOTIFICATIONS (COMPLETE) -------- */
    console.log(`\n🔔 Creazione notifiche...`);
    const notifications = [
      // Follower notifications
      {
        recipient: players[0]._id,
        sender: players[1]._id,
        type: "new_follower",
        title: "Nuovo follower",
        message: `${players[1].name} ha iniziato a seguirti.`,
        relatedId: players[1]._id,
        relatedModel: "User",
        isRead: false,
      },
      {
        recipient: players[1]._id,
        sender: players[0]._id,
        type: "follow_back",
        title: "Ti sta seguendo",
        message: `${players[0].name} ora ti segue!`,
        relatedId: players[0]._id,
        relatedModel: "User",
        isRead: true,
      },
      // Match invites
      {
        recipient: players[0]._id,
        sender: players[2]._id,
        type: "match_invite",
        title: "Invito partita",
        message: `${players[2].name} ti ha invitato a una partita.`,
        relatedId: (savedMatches as any[])[0]._id,
        relatedModel: "Match",
        isRead: false,
      },
      // Match join
      {
        recipient: players[3]._id,
        sender: players[5]._id,
        type: "match_join",
        title: "Nuovo giocatore",
        message: `${players[5].name} si è unito alla tua partita.`,
        relatedId: (savedMatches as any[])[1]._id,
        relatedModel: "Match",
        isRead: false,
      },
      // Match starting soon
      {
        recipient: players[3]._id,
        sender: owners[0]._id,
        type: "match_start",
        title: "Match in partenza",
        message: "Il tuo match inizia tra 1 ora!",
        relatedId: (savedMatches as any[])[1]._id,
        relatedModel: "Match",
        isRead: true,
      },
      // Match result
      {
        recipient: players[4]._id,
        sender: players[0]._id,
        type: "match_result",
        title: "Risultato disponibile",
        message: "Il risultato del match è stato inserito.",
        relatedId: (savedMatches as any[])[2]._id,
        relatedModel: "Match",
        isRead: false,
      },
      // New booking (owner notification)
      {
        recipient: owners[0]._id,
        sender: players[6]._id,
        type: "new_booking",
        title: "Nuova prenotazione",
        message: `${players[6].name} ha prenotato un campo.`,
        relatedId: (savedBookings as any[])[0]._id,
        relatedModel: "Booking",
        isRead: false,
      },
      {
        recipient: owners[1]._id,
        sender: players[7]._id,
        type: "new_booking",
        title: "Nuova prenotazione",
        message: `${players[7].name} ha prenotato un campo.`,
        relatedId: (savedBookings as any[])[1]._id,
        relatedModel: "Booking",
        isRead: true,
      },
    ];

    const savedNotifications = await Notification.insertMany(notifications);
    console.log(`✅ Create ${savedNotifications.length} notifiche (${notifications.filter(n => !n.isRead).length} non lette)`);

    /* -------- SUMMARY -------- */
    console.log("\n" + "=".repeat(60));
    console.log("🌱 SEED COMPLETATO CON SUCCESSO");
    console.log("=".repeat(60));
    console.log(`👥 Utenti: ${users.length} (${players.length} player, ${owners.length} owner)`);
    console.log(`🤝 Amicizie: ${friendships.length}`);
    console.log(`👁️ StrutturaFollower: ${strutturaFollowers.length}`);
    console.log(`👁️ UserFollower: ${userFollowers.length}`);
    console.log(`📱 Post Community: ${savedPosts.length}`);
    console.log(`🏟️ Strutture: ${strutture.length}`);
    console.log(`⚽ Campi: ${campi.length}`);
    console.log(`   - Beach volley: ${campi.filter((c: any) => c.sport === "beach volley").length}`);
    console.log(`   - Volley indoor: ${campi.filter((c: any) => c.sport === "volley").length}`);
    console.log(`   - Con pricing per giocatori: ${campi.filter((c: any) => c.pricingRules?.playerCountPricing?.enabled).length}`);
    console.log(`   - Con fasce orarie: ${campi.filter((c: any) => c.pricingRules?.timeSlotPricing?.enabled).length}`);
    console.log(`📅 Giorni calendario: ${calendarDocs.length}`);
    console.log(`📝 Prenotazioni: ${savedBookings.length}`);
    console.log(`   - Con split payment: ${bookings.filter(b => b.paymentMode === "split").length}`);
    console.log(`🏆 Match: ${matches.length}`);
    console.log(`   - Completati con risultato: ${matchCounters.completed}`);
    console.log(`   - Completati senza risultato: ${matchCounters.noResult}`);
    console.log(`   - Aperti (con inviti): ${matchCounters.open}`);
    console.log(`   - Completi: ${matchCounters.full}`);
    console.log(`   - Aperti: ${matchCounters.open}`);
    console.log(`🎉 Eventi: ${events.length}`);
    console.log(`🎊 Community Events: ${communityEvents.length}`);
    console.log(`🔔 Notifiche: ${savedNotifications.length}`);
    console.log(`💬 Conversazioni: ${savedConversations.length}`);
    console.log(`📨 Messaggi: ${savedMessages.length}`);
    console.log("=".repeat(60));
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
    console.log("\n🎯 TEST SCENARIOS:");
    console.log(`   - Privacy profiles: 4 utenti privati (Luca, Anna, Sofia, Chiara)`);
    console.log(`   - Split payment: ${strutture.filter((s: any) => s.isCostSplittingEnabled).length} strutture abilitate`);
    console.log(`   - Advanced pricing: fasce orarie weekend/feriali, eventi speciali`);
    console.log(`   - Match states: pending invites, declined, confirmed, mix`);
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Errore seed:", err);
    process.exit(1);
  }
}

seed();
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

// ✅ CONFIGURAZIONE QUANTITÀ DATI (ALTA MOLE)
const NUM_PLAYERS = 500; // Aumentato per più dati
const NUM_OWNERS = 50; // Aumentato per più strutture
const NUM_STRUTTURE = 100; // Aumentato per varietà
const NUM_USER_POSTS = 500; // Molti più post utenti
const NUM_STRUTTURA_POSTS = 200; // Molti più post strutture
const NUM_BOOKINGS_PAST = 1000; // Storico prenotazioni ricco
const NUM_BOOKINGS_FUTURE = 500; // Prenotazioni future
const NUM_EVENTS = 50; // Eventi disponibili
const NUM_COMMUNITY_EVENTS = 100; // Eventi community

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

/* =========================
   GENERATORI DATI RANDOM
========================= */

// Nomi italiani comuni (senza accenti e spazi)
const ITALIAN_FIRST_NAMES = [
  "Mario", "Giulia", "Luca", "Anna", "Marco", "Sofia", "Alessandro", "Chiara",
  "Matteo", "Elena", "Davide", "Francesca", "Simone", "Valentina", "Andrea",
  "Martina", "Lorenzo", "Alessia", "Gabriele", "Beatrice", "Giuseppe", "Sara",
  "Francesco", "Federica", "Antonio", "Laura", "Nicola", "Silvia", "Giovanni",
  "Eleonora", "Roberto", "Giorgia", "Emanuele", "Camilla", "Stefano", "Alice",
  "Fabio", "Veronica", "Pietro", "Ilaria", "Riccardo", "Claudia", "Daniele",
  "Michela", "Paolo", "Serena", "Federico", "Cristina", "Michele", "Roberta",
  "Salvatore", "Paola", "Vincenzo", "Elisa", "Diego", "Arianna", "Filippo",
  "Valeria", "Giacomo", "Monica", "Alessio", "Sabrina", "Alberto", "Caterina",
  "Claudio", "Angela", "Enrico", "Daniela", "Gianluca", "Barbara", "Massimo",
  "Teresa", "Leonardo", "Simona", "Antonella", "Thomas", "Irene",
  "Samuele", "Manuela", "Christian", "Rossella", "Edoardo", "Patrizia",
  "Raffaele", "Giovanna", "Manuel", "Emanuela", "Mirko", "Cinzia", "Angelo",
  "Marianna", "Giorgio", "Stefania", "Carlo", "Nicoletta", "Ivan", "Luisa",
  "Dario", "Greta", "Tommaso", "Giada", "Mauro", "Denise", "Mirco", "Katia",
  "Sergio", "Nadia", "Cristian", "Pamela", "Omar", "Tania", "Samuel", "Noemi",
  "Fabiano", "Gioia", "Tiziano", "Debora", "Valerio", "Ivana", "Mauro", "Rita",
  "Denis", "Ornella", "Oscar", "Mara", "Elia", "Loredana", "Giulio", "Carla",
  "Bruno", "Gina", "Dino", "Flora", "Renzo", "Lidia", "Sandro", "Rosa",
  "Guido", "Vera", "Rino", "Ada", "Aldo", "Olga", "Ugo", "Lina"
];

const ITALIAN_LAST_NAMES = [
  "Rossi", "Ferrari", "Russo", "Bianchi", "Romano", "Gallo", "Conti", "Bruno",
  "Ricci", "Marino", "Greco", "Lombardi", "Costa", "Fontana", "Serra", "Mancini",
  "Villa", "Caruso", "DeLuca", "Esposito", "Colombo", "Barbieri", "Martini", "Moretti",
  "Santoro", "DeRosa", "Vitale", "Leone", "Marchetti", "Ferri", "Galli",
  "Rinaldi", "Benedetti", "Caputo", "Giordano", "Palumbo", "Pellegrini", "Bianco",
  "Messina", "Rossetti", "Parisi", "DAngelo", "Rizzi", "Sala", "Silvestri",
  "Fabbri", "Mariani", "Milani", "Testa", "Longo", "Pellegrino", "Donati",
  "Cattaneo", "Carbone", "Morelli", "Costantini", "Guerra", "Ferraro", "Orlando",
  "Montanari", "Bernardi", "Bellini", "Marchi", "Martino", "Valentini", "Ferretti",
  "Rossini", "Sanna", "Monti", "Piras", "Battaglia", "Pagano", "Negri", "Grasso",
  "Farina", "Cattani", "Bassi", "Biagi", "Neri", "Sartori", "Riva",
  "Gentile", "Gatti", "DeSantis", "Martinelli", "Lombardo", "Santini", "Fiore",
  "Lazzari", "Ferrero", "Sorrentino", "Ruggiero", "Conte", "Damico", "Barone",
  "Ragusa", "Moreno", "Ferreira", "Giuliani", "DeAngelis", "Rizzo", "Bertini",
  "Fiorentino", "Ruggeri", "Grassi", "Mazza", "Cipriani", "Cavalli", "Pirlo",
  "Grimaldi", "Amore", "Napoli", "Orsini", "Berti", "Lupo", "Volpe", "Amato"
];

const CITIES = [
  "Milano", "Roma", "Torino", "Bologna", "Firenze", "Napoli", "Venezia", "Verona",
  "Genova", "Palermo", "Catania", "Bari", "Cagliari", "Padova", "Brescia", "Rimini",
  "Parma", "Modena", "Reggio Emilia", "Trieste", "Piacenza", "Perugia", "Ancona",
  "Como", "Lecce", "Bergamo", "Salerno", "Ravenna", "Ferrara", "Pescara"
];

// Vie reali per ogni città italiana
const CITY_STREETS: { [city: string]: string[] } = {
  Milano: ["Via Dante", "Corso Buenos Aires", "Via Montenapoleone", "Corso Vittorio Emanuele II", "Via Torino", "Viale Monza", "Corso Sempione", "Via Paolo Sarpi"],
  Roma: ["Via del Corso", "Via Nazionale", "Via dei Fori Imperiali", "Viale Trastevere", "Via Appia Nuova", "Via Tuscolana", "Corso Vittorio Emanuele II", "Via Veneto"],
  Torino: ["Via Roma", "Corso Francia", "Corso Vittorio Emanuele II", "Via Po", "Corso Giulio Cesare", "Via Nizza", "Corso Vinzaglio", "Via Garibaldi"],
  Bologna: ["Via Indipendenza", "Via Rizzoli", "Via Ugo Bassi", "Viale Masini", "Via San Felice", "Via Marconi", "Strada Maggiore", "Via Zamboni"],
  Firenze: ["Via Roma", "Via dei Calzaiuoli", "Borgo Ognissanti", "Via Tornabuoni", "Lungarno Vespucci", "Viale Belfiore", "Via del Corso", "Piazza della Repubblica"],
  Napoli: ["Via Toledo", "Corso Umberto I", "Via Caracciolo", "Via Chiaia", "Via dei Tribunali", "Corso Vittorio Emanuele", "Via Partenope", "Via Santa Lucia"],
  Venezia: ["Strada Nova", "Lista di Spagna", "Calle Larga", "Fondamenta delle Zattere", "Riva degli Schiavoni", "Calle Lunga San Barnaba", "Rio Terra San Leonardo", "Salizada San Lio"],
  Verona: ["Via Mazzini", "Corso Porta Nuova", "Via Roma", "Corso Porta Borsari", "Via Cappello", "Lungadige Rubele", "Via Leoncino", "Corso Cavour"],
  Genova: ["Via XX Settembre", "Via Balbi", "Via Garibaldi", "Corso Italia", "Via San Lorenzo", "Corso Buenos Aires", "Via Roma", "Corso Aurelio Saffi"],
  Palermo: ["Via Maqueda", "Via Roma", "Corso Vittorio Emanuele", "Via Liberta", "Via Ruggero Settimo", "Via Notarbartolo", "Corso Calatafimi", "Via Strasburgo"],
  Catania: ["Via Etnea", "Corso Italia", "Via Umberto", "Via Vittorio Emanuele II", "Via Pacini", "Viale Regina Margherita", "Via Plebiscito", "Corso Sicilia"],
  Bari: ["Corso Vittorio Emanuele II", "Via Sparano", "Lungomare Nazario Sauro", "Via Argiro", "Corso Cavour", "Via Melo", "Via Putignani", "Via Dante Alighieri"],
  Cagliari: ["Via Roma", "Largo Carlo Felice", "Viale Regina Margherita", "Via Garibaldi", "Corso Vittorio Emanuele II", "Via Manno", "Viale Trieste", "Via San Benedetto"],
  Padova: ["Via Roma", "Corso del Popolo", "Via San Francesco", "Via Zabarella", "Via Dante", "Corso Milano", "Via Cavour", "Riviera Tito Livio"],
  Brescia: ["Corso Zanardelli", "Via dei Musei", "Corso Palestro", "Via Vittorio Emanuele II", "Corso Giuseppe Garibaldi", "Viale Venezia", "Via Trieste", "Via XX Settembre"],
  Rimini: ["Viale Vespucci", "Corso d'Augusto", "Via Garibaldi", "Viale Regina Elena", "Via Roma", "Viale Principe Amedeo", "Piazzale Kennedy", "Via Tempio Malatestiano"],
};

const GENERIC_STREETS = ["Via Garibaldi", "Viale Roma", "Corso Vittorio Emanuele", "Via Mazzini", "Piazza Dante", "Via Verdi", "Corso Italia"];

// Genera nome italiano casuale
function generateRandomName(): string {
  return randomElement(ITALIAN_FIRST_NAMES);
}

// Genera cognome italiano casuale
function generateRandomSurname(): string {
  return randomElement(ITALIAN_LAST_NAMES);
}

// Genera email basata su nome e cognome (sempre @test.it)
function generateEmail(name: string, surname: string, index?: number): string {
  // Rimuovi apostrofi, spazi e caratteri speciali
  const nameClean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const surnameClean = surname.toLowerCase().replace(/[^a-z0-9]/g, "");
  const suffix = index !== undefined ? index : "";
  return `${nameClean}${suffix}@test.it`;
}

// Genera username casuale (max 20 caratteri, solo alfanumerici e underscore)
function generateUsername(name: string, surname: string, index?: number): string {
  // Rimuovi apostrofi, spazi e caratteri speciali
  const nameClean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const surnameClean = surname.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  const patterns = [
    `${nameClean}_${surnameClean}`,
    `${nameClean}${randomInt(10, 99)}`,
    `${surnameClean}_${nameClean.charAt(0)}`,
    `${nameClean.substring(0, 4)}_${surnameClean.substring(0, 4)}`,
    `${nameClean.substring(0, 6)}${randomInt(1, 999)}`,
  ];
  
  let base = randomElement(patterns);
  if (index !== undefined && base.length < 15) {
    base = `${base}${index}`;
  }
  
  // Assicura che non superi i 20 caratteri
  if (base.length > 20) {
    base = base.substring(0, 20);
  }
  
  return base;
}

// Genera indirizzo casuale con vie reali
function generateAddress(): { address: string; city: string; lat: number; lng: number } {
  const city = randomElement(CITIES);
  const cityCoords: { [key: string]: { lat: number; lng: number } } = {
    Milano: { lat: 45.4642, lng: 9.1900 },
    Roma: { lat: 41.9028, lng: 12.4964 },
    Torino: { lat: 45.0703, lng: 7.6869 },
    Bologna: { lat: 44.4949, lng: 11.3426 },
    Firenze: { lat: 43.7696, lng: 11.2558 },
    Napoli: { lat: 40.8518, lng: 14.2681 },
    Venezia: { lat: 45.4408, lng: 12.3155 },
    Verona: { lat: 45.4384, lng: 10.9916 },
    Genova: { lat: 44.4056, lng: 8.9463 },
    Palermo: { lat: 38.1157, lng: 13.3615 },
    Catania: { lat: 37.5079, lng: 15.0830 },
    Bari: { lat: 41.1171, lng: 16.8719 },
    Cagliari: { lat: 39.2238, lng: 9.1217 },
    Padova: { lat: 45.4064, lng: 11.8768 },
    Brescia: { lat: 45.5416, lng: 10.2118 },
    Rimini: { lat: 44.0678, lng: 12.5695 },
    Parma: { lat: 44.8015, lng: 10.3279 },
    Modena: { lat: 44.6471, lng: 10.9252 },
    "Reggio Emilia": { lat: 44.6989, lng: 10.6297 },
    Trieste: { lat: 45.6495, lng: 13.7768 },
    Piacenza: { lat: 45.0526, lng: 9.6929 },
    Perugia: { lat: 43.1107, lng: 12.3908 },
    Ancona: { lat: 43.6158, lng: 13.5189 },
    Como: { lat: 45.8080, lng: 9.0852 },
    Lecce: { lat: 40.3515, lng: 18.1750 },
    Bergamo: { lat: 45.6983, lng: 9.6773 },
    Salerno: { lat: 40.6824, lng: 14.7681 },
    Ravenna: { lat: 44.4184, lng: 12.2035 },
    Ferrara: { lat: 44.8381, lng: 11.6198 },
    Pescara: { lat: 42.4618, lng: 14.2169 },
  };

  const coords = cityCoords[city] || { lat: 45.0 + Math.random() * 5, lng: 9.0 + Math.random() * 5 };
  const lat = coords.lat + (Math.random() - 0.5) * 0.02;
  const lng = coords.lng + (Math.random() - 0.5) * 0.02;

  // Usa vie reali della città se disponibili, altrimenti vie generiche
  const streets = CITY_STREETS[city] || GENERIC_STREETS;
  const street = randomElement(streets);
  const number = randomInt(1, 200);

  return {
    address: `${street}, ${number}`,
    city,
    lat,
    lng,
  };
}

// Genera descrizione struttura
function generateStrutturaDescription(): string {
  const templates = [
    "Centro sportivo moderno con campi professionali e servizi completi",
    "Struttura all'avanguardia per gli amanti del beach volley",
    "Campi beach volley di alta qualità con illuminazione notturna",
    "Arena sportiva con servizi premium e area relax",
    "Centro polisportivo con campi regolamentari e area bar",
    "Struttura coperta e scoperta per giocare tutto l'anno",
    "Beach volley club con sabbia finissima importata",
    "Complesso sportivo con vista panoramica",
    "Centro beach volley con spazi eventi e tornei",
    "Arena moderna dotata di tutti i comfort",
  ];
  return randomElement(templates);
}

// Genera nome struttura
function generateStrutturaName(city: string, index: number): string {
  const prefixes = ["Beach", "Volley", "Arena", "Sport", "Centro"];
  const suffixes = ["Club", "Center", "Park", "Arena", "Village", "Beach", "Volley"];
  const types = ["Beach Volley", "Sport", "Arena", "Experience", "Court"];

  const patterns = [
    `${randomElement(prefixes)} ${randomElement(types)} ${city}`,
    `${city} ${randomElement(suffixes)}`,
    `${randomElement(prefixes)} ${city} ${randomElement(suffixes)}`,
    `${city} ${randomElement(types)} ${index}`,
  ];

  return randomElement(patterns);
}

// Genera contenuto post casuale
function generatePostContent(isStruttura: boolean = false): string {
  const userPosts = [
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
    "Match incredibile questa mattina!",
    "Cercasi compagni di squadra per torneo",
    "Primo posto nel torneo! 🏆",
    "Allenamento intenso oggi",
    "Chi gioca domani pomeriggio?",
    "Bella vittoria con la squadra! 💪",
    "Serve un quarto giocatore per stasera",
    "Splendida giornata in spiaggia",
    "Qualcuno ha esperienza come schiacciatore?",
    "Torneo amatoriale questo weekend!",
  ];

  const strutturaPosts = [
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
    "Promozione estate: prenota ora!",
    "Aperte le iscrizioni al torneo mensile",
    "Nuovi servizi disponibili!",
    "Campo rinnovato e pronto all'uso",
    "Serata a tema questo venerdì!",
    "Inaugurazione nuovo campo beach!",
    "Clinic gratuito con professionisti",
    "Offerta famiglia: sconti fino al 30%",
    "Riapertura dopo manutenzione straordinaria",
    "Evento charity: iscriviti e sostieni!",
  ];

  return isStruttura ? randomElement(strutturaPosts) : randomElement(userPosts);
}

// Genera commento casuale
function generateComment(): string {
  const comments = [
    "Grande!", "Ci sono!", "Quando?", "Ottima idea!", "Conta su di me",
    "Sono d'accordo", "Bellissimo!", "Perfetto!", "Interessante",
    "Come posso prenotare?", "Fantastico!", "Ottimo!", "Ci sarò!",
    "Grazie per l'info", "Quando inizia?", "Bravi!", "Complimenti!",
    "Super!", "Wow!", "Mitico!", "Top!", "👍", "🔥", "💪", "⚡"
  ];
  return randomElement(comments);
}

// Genera nome evento
function generateEventName(): string {
  const types = ["Torneo", "Campionato", "Lega", "Amichevole", "Open Day", "Clinic"];
  const adjectives = ["Estivo", "Invernale", "Primaverile", "Amatoriale", "Pro", "Open"];
  const sports = ["Beach Volley", "Volley", "Beach"];
  
  return `${randomElement(types)} ${randomElement(adjectives)} ${randomElement(sports)}`;
}

// Genera descrizione evento
function generateEventDescription(): string {
  const templates = [
    "Torneo amatoriale aperto a tutti i livelli con premi finali",
    "Campionato a squadre per giocatori intermedi e avanzati",
    "Partita amichevole per socializzare e divertirsi",
    "Evento open con iscrizione gratuita",
    "Clinic tecnico con allenatori professionisti",
    "Torneo benefico: partecipa e sostieni la causa",
    "Lega settimanale con classifica finale",
    "Open day: prova i nostri campi gratuitamente",
    "Evento speciale con DJ set e beach party",
    "Allenamento intensivo per migliorare la tecnica",
  ];
  return randomElement(templates);
}

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

    console.log(`\n👥 Generazione ${NUM_PLAYERS} player e ${NUM_OWNERS} owner...`);
    
    const usersData: any[] = [];
    const usedEmails = new Set<string>();
    const usedUsernames = new Set<string>();

    // Genera PLAYERS
    for (let i = 0; i < NUM_PLAYERS; i++) {
      const firstName = generateRandomName();
      const lastName = generateRandomSurname();
      let email = generateEmail(firstName, lastName, i);
      let username = generateUsername(firstName, lastName, i);

      // Assicura unicità email e username
      while (usedEmails.has(email)) {
        email = generateEmail(firstName, lastName, randomInt(100, 9999));
      }
      while (usedUsernames.has(username)) {
        username = generateUsername(firstName, lastName, randomInt(100, 9999));
      }

      usedEmails.add(email);
      usedUsernames.add(username);

      usersData.push({
        name: firstName,
        surname: lastName,
        email,
        username,
        role: "player",
      });
    }

    // Genera OWNERS
    for (let i = 0; i < NUM_OWNERS; i++) {
      const firstName = generateRandomName();
      const lastName = generateRandomSurname();
      let email = generateEmail(firstName, lastName, NUM_PLAYERS + i);
      let username = generateUsername(firstName, lastName, NUM_PLAYERS + i);

      while (usedEmails.has(email)) {
        email = generateEmail(firstName, lastName, randomInt(10000, 99999));
      }
      while (usedUsernames.has(username)) {
        username = generateUsername(firstName, lastName, randomInt(10000, 99999));
      }

      usedEmails.add(email);
      usedUsernames.add(username);

      usersData.push({
        name: firstName,
        surname: lastName,
        email,
        username,
        role: "owner",
      });
    }

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

        // ~10% profili privati
        profilePrivacy: u.role === "player" && Math.random() < 0.1 ? "private" : "public",
      }))
    );

    const players = users.filter((u: any) => u.role === "player");
    const owners = users.filter((u: any) => u.role === "owner");

    console.log(`✅ Creati ${users.length} utenti (${players.length} player, ${owners.length} owner)`);
    console.log(`   - Profili privati: ${players.filter((p: any) => p.profilePrivacy === "private").length}`);
    console.log(`   - Primi 5 player: ${players.slice(0, 5).map((p: any) => p.email).join(", ")}`);
    console.log(`   - Primi 3 owner: ${owners.slice(0, 3).map((o: any) => o.email).join(", ")}`);

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
    await UserPreferences.insertMany(
      players.map((p: any) => ({
        user: p._id,
        pushNotifications: Math.random() > 0.3,
        darkMode: Math.random() > 0.5,
        privacyLevel: randomElement(["public", "friends", "private"]),
        preferredLocation: {
          city: randomElement(CITIES),
          lat: 45.4642 + Math.random() * 2,
          lng: 9.19 + Math.random() * 2,
          radius: randomInt(20, 50),
        },
        favoriteStrutture: [],
        favoriteSports: [randomElement(["Beach Volley", "Volley"])],
        preferredTimeSlot: randomElement(["morning", "afternoon", "evening"]),
      }))
    );

    console.log(`✅ Create ${players.length} user preferences`);

    /* -------- FRIENDSHIPS -------- */
    console.log(`\n🤝 Generazione amicizie...`);
    const friendships: any[] = [];
    const friendshipKeys = new Set<string>();

    // Helper per evitare duplicati
    const makeFriendshipKey = (user1: string, user2: string) => {
      const sorted = [user1, user2].sort();
      return `${sorted[0]}-${sorted[1]}`;
    };

    // Ogni player ha 5-15 amicizie casuali
    for (let i = 0; i < players.length; i++) {
      const player = players[i] as any;
      const numFriendships = randomInt(5, 15);

      for (let j = 0; j < numFriendships; j++) {
        const friend: any = randomElement(players as any[]);
        
        // Non creare amicizia con se stesso
        if (friend._id.toString() === player._id.toString()) continue;

        const key = makeFriendshipKey(player._id.toString(), friend._id.toString());
        if (friendshipKeys.has(key)) continue;

        friendshipKeys.add(key);

        const status = Math.random() > 0.2 ? "accepted" : "pending";
        const createdDate = new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000);

        friendships.push({
          requester: player._id,
          recipient: friend._id,
          status,
          createdAt: createdDate,
          acceptedAt: status === "accepted" ? createdDate : undefined,
        });

        // Se accepted, crea anche la relazione inversa (follow reciproco)
        if (status === "accepted" && Math.random() > 0.3) {
          friendships.push({
            requester: friend._id,
            recipient: player._id,
            status: "accepted",
            createdAt: createdDate,
            acceptedAt: createdDate,
          });
        }
      }
    }

    await Friendship.insertMany(friendships);
    console.log(`✅ Create ${friendships.length} amicizie`);
    console.log(`   - Accepted: ${friendships.filter(f => f.status === "accepted").length}`);
    console.log(`   - Pending: ${friendships.filter(f => f.status === "pending").length}`);

    /* -------- STRUTTURE -------- */
    console.log(`\n🏟️ Generazione ${NUM_STRUTTURE} strutture...`);
    const struttureData: any[] = [];

    for (let i = 0; i < NUM_STRUTTURE; i++) {
      const location = generateAddress();
      const owner: any = randomElement(owners as any[]);
      const amenities: string[] = [];

      // Genera amenities casuali
      const possibleAmenities = ["toilets", "lockerRoom", "showers", "parking", "bar", "restaurant"];
      const numAmenities = randomInt(2, possibleAmenities.length);
      for (let j = 0; j < numAmenities; j++) {
        const amenity = possibleAmenities[j];
        if (!amenities.includes(amenity)) amenities.push(amenity);
      }

      struttureData.push({
        name: generateStrutturaName(location.city, i + 1),
        description: generateStrutturaDescription(),
        owner: owner._id,
        city: location.city,
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        amenities,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)), // 3.5 - 5.0
        count: randomInt(10, 100),
        isFeatured: Math.random() > 0.7, // 30% featured
      });
    }

    const strutture = await Struttura.insertMany(
      struttureData.map((s, idx) => {
        // Assegna randomicamente 2-4 immagini a ogni struttura
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
            address: s.address,
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
          // ~20% strutture con split dei costi abilitato
          isCostSplittingEnabled: Math.random() > 0.8,
        };
      })
    );

    console.log(`✅ Create ${strutture.length} strutture`);
    console.log(`   - Featured: ${strutture.filter((s: any) => s.isFeatured).length}`);
    console.log(`   - Con split costi: ${strutture.filter((s: any) => s.isCostSplittingEnabled).length}`);
    if (strutturaImageUrls.length > 0) {
      const totImagesAssigned = strutture.reduce((acc: number, s: any) => acc + s.images.length, 0);
      console.log(`   - Immagini assegnate: ${totImagesAssigned}`);
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
    console.log(`\n🚀 Creazione Post (${NUM_USER_POSTS} utenti + ${NUM_STRUTTURA_POSTS} strutture)...`);
    const posts: any[] = [];

    // POST UTENTI
    console.log(`📝 Generazione ${NUM_USER_POSTS} post utenti...`);
    for (let i = 0; i < NUM_USER_POSTS; i++) {
      if (i % 20 === 0) console.log(`   - Post utente ${i}/${NUM_USER_POSTS}...`);

      const author = randomElement(players as any[]);
      const content = generatePostContent(false);
      const likesCount = randomInt(0, 30);
      const likesUsers = new Set<string>();

      while (likesUsers.size < likesCount && likesUsers.size < players.length) {
        const randomPlayer = randomElement(players as any[]);
        likesUsers.add(randomPlayer._id.toString());
      }

      const commentsCount = randomInt(0, 10);
      const comments: any[] = [];

      for (let c = 0; c < commentsCount; c++) {
        const commenter = randomElement(players as any[]);
        comments.push({
          _id: new mongoose.Types.ObjectId(),
          user: commenter._id,
          text: generateComment(),
          createdAt: new Date(Date.now() - randomInt(1, 20) * 60 * 60 * 1000),
        });
      }

      posts.push({
        user: author._id,
        content,
        likes: Array.from(likesUsers),
        comments,
        isStrutturaPost: false,
        createdAt: new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000),
      });
    }

    // POST STRUTTURE
    console.log(`📝 Generazione ${NUM_STRUTTURA_POSTS} post strutture...`);
    for (let i = 0; i < NUM_STRUTTURA_POSTS; i++) {
      if (i % 10 === 0) console.log(`   - Post struttura ${i}/${NUM_STRUTTURA_POSTS}...`);

      const struttura = randomElement(strutture as any[]);
      const content = generatePostContent(true);
      const likesCount = randomInt(5, 40);
      const likesUsers = new Set<string>();

      while (likesUsers.size < likesCount && likesUsers.size < players.length) {
        const randomPlayer = randomElement(players as any[]);
        likesUsers.add(randomPlayer._id.toString());
      }

      const commentsCount = randomInt(0, 15);
      const comments: any[] = [];

      for (let c = 0; c < commentsCount; c++) {
        const commenter = randomElement(players as any[]);
        const isStrutturaComment = Math.random() > 0.7;

        comments.push({
          _id: new mongoose.Types.ObjectId(),
          user: commenter._id,
          struttura: isStrutturaComment ? struttura._id : undefined,
          text: generateComment(),
          createdAt: new Date(Date.now() - randomInt(1, 30) * 60 * 60 * 1000),
        });
      }

      posts.push({
        user: struttura.owner,
        content,
        struttura: struttura._id,
        isStrutturaPost: true,
        likes: Array.from(likesUsers),
        comments,
        createdAt: new Date(Date.now() - randomInt(1, 45) * 24 * 60 * 60 * 1000),
      });
    }

    console.log(`💾 Inserimento ${posts.length} post nel database...`);
    const savedPosts = await Post.insertMany(posts);
    console.log(`✅ Creati ${savedPosts.length} post (${posts.filter(p => !p.isStrutturaPost).length} utenti, ${posts.filter(p => p.isStrutturaPost).length} strutture)`);

    /* -------- EVENTS (RIMOSSI) -------- */
    // Eventi e Community Events rimossi su richiesta utente
    console.log(`\nℹ️ Eventi e Community Events non generati (rimossi su richiesta)`);

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

          // ✅ Abilita playerCountPricing per TUTTI i campi beach volley (2v2, 3v3, 4v4)
          const enablePlayerPricing = isBeach;
          const playerPrices = enablePlayerPricing
            ? [
                {
                  count: 4,
                  label: "4 giocatori (2v2)",
                  prices: {
                    oneHour: Math.max(8, Math.round(pricePerHour / 4)),
                    oneHourHalf: Math.max(11, Math.round((pricePerHour * 1.4) / 4)),
                  },
                },
                {
                  count: 6,
                  label: "6 giocatori (3v3)",
                  prices: {
                    oneHour: Math.max(6, Math.round(pricePerHour / 6)),
                    oneHourHalf: Math.max(8, Math.round((pricePerHour * 1.4) / 6)),
                  },
                },
                {
                  count: 8,
                  label: "8 giocatori (4v4)",
                  prices: {
                    oneHour: Math.max(5, Math.round(pricePerHour / 8)),
                    oneHourHalf: Math.max(7, Math.round((pricePerHour * 1.4) / 8)),
                  },
                },
              ]
            : [];

          // Beach volley: 8 giocatori (4v4), Volley indoor: 10 giocatori (5v5)
          const campoMaxPlayers = isBeach ? 8 : 10;

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

    /* -------- BOOKINGS -------- */
    console.log(`\n📝 Generazione prenotazioni (${NUM_BOOKINGS_PAST} passate + ${NUM_BOOKINGS_FUTURE} future)...`);
    const bookings: any[] = [];
    const today = new Date();

    // Prenotazioni passate
    console.log(`   - Generazione ${NUM_BOOKINGS_PAST} prenotazioni passate...`);
    for (let i = 0; i < NUM_BOOKINGS_PAST; i++) {
      if (i % 50 === 0) console.log(`     ${i}/${NUM_BOOKINGS_PAST}...`);

      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - randomInt(1, 90));

      const campo: any = randomElement(campi as any[]);
      const player: any = randomElement(players as any[]);
      const hour = randomInt(9, 20);
      const duration = randomElement([1, 1.5]);
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = duration === 1 ? hour + 1 : hour + 1;
      const endMinutes = duration === 1.5 ? "30" : "00";
      const endTime = `${String(endHour).padStart(2, "0")}:${endMinutes}`;

      // ✅ Verifica se la struttura ha split payment abilitato
      const struttura: any = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
      const canBePublic = struttura && struttura.isCostSplittingEnabled;
      
      const bookingType = canBePublic && Math.random() > 0.3 ? "public" : "private";
      const paymentMode = bookingType === "public" ? "split" : "full";
      const totalPrice = randomInt(30, 70);
      // Mix di 2v2, 3v3, 4v4 per partite beach
      const numPeople = bookingType === "public" && campo.sport === "beach volley" ? randomElement([4, 6, 8]) : undefined;
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
        ownerEarnings: totalPrice,
      });
    }

    // Prenotazioni future
    console.log(`   - Generazione ${NUM_BOOKINGS_FUTURE} prenotazioni future...`);
    for (let i = 0; i < NUM_BOOKINGS_FUTURE; i++) {
      if (i % 25 === 0) console.log(`     ${i}/${NUM_BOOKINGS_FUTURE}...`);

      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + randomInt(0, 30));

      const campo: any = randomElement(campi as any[]);
      const player: any = randomElement(players as any[]);
      const hour = randomInt(9, 20);
      const duration = randomElement([1, 1.5]);
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endHour = duration === 1 ? hour + 1 : hour + 1;
      const endMinutes = duration === 1.5 ? "30" : "00";
      const endTime = `${String(endHour).padStart(2, "0")}:${endMinutes}`;

      // ✅ Verifica se la struttura ha split payment abilitato
      const struttura: any = strutture.find((s: any) => s._id.toString() === campo.struttura.toString());
      const canBePublic = struttura && struttura.isCostSplittingEnabled;
      
      const bookingType = canBePublic && Math.random() > 0.3 ? "public" : "private";
      const paymentMode = bookingType === "public" ? "split" : "full";
      const totalPrice = randomInt(30, 70);
      // Mix di 2v2, 3v3, 4v4 per partite beach
      const numPeople = bookingType === "public" && campo.sport === "beach volley" ? randomElement([4, 6, 8]) : undefined;
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
        ownerEarnings: totalPrice,
      });
    }

    console.log(`💾 Inserimento ${bookings.length} prenotazioni nel database...`);
    const savedBookings = await Booking.insertMany(bookings);
    console.log(`✅ Create ${savedBookings.length} prenotazioni`);
    console.log(`   - Con split payment: ${bookings.filter(b => b.paymentMode === "split").length}`);
    console.log(`   - Pubbliche: ${bookings.filter(b => b.bookingType === "public").length}`);
    console.log(`   - Private: ${bookings.filter(b => b.bookingType === "private").length}`);

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
    const matchCounters = { completed: 0, noResult: 0, inProgress: 0, open: 0, full: 0, draft: 0 };
    const processedBookings = new Set<string>(); // Track tutti i booking processati

    // 1. MATCH PASSATI COMPLETATI (con risultato) - 15 match con mix di partecipanti
    for (let i = 0; i < Math.min(15, pastBookings.length); i++) {
      const booking = pastBookings[i];
      processedBookings.add(booking._id.toString()); // Traccia subito
      const creator = booking.user;
      const campo: any = campi.find((c: any) => c._id.toString() === booking.campo.toString());
      
      // ✅ Verifica se la struttura ha split payment abilitato
      const struttura: any = strutture.find((s: any) => s._id.toString() === booking.struttura.toString());
      const canBePublic = struttura && struttura.isCostSplittingEnabled && booking.bookingType === "public";
      
      // Mix di partecipanti: 4, 6, 8 giocatori (2v2, 3v3, 4v4 per beach)
      const maxPlayers = randomElement([4, 6, 8]);
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

      // Altri giocatori casuali con respondedAt - alternando tra team A e B
      for (let j = 1; j < maxPlayers; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
        } while (selectedPlayers.includes(player._id.toString()));

        selectedPlayers.push(player._id.toString());
        const joinDate = new Date(booking.date);
        joinDate.setHours(joinDate.getHours() - randomInt(1, 24)); // Joined prima del match
        
        // Alterna tra team A e B: indici dispari -> A, pari -> B
        const team = (j % 2 === 1) ? "B" : "A";
        
        matchPlayers.push({
          user: player._id,
          team: team,
          status: "confirmed",
          joinedAt: joinDate,
          respondedAt: joinDate,
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
        maxPlayers: maxPlayers,
        isPublic: canBePublic,
        score: { sets },
        winner: winsA > winsB ? "A" : "B",
        playedAt: new Date(booking.date),
        status: "completed",
      });
      matchCounters.completed++;
    }

    // 2. MATCH PASSATI SENZA RISULTATO - 10 match (per testare inserimento risultato)
    for (let i = 15; i < Math.min(25, pastBookings.length); i++) {
      const booking = pastBookings[i];
      processedBookings.add(booking._id.toString()); // Traccia subito
      const creator = booking.user;
      
      // ✅ Verifica se la struttura ha split payment abilitato
      const struttura: any = strutture.find((s: any) => s._id.toString() === booking.struttura.toString());
      const canBePublic = struttura && struttura.isCostSplittingEnabled && booking.bookingType === "public";
      
      // Mix di partecipanti (2v2, 3v3, 4v4 per beach)
      const maxPlayers = randomElement([4, 6, 8]);
      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator.toString()];

      matchPlayers.push({
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(booking.date),
        respondedAt: new Date(booking.date),
      });

      for (let j = 1; j < maxPlayers; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
        } while (selectedPlayers.includes(player._id.toString()));

        selectedPlayers.push(player._id.toString());
        const joinDate = new Date(booking.date);
        joinDate.setHours(joinDate.getHours() - randomInt(1, 48));
        
        // Alterna tra team A e B: indici dispari -> B, pari -> A
        const team = (j % 2 === 1) ? "B" : "A";
        
        matchPlayers.push({
          user: player._id,
          team: team,
          status: "confirmed",
          joinedAt: joinDate,
          respondedAt: joinDate,
        });
      }

      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: matchPlayers,
        maxPlayers: maxPlayers,
        isPublic: canBePublic,
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
      const maxPlayers = randomElement([4, 6, 8]);

      // ✅ Verifica se la struttura ha split payment abilitato
      const struttura: any = strutture.find((s: any) => s._id.toString() === inProgressCampo.struttura.toString());
      const canBePublic = struttura && struttura.isCostSplittingEnabled;

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
        numberOfPeople: maxPlayers,
        status: "confirmed",
        bookingType: canBePublic ? "public" : "private",
        paymentMode: canBePublic ? "split" : "full",
        ownerEarnings: 40,
      });
      
      processedBookings.add(inProgressBooking._id.toString()); // Traccia il booking appena creato

      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator._id.toString()];

      matchPlayers.push({
        user: creator._id,
        team: "A",
        status: "confirmed",
        joinedAt: now,
        respondedAt: now,
      });

      for (let j = 1; j < maxPlayers; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
        } while (selectedPlayers.includes(player._id.toString()));

        selectedPlayers.push(player._id.toString());
        matchPlayers.push({
          user: player._id,
          team: j < (maxPlayers / 2) ? "A" : "B",
          status: "confirmed",
          joinedAt: now,
          respondedAt: now,
        });
      }

      // Verifica che il creator sia nel team A
      const creatorInTeamA = matchPlayers.find(p => p.user.toString() === creator._id.toString());
      if (!creatorInTeamA || creatorInTeamA.team !== "A") {
        console.warn(`⚠️ Match in progress: creator non è nel team A`);
        continue;
      }

      matches.push({
        booking: inProgressBooking._id,
        createdBy: creator._id,
        players: matchPlayers,
        maxPlayers: maxPlayers,
        isPublic: canBePublic,
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

    // 4. MATCH FUTURI APERTI (open) - 100 match con stati misti e vari numeri di partecipanti
    for (let i = 0; i < Math.min(100, futureBookings.length); i++) {
      const booking = futureBookings[i];
      processedBookings.add(booking._id.toString()); // Traccia subito
      
      // ✅ SKIP: Se la prenotazione non è pubblica, salta questo match aperto
      if (booking.bookingType !== "public") continue;
      
      const creator = booking.user;
      
      // ✅ Verifica se la struttura ha split payment abilitato
      const struttura: any = strutture.find((s: any) => s._id.toString() === booking.struttura.toString());
      const canBePublic = struttura && struttura.isCostSplittingEnabled;
      
      // ✅ Se non può essere pubblico, salta questo match
      if (!canBePublic) continue;
      
      const maxPlayers = randomElement([4, 6, 8]);
      
      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator.toString()];

      matchPlayers.push({
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      });

      // 70% delle partite sono complete, 30% sono incomplete
      const isComplete = Math.random() > 0.3;
      const numConfirmed = isComplete ? maxPlayers - 1 : Math.floor(maxPlayers * (0.3 + Math.random() * 0.4));
      
      for (let j = 0; j < numConfirmed; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
        } while (selectedPlayers.includes(player._id.toString()));

        selectedPlayers.push(player._id.toString());
        const status = Math.random() > 0.3 ? "confirmed" : "pending";
        const joinDate = new Date();
        joinDate.setHours(joinDate.getHours() - randomInt(1, 12));
        
        matchPlayers.push({
          user: player._id,
          team: (j + 1) < (maxPlayers / 2) ? "A" : "B",
          status: status,
          joinedAt: joinDate,
          respondedAt: status === "confirmed" ? joinDate : undefined,
        });
      }

      // Verifica che il creator sia nel team A
      const creatorInTeamA = matchPlayers.find(p => p.user.toString() === creator.toString());
      if (!creatorInTeamA || creatorInTeamA.team !== "A") {
        console.warn(`⚠️ Match open: creator non è nel team A`);
        continue;
      }

      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: matchPlayers,
        maxPlayers: maxPlayers,
        isPublic: true,
        status: "open",
      });
      matchCounters.open++;
    }

    // 5. MATCH FUTURI COMPLETI (full) - 8 match con vari numeri di partecipanti
    for (let i = 8; i < Math.min(16, futureBookings.length); i++) {
      const booking = futureBookings[i];
      processedBookings.add(booking._id.toString()); // Traccia subito
      const creator = booking.user;
      
      // ✅ Verifica se la struttura ha split payment abilitato
      const struttura: any = strutture.find((s: any) => s._id.toString() === booking.struttura.toString());
      const canBePublic = struttura && struttura.isCostSplittingEnabled && booking.bookingType === "public";
      
      const maxPlayers = randomElement([4, 6, 8]);

      const matchPlayers: any[] = [];
      const selectedPlayers: string[] = [creator.toString()];

      matchPlayers.push({
        user: creator,
        team: "A",
        status: "confirmed",
        joinedAt: new Date(),
        respondedAt: new Date(),
      });

      for (let j = 1; j < maxPlayers; j++) {
        let player: any;
        do {
          player = randomElement(players as any[]);
        } while (selectedPlayers.includes(player._id.toString()));

        selectedPlayers.push(player._id.toString());
        matchPlayers.push({
          user: player._id,
          team: j < (maxPlayers / 2) ? "A" : "B",
          status: "confirmed",
          joinedAt: new Date(),
          respondedAt: new Date(),
        });
      }

      // Verifica che il creator sia nel team A
      const creatorInTeamA = matchPlayers.find(p => p.user.toString() === creator.toString());
      if (!creatorInTeamA || creatorInTeamA.team !== "A") {
        console.warn(`⚠️ Match full: creator non è nel team A`);
        continue;
      }

      matches.push({
        booking: booking._id,
        createdBy: creator,
        players: matchPlayers,
        maxPlayers: maxPlayers,
        isPublic: canBePublic,
        status: "full",
      });
      matchCounters.full++;
    }

    // 6. MATCH PER TUTTI I BOOKING RIMANENTI (draft/privati)
    const bookingsWithoutMatch = (savedBookings as any[]).filter((b) => !processedBookings.has(b._id.toString()));

    console.log(`\n📝 Creazione match per i ${bookingsWithoutMatch.length} booking rimanenti...`);

    for (const booking of bookingsWithoutMatch) {
      const maxPlayers = randomElement([4, 6, 8]);
      matches.push({
        booking: booking._id,
        createdBy: booking.user,
        players: [
          {
            user: booking.user,
            team: "A",
            status: "confirmed",
            joinedAt: new Date(),
            respondedAt: new Date(),
          },
        ],
        maxPlayers: maxPlayers,
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
    console.log(`   - In bozza: ${matchCounters.draft}`);
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

    /* -------- GENERA FILE CON LISTA PLAYER E OWNER -------- */
    console.log("\n📄 Generazione file con lista utenti...");
    
    const outputLines: string[] = [];
    outputLines.push("=".repeat(80));
    outputLines.push("LISTA COMPLETA UTENTI - BEACH VOLLEY APP");
    outputLines.push("=".repeat(80));
    outputLines.push("");
    outputLines.push(`Data generazione: ${new Date().toLocaleString('it-IT')}`);
    outputLines.push(`Password per tutti gli utenti: ${DEFAULT_PASSWORD}`);
    outputLines.push("");
    outputLines.push("=".repeat(80));
    outputLines.push(`PLAYERS (${players.length} utenti)`);
    outputLines.push("=".repeat(80));
    outputLines.push("");
    
    players.forEach((player: any, index: number) => {
      outputLines.push(`${String(index + 1).padStart(4, ' ')}. ${player.name} ${player.surname}`);
      outputLines.push(`      Email: ${player.email}`);
      outputLines.push(`      Username: ${player.username}`);
      outputLines.push(`      Role: ${player.role}`);
      if (player.avatarUrl) {
        outputLines.push(`      Avatar: ${player.avatarUrl.substring(0, 60)}...`);
      }
      outputLines.push("");
    });
    
    outputLines.push("");
    outputLines.push("=".repeat(80));
    outputLines.push(`OWNERS (${owners.length} utenti)`);
    outputLines.push("=".repeat(80));
    outputLines.push("");
    
    owners.forEach((owner: any, index: number) => {
      outputLines.push(`${String(index + 1).padStart(4, ' ')}. ${owner.name} ${owner.surname}`);
      outputLines.push(`      Email: ${owner.email}`);
      outputLines.push(`      Username: ${owner.username}`);
      outputLines.push(`      Role: ${owner.role}`);
      if (owner.avatarUrl) {
        outputLines.push(`      Avatar: ${owner.avatarUrl.substring(0, 60)}...`);
      }
      outputLines.push("");
    });
    
    outputLines.push("");
    outputLines.push("=".repeat(80));
    outputLines.push("RIEPILOGO");
    outputLines.push("=".repeat(80));
    outputLines.push(`Totale utenti: ${users.length}`);
    outputLines.push(`- Players: ${players.length}`);
    outputLines.push(`- Owners: ${owners.length}`);
    outputLines.push(`Strutture: ${strutture.length}`);
    outputLines.push(`Campi: ${campi.length}`);
    outputLines.push(`Prenotazioni: ${savedBookings.length}`);
    outputLines.push(`Match: ${matches.length}`);
    outputLines.push("=".repeat(80));
    
    const outputFilePath = path.join(process.cwd(), 'lista_utenti.txt');
    fs.writeFileSync(outputFilePath, outputLines.join('\n'), 'utf-8');
    
    console.log(`✅ File generato: ${outputFilePath}`);
    console.log(`   Contiene ${players.length} player e ${owners.length} owner`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Errore seed:", err);
    process.exit(1);
  }
}

seed();

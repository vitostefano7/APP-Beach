// seeds/config.ts - Configurazione e costanti
import dotenv from "dotenv";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

dotenv.config({ path: path.join(__dirname, "../../.env") });

export const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://admin:adminpass@127.0.0.1:27017/beach?authSource=admin";

export const DEFAULT_PASSWORD = "123";
export const SALT_ROUNDS = 10;
export const MONTHS_TO_GENERATE = 3;

// Quantità dati
export const NUM_PLAYERS = 500;
export const NUM_OWNERS = 50;
export const NUM_STRUTTURE = 100;
export const NUM_USER_POSTS = 500;
export const NUM_STRUTTURA_POSTS = 200;
export const NUM_PAST_BOOKINGS = 1000;
export const NUM_FUTURE_BOOKINGS = 500;
export const NUM_EVENTS = 50;
export const NUM_COMMUNITY_EVENTS = 100;

// Match quantities
export const NUM_MATCHES_FROM_PAST = 400;
export const NUM_OPEN_MATCHES = 100;
export const NUM_FULL_MATCHES = 100;

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const AVATAR_DIR = path.join(process.cwd(), "images", "profilo");
export const STRUTTURA_IMG_DIR = path.join(process.cwd(), "images", "struttura");

// Utility functions
export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const randomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Costanti per nomi italiani
export const ITALIAN_FIRST_NAMES = [
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

export const ITALIAN_LAST_NAMES = [
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

export const CITIES = [
  "Milano", "Roma", "Torino", "Bologna", "Firenze", "Napoli", "Venezia", "Verona",
  "Genova", "Palermo", "Catania", "Bari", "Cagliari", "Padova", "Brescia", "Rimini",
  "Parma", "Modena", "Reggio Emilia", "Trieste", "Piacenza", "Perugia", "Ancona",
  "Como", "Lecce", "Bergamo", "Salerno", "Ravenna", "Ferrara", "Pescara"
];

export const cityCoords: { [key: string]: { lat: number; lng: number } } = {
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

export const CITY_STREETS: { [city: string]: string[] } = {
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

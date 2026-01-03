"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = __importDefault(require("./models/User"));
const PlayerProfile_1 = __importDefault(require("./models/PlayerProfile"));
const UserPreferences_1 = __importDefault(require("./models/UserPreferences"));
const Strutture_1 = __importDefault(require("./models/Strutture"));
const Campo_1 = __importDefault(require("./models/Campo"));
const campoCalendarDay_1 = __importDefault(require("./models/campoCalendarDay"));
const Booking_1 = __importDefault(require("./models/Booking"));
const Match_1 = __importDefault(require("./models/Match"));
/* =========================
   CONFIG
========================= */
const MONGO_URI = process.env.MONGO_URI ||
    "mongodb://admin:adminpass@127.0.0.1:27017/beach?authSource=admin";
const DEFAULT_PASSWORD = "123";
const SALT_ROUNDS = 10;
const MONTHS_TO_GENERATE = 15; // Rolling calendar di 15 mesi
/* =========================
   UTILS
========================= */
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};
/**
 * ✅ Genera slot ogni 30 minuti
 */
function generateHalfHourSlots(open, close) {
    const slots = [];
    let [h, m] = open.split(":").map(Number);
    while (true) {
        const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        if (time >= close)
            break;
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
function generateDatesForMonths(months) {
    const dates = [];
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
        await mongoose_1.default.connect(MONGO_URI);
        console.log("✅ MongoDB connesso");
        /* -------- CLEAN -------- */
        await Promise.all([
            Match_1.default.deleteMany({}),
            Booking_1.default.deleteMany({}),
            campoCalendarDay_1.default.deleteMany({}),
            Campo_1.default.deleteMany({}),
            Strutture_1.default.deleteMany({}),
            PlayerProfile_1.default.deleteMany({}),
            UserPreferences_1.default.deleteMany({}),
            User_1.default.deleteMany({}),
        ]);
        console.log("🧹 Database pulito");
        /* -------- USERS -------- */
        const password = await bcrypt_1.default.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
        const users = await User_1.default.insertMany([
            { name: "Mario Rossi", email: "mario@test.it", password, role: "player", isActive: true },
            { name: "Giulia Verdi", email: "giulia@test.it", password, role: "player", isActive: true },
            { name: "Luca Bianchi", email: "luca@test.it", password, role: "player", isActive: true },
            { name: "Anna Ferrari", email: "anna@test.it", password, role: "player", isActive: true },
            { name: "Paolo Owner", email: "paolo@test.it", password, role: "owner", isActive: true },
            { name: "Sara Owner", email: "sara@test.it", password, role: "owner", isActive: true },
        ]);
        const players = users.filter((u) => u.role === "player");
        const owners = users.filter((u) => u.role === "owner");
        console.log(`✅ Creati ${users.length} utenti (${players.length} player, ${owners.length} owner)`);
        /* -------- PLAYER PROFILES -------- */
        await PlayerProfile_1.default.insertMany(players.map((p) => ({
            user: p._id,
            level: randomElement(["beginner", "amateur", "advanced"]),
            matchesPlayed: randomInt(0, 40),
            ratingAverage: Math.random() * 5,
        })));
        console.log(`✅ Creati ${players.length} player profiles`);
        /* -------- USER PREFERENCES -------- */
        await UserPreferences_1.default.insertMany(players.map((p) => ({
            user: p._id,
            pushNotifications: true,
            darkMode: Math.random() > 0.5,
            privacyLevel: randomElement(["public", "friends", "private"]),
            preferredLocation: {
                city: "Milano",
                lat: 45.4642,
                lng: 9.19,
                radius: 30,
            },
            favoriteStrutture: [],
            favoriteSports: ["Beach Volley"],
            preferredTimeSlot: randomElement(["morning", "afternoon", "evening"]),
        })));
        console.log(`✅ Create ${players.length} user preferences`);
        /* -------- STRUTTURE -------- */
        const strutture = await Strutture_1.default.insertMany([
            {
                name: "Beach Volley Milano",
                description: "Centro beach volley professionale con 3 campi",
                owner: owners[0]._id,
                location: {
                    address: "Via Tortona 35",
                    city: "Milano",
                    lat: 45.4642,
                    lng: 9.19,
                    coordinates: [9.19, 45.4642],
                },
                amenities: ["toilets", "lockerRoom", "showers", "parking", "bar"],
                openingHours: {},
                images: [],
                rating: { average: 4.7, count: 30 },
                isActive: true,
                isFeatured: true,
                isDeleted: false,
            },
            {
                name: "Beach Roma Ostia",
                description: "Campi beach volley vista mare",
                owner: owners[1]._id,
                location: {
                    address: "Lungomare Paolo Toscanelli 160",
                    city: "Roma",
                    lat: 41.735,
                    lng: 12.285,
                    coordinates: [12.285, 41.735],
                },
                amenities: ["toilets", "lockerRoom", "showers", "parking", "restaurant", "bar"],
                openingHours: {},
                images: [],
                rating: { average: 4.8, count: 50 },
                isActive: true,
                isFeatured: true,
                isDeleted: false,
            },
        ]);
        console.log(`✅ Create ${strutture.length} strutture`);
        /* -------- CAMPI -------- */
        const campi = await Campo_1.default.insertMany([
            // STRUTTURA 1 - Beach Volley Milano
            {
                struttura: strutture[0]._id,
                name: "Campo Beach 1",
                sport: "beach_volley",
                surface: "sand",
                maxPlayers: 4,
                indoor: false,
                pricePerHour: 40,
                isActive: true,
                pricingRules: {
                    mode: "flat",
                    flatPrices: { oneHour: 40, oneHourHalf: 56 },
                    basePrices: { oneHour: 40, oneHourHalf: 56 },
                    timeSlotPricing: { enabled: false, slots: [] },
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
            },
            {
                struttura: strutture[0]._id,
                name: "Campo Beach 2",
                sport: "beach_volley",
                surface: "sand",
                maxPlayers: 4,
                indoor: false,
                pricePerHour: 40,
                isActive: true,
                pricingRules: {
                    mode: "advanced",
                    flatPrices: { oneHour: 40, oneHourHalf: 56 },
                    basePrices: { oneHour: 35, oneHourHalf: 49 },
                    timeSlotPricing: {
                        enabled: true,
                        slots: [
                            {
                                start: "18:00",
                                end: "23:00",
                                label: "Sera",
                                prices: { oneHour: 45, oneHourHalf: 63 },
                            },
                        ],
                    },
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
            },
            // STRUTTURA 2 - Beach Roma
            {
                struttura: strutture[1]._id,
                name: "Campo Beach 1",
                sport: "beach_volley",
                surface: "sand",
                maxPlayers: 4,
                indoor: false,
                pricePerHour: 45,
                isActive: true,
                pricingRules: {
                    mode: "flat",
                    flatPrices: { oneHour: 45, oneHourHalf: 63 },
                    basePrices: { oneHour: 45, oneHourHalf: 63 },
                    timeSlotPricing: { enabled: false, slots: [] },
                    playerCountPricing: { enabled: false, prices: [] },
                },
                weeklySchedule: {
                    monday: { enabled: true, open: "09:00", close: "21:00" },
                    tuesday: { enabled: true, open: "09:00", close: "21:00" },
                    wednesday: { enabled: true, open: "09:00", close: "21:00" },
                    thursday: { enabled: true, open: "09:00", close: "21:00" },
                    friday: { enabled: true, open: "09:00", close: "22:00" },
                    saturday: { enabled: true, open: "08:00", close: "22:00" },
                    sunday: { enabled: true, open: "08:00", close: "21:00" },
                },
            },
        ]);
        console.log(`✅ Creati ${campi.length} campi`);
        /* -------- CALENDARIO (Rolling 15 mesi) -------- */
        const dates = generateDatesForMonths(MONTHS_TO_GENERATE);
        const calendarDocs = [];
        const WEEK_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        for (const campo of campi) {
            for (const dateStr of dates) {
                const date = new Date(dateStr + "T12:00:00");
                const weekday = WEEK_MAP[date.getDay()];
                const schedule = campo.weeklySchedule[weekday];
                calendarDocs.push({
                    campo: campo._id,
                    date: dateStr,
                    slots: schedule.enabled ? generateHalfHourSlots(schedule.open, schedule.close) : [],
                    isClosed: !schedule.enabled,
                });
            }
        }
        await campoCalendarDay_1.default.insertMany(calendarDocs);
        console.log(`✅ Creati ${calendarDocs.length} giorni di calendario (${campi.length} campi × ${dates.length} giorni)`);
        /* -------- BOOKINGS -------- */
        const bookings = [];
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Prenotazioni di oggi
        for (let i = 0; i < 5; i++) {
            const campo = randomElement(campi);
            const player = randomElement(players);
            const hour = randomInt(10, 18);
            const startTime = `${String(hour).padStart(2, "0")}:00`;
            const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
            bookings.push({
                user: player._id,
                campo: campo._id,
                date: formatDate(today),
                startTime,
                endTime,
                price: 40,
                status: "confirmed",
            });
        }
        // Prenotazioni di domani
        for (let i = 0; i < 5; i++) {
            const campo = randomElement(campi);
            const player = randomElement(players);
            const hour = randomInt(10, 18);
            const startTime = `${String(hour).padStart(2, "0")}:00`;
            const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
            bookings.push({
                user: player._id,
                campo: campo._id,
                date: formatDate(tomorrow),
                startTime,
                endTime,
                price: 40,
                status: "confirmed",
            });
        }
        const savedBookings = await Booking_1.default.insertMany(bookings);
        console.log(`✅ Create ${savedBookings.length} prenotazioni`);
        // ✅ Disabilita gli slot prenotati nel calendario
        for (const booking of savedBookings) {
            await campoCalendarDay_1.default.updateOne({
                campo: booking.campo,
                date: booking.date,
                "slots.time": booking.startTime,
            }, {
                $set: { "slots.$.enabled": false },
            });
        }
        console.log(`✅ Disabilitati ${savedBookings.length} slot nel calendario`);
        /* -------- MATCH -------- */
        const matches = savedBookings.slice(0, 3).map((b) => ({
            booking: b._id,
            score: {
                sets: [
                    { teamA: 21, teamB: 18 },
                    { teamA: 19, teamB: 21 },
                    { teamA: 15, teamB: 13 },
                ],
            },
            winner: "A",
        }));
        await Match_1.default.insertMany(matches);
        console.log(`✅ Creati ${matches.length} match`);
        /* -------- SUMMARY -------- */
        console.log("\n" + "=".repeat(50));
        console.log("🌱 SEED COMPLETATO CON SUCCESSO");
        console.log("=".repeat(50));
        console.log(`👥 Utenti: ${users.length} (${players.length} player, ${owners.length} owner)`);
        console.log(`🏢 Strutture: ${strutture.length}`);
        console.log(`⚽ Campi: ${campi.length}`);
        console.log(`📅 Giorni calendario: ${calendarDocs.length}`);
        console.log(`📝 Prenotazioni: ${savedBookings.length}`);
        console.log(`🏆 Match: ${matches.length}`);
        console.log("=".repeat(50));
        console.log("🔑 Password per tutti gli utenti: 123");
        console.log("=".repeat(50) + "\n");
        process.exit(0);
    }
    catch (err) {
        console.error("❌ Errore seed:", err);
        process.exit(1);
    }
}
seed();

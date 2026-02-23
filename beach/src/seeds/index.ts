// seeds/index.ts - Main seed orchestrator
import mongoose from "mongoose";

// Import models
import User from "../models/User";
import PlayerProfile from "../models/PlayerProfile";
import UserPreferences from "../models/UserPreferences";
import Struttura from "../models/Strutture";
import Campo from "../models/Campo";
import CampoCalendarDay from "../models/campoCalendarDay";
import Booking from "../models/Booking";
import Match from "../models/Match";
import Event from "../models/Event";
import Friendship from "../models/Friendship";
import Conversation from "../models/Conversazione";
import Message from "../models/Message";
import Notification from "../models/Notification";
import StrutturaFollower from "../models/StrutturaFollower";
import UserFollower from "../models/UserFollower";
import Post from "../models/Post";
import CommunityEvent from "../models/CommunityEvent";
import Sport from "../models/Sport";

// Import configuration
import { MONGO_URI } from "./config";

// Import modules
import { uploadAvatarsToCloudinary, uploadStrutturaImagesToCloudinary } from "./cloudinaryUpload";
import { seedSports, getSportMapping } from "./seedSports";
import { generateUsers } from "./generateUsers";
import { generateStrutture } from "./generateStrutture";
import { generateCampi } from "./generateCampi";
import { generateCalendar } from "./generateCalendar";
import { generateBookings } from "./generateBookings";
import { generateMatches } from "./generateMatches";
import { generatePosts } from "./generatePosts";
import { generateFollowers } from "./generateFollowers";
import { generateFriendships } from "./generateFriendships";
import { generateConversations } from "./generateConversations";
import { generateNotifications } from "./generateNotifications";
import fs from "fs";
import path from "path";

async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  console.time(label);
  try {
    return await fn();
  } finally {
    console.timeEnd(label);
  }
}

async function seed() {
  try {
    console.time("⏱️ Seed totale");
    mongoose.set('debug', false);
    await mongoose.connect(MONGO_URI, { maxPoolSize: 20 });
    console.log("✅ MongoDB connesso");

    /* -------- CLEAN -------- */
    const db = mongoose.connection.db ?? (() => {
      throw new Error("Connessione MongoDB non inizializzata correttamente");
    })();
    await measure("⏱️ Clean DB", () => db.dropDatabase());
    console.log("🧹 Database pulito");

    /* -------- SPORT -------- */
    const sports = await measure("⏱️ Seed sports", () => seedSports());
    const sportMapping = await measure("⏱️ Build sport mapping", () => getSportMapping());

    /* -------- CLOUDINARY UPLOAD -------- */
    console.log(`☁️ Upload avatar + immagini strutture...`);
    const [avatarUrls, strutturaImageUrls] = await measure("⏱️ Cloudinary upload", () => Promise.all([
      uploadAvatarsToCloudinary(),
      uploadStrutturaImagesToCloudinary(),
    ]));
    console.log(`✅ Avatar caricati: ${avatarUrls.length}`);
    console.log(`✅ Immagini strutture caricate: ${strutturaImageUrls.length}`);

    /* -------- USERS -------- */
    let users, players, owners;
    try {
      const result = await measure("⏱️ Generate users", () => generateUsers(avatarUrls));
      users = result.users;
      players = result.players;
      owners = result.owners;
    } catch (err) {
      console.error('ERRORE in generateUsers:', err);
      throw err;
    }

    /* -------- STRUTTURE -------- */
    const strutture = await measure("⏱️ Generate strutture", () => generateStrutture(owners));

    /* -------- TASK INDIPENDENTI -------- */
    const postsPromise = generatePosts(users, strutture);
    const followersPromise = generateFollowers(users, strutture);
    const friendshipsPromise = generateFriendships(players);

    /* -------- CAMPI -------- */
    const campi = await measure("⏱️ Generate campi", () => generateCampi(strutture, sportMapping));

    /* -------- CALENDAR + BOOKINGS -------- */
    const [calendar, bookings] = await measure("⏱️ Calendar + bookings", () => Promise.all([
      generateCalendar(campi),
      generateBookings(players, campi, strutture),
    ]));
    const today = new Date();
    const pastBookings = bookings.filter((b: any) => new Date(b.date) < today);
    const futureBookings = bookings.filter((b: any) => new Date(b.date) >= today);

    /* -------- MATCHES -------- */
    const matches = await measure("⏱️ Generate matches", () => generateMatches(players, campi, pastBookings.concat(futureBookings), strutture));

    // /* -------- CONVERSATIONS -------- */
    const conversationsPromise = generateConversations(users, strutture, matches);

    /* -------- NOTIFICATIONS -------- */
    const notificationsPromise = generateNotifications(users, matches, bookings, strutture, campi);

    const [{ conversations, messages }, notifications, posts, { strutturaFollowers, userFollowers }, friendships] = await measure("⏱️ Async social tasks", () => Promise.all([
      conversationsPromise,
      notificationsPromise,
      postsPromise,
      followersPromise,
      friendshipsPromise,
    ]));

    /* -------- GENERATE OUTPUT FILE -------- */
    console.log(`📝 Generazione lista_utenti.txt...`);
    const outputLines = ["=== UTENTI REGISTRATI ===\n"];
    for (const user of users) {
      outputLines.push(`Email: ${user.email} | Password: 123 | Ruolo: ${user.role}`);
    }
    const outputPath = path.join(__dirname, "lista_utenti.txt");
    fs.writeFileSync(outputPath, outputLines.join("\n"), "utf8");
    console.log(`✅ File creato: ${outputPath}`);

    /* -------- SUMMARY -------- */
    console.log("\n" + "=".repeat(50));
    console.log("🎉 SEED COMPLETATO!");
    console.log("=".repeat(50));
    console.log(`🏀 Sport: ${sports.length}`);
    console.log(`👥 Utenti: ${users.length} (${players.length} giocatori, ${owners.length} proprietari)`);
    console.log(`🏖️ Strutture: ${strutture.length}`);
    console.log(`🏐 Campi: ${campi.length}`);
    console.log(`📅 Giorni calendario: ${calendar.length}`);
    console.log(`📝 Prenotazioni: ${bookings.length} (${pastBookings.length} passate, ${futureBookings.length} future)`);
    console.log(`🏆 Match: ${matches.length}`);
    // console.log(`📰 Post: ${posts.length}`);
    // console.log(`👥 Follower strutture: ${strutturaFollowers.length}`);
    // console.log(`👥 Follower utenti: ${userFollowers.length}`);
    // console.log(`🤝 Amicizie: ${friendships.length}`);
    // console.log(`💬 Conversazioni: ${conversations.length}`);
    // console.log(`💬 Messaggi: ${messages.length}`);
    // console.log(`🔔 Notifiche: ${notifications.length}`);
    console.log("=".repeat(50));
    console.timeEnd("⏱️ Seed totale");

    process.exit(0);
  } catch (err) {
    console.timeEnd("⏱️ Seed totale");
    console.error("❌ Errore seed:", err);
    process.exit(1);
  }
}

seed();


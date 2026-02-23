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

async function seed() {
  try {
    mongoose.set('debug', false);
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connesso");

    /* -------- CLEAN -------- */
    await Promise.all([
      Sport.deleteMany({}),
      Post.deleteMany({}),
      UserFollower.deleteMany({}),
      StrutturaFollower.deleteMany({}),
      // Message.deleteMany({}),
      // Conversation.deleteMany({}),
      // Notification.deleteMany({}),
      // Friendship.deleteMany({}),
      // Event.deleteMany({}),
      // CommunityEvent.deleteMany({}),
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

    /* -------- SPORT -------- */
    const sports = await seedSports();
    const sportMapping = await getSportMapping();

    /* -------- AVATARS UPLOAD -------- */
    console.log(`☁️ Upload avatar...`);
    const avatarUrls = await uploadAvatarsToCloudinary();
    if (avatarUrls.length) {
      console.log(`✅ Avatar caricati: ${avatarUrls.length}`);
    } else {
      console.log("ℹ️ Nessun avatar caricato");
    }

    /* -------- STRUTTURA IMAGES UPLOAD -------- */
    console.log(`☁️ Upload immagini strutture...`);
    const strutturaImageUrls = await uploadStrutturaImagesToCloudinary();
    if (strutturaImageUrls.length) {
      console.log(`✅ Immagini strutture caricate: ${strutturaImageUrls.length}`);
    } else {
      console.log("ℹ️ Nessuna immagine struttura caricata");
    }

    /* -------- USERS -------- */
    let users, players, owners;
    try {
      const result = await generateUsers(avatarUrls);
      users = result.users;
      players = result.players;
      owners = result.owners;
    } catch (err) {
      console.error('ERRORE in generateUsers:', err);
      throw err;
    }

    console.log('--- DOPO generateUsers, PRIMA DI generateStrutture ---');
    /* -------- STRUTTURE -------- */
    console.log('--- PRIMA DI generateStrutture ---');
    const strutture = await generateStrutture(owners);
    console.log('--- DOPO generateStrutture ---');

    /* -------- CAMPI -------- */
    const campi = await generateCampi(strutture, sportMapping);

    /* -------- CALENDAR -------- */
    const calendar = await generateCalendar(campi);

    /* -------- BOOKINGS -------- */
    const bookings = await generateBookings(players, campi, strutture);
    const today = new Date();
    const pastBookings = bookings.filter((b: any) => new Date(b.date) < today);
    const futureBookings = bookings.filter((b: any) => new Date(b.date) >= today);

    /* -------- MATCHES -------- */
    const matches = await generateMatches(players, campi, pastBookings.concat(futureBookings), strutture);

    /* -------- POSTS -------- */
    const posts = await generatePosts(users, strutture);

    /* -------- FOLLOWERS -------- */
    const { strutturaFollowers, userFollowers } = await generateFollowers(users, strutture);

    /* -------- FRIENDSHIPS -------- */
    const friendships = await generateFriendships(players);

    // /* -------- CONVERSATIONS -------- */
    const { conversations, messages } = await generateConversations(users, strutture, matches);

    /* -------- NOTIFICATIONS -------- */
    const notifications = await generateNotifications(users, matches, bookings, strutture, campi);

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

    process.exit(0);
  } catch (err) {
    console.error("❌ Errore seed:", err);
    process.exit(1);
  }
}

seed();


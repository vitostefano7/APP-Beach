import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User";

dotenv.config();

async function migrateUsernames() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("❌ MONGO_URI mancante");
  }

  console.log("🔌 Connessione a MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✅ Connesso");

  const users = await User.find({
    $or: [
      { username: { $exists: false } },
      { username: null },
      { username: "" },
    ],
  });

  console.log(`📊 Utenti da migrare: ${users.length}`);

  for (const user of users) {
    const base = user.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "_")
      .slice(0, 16); // limite sicurezza

    let username = base;
    let counter = 1;

    while (await User.exists({ username })) {
      username = `${base}${counter}`;
      counter++;
    }

    user.username = username;

    try {
      await user.save({ validateBeforeSave: true });
      console.log(`✅ ${user.email} → ${username}`);
    } catch (err) {
      console.error(`❌ Errore su ${user.email}`, err);
    }
  }

  console.log("🎉 Migrazione completata");
  await mongoose.disconnect();
  process.exit(0);
}

migrateUsernames().catch(async (err) => {
  console.error("❌ Migrazione fallita:", err);
  await mongoose.disconnect();
  process.exit(1);
});

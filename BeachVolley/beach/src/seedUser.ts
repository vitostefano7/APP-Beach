import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User";

async function seed() {
  await mongoose.connect("mongodb://admin:adminpass@localhost:27017/beach?authSource=admin");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await User.create({
    name: "Test",
    email: "test@test.com",
    password: hashedPassword,
  });

  console.log("✅ Utente creato:", user.email);
  process.exit(0);
}

seed();

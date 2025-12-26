import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import struttureRoutes from "./routes/struttureRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import ownerRoutes from "./routes/ownerRoutes";
import campiRoutes from "./routes/campiRoutes";
import campoCalendarRoutes from "./routes/campoCalendarRoutes";
import matchRoutes from "./routes/matchRoutes";
import userPreferencesRoutes from './routes/userPreferencesRoutes';

const app = express();
app.use(express.json());

async function start() {
  try {
    await mongoose.connect(
      "mongodb://admin:adminpass@localhost:27017/beach?authSource=admin"
    );
    console.log("✅ MongoDB Connected");

    app.get("/", (_req, res) => {
      res.send("Backend Beach Booking API ✅");
    });

    // Route registration
    app.use("/auth", authRoutes);
    
    // ✅ SOLUZIONE: Metti userPreferencesRoutes PRIMA di userRoutes
    // Così /users/preferences viene gestito prima di /users/*
    app.use('/users', userPreferencesRoutes);  // ← PRIMA (più specifico)
    app.use("/users", userRoutes);              // ← DOPO (più generico)
    
    app.use("/strutture", struttureRoutes);
    app.use("/bookings", bookingRoutes);
    app.use("/owner", ownerRoutes);
    app.use("/campi", campiRoutes);
    app.use("/campi", campoCalendarRoutes);
    app.use("/matches", matchRoutes);
    
    app.listen(3000, () => {
      console.log("✅ Server started on port 3000");
    });
  } catch (err) {
    console.error("❌ Errore connessione MongoDB", err);
  }
}

start();
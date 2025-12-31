  import express from "express";
  import mongoose from "mongoose";
  import authRoutes from "./routes/authRoutes";
  import userRoutes from "./routes/userRoutes";
  import struttureRoutes from "./routes/struttureRoutes";
  import bookingRoutes from "./routes/bookingRoutes";  // ⬅️ UNO SOLO (minuscolo)
  import ownerRoutes from "./routes/ownerRoutes";      // ⬅️ minuscolo
  import campiRoutes from "./routes/campiRoutes";
  import campoCalendarRoutes from "./routes/campoCalendarRoutes";
  import matchRoutes from "./routes/matchRoutes";
  import userPreferencesRoutes from './routes/userPreferencesRoutes';
  import conversazioneRoute from './routes/conversazioneRoutes';


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
      app.use("/users", userRoutes);
      app.use("/strutture", struttureRoutes);
      app.use("/bookings", bookingRoutes);  // ⬅️ UNA SOLA VOLTA!
      app.use("/owner", ownerRoutes);
      app.use("/campi", campiRoutes);
      app.use("/calendar", campoCalendarRoutes);  // Stesso base path per calendar routes
      app.use("/matches", matchRoutes);
      app.use('/users', userPreferencesRoutes);  // ← Deve esserci questa riga
      app.use('/api/conversations', conversazioneRoute);


      
      app.listen(3000, () => {
        console.log("✅ Server started on port 3000");
      });
    } catch (err) {
      console.error("❌ Errore connessione MongoDB", err);
    }
  }

  start();
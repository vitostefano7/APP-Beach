import express from "express";
import path from "path";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import struttureRoutes from "./routes/struttureRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import ownerRoutes from "./routes/ownerRoutes";
import campiRoutes from "./routes/campiRoutes";
import campoCalendarRoutes from "./routes/campoCalendarRoutes";
import matchRoutes from "./routes/matchRoutes";
import userPreferencesRoutes from "./routes/userPreferencesRoutes";
import conversazioneRoute from "./routes/conversazioneRoutes";
import struttureImagesRoutes from "./routes/struttureImagesRoutes";

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

    // ✅ Serve immagini statiche (PRIMA di tutte le routes)
    // Il path deve puntare alla cartella images dentro beach/
    const imagesPath = path.join(__dirname, "../../beach/images");
    console.log("📁 Serving images from:", imagesPath);
    app.use("/images", express.static(imagesPath));

    // Route registration
    app.use("/auth", authRoutes);
    app.use("/users", userRoutes);
    app.use("/users", userPreferencesRoutes);
    
    // ✅ Routes immagini PRIMA di struttureRoutes
    app.use("/strutture", struttureImagesRoutes);
    app.use("/strutture", struttureRoutes);
    
    app.use("/bookings", bookingRoutes);
    app.use("/owner", ownerRoutes);
    app.use("/campi", campiRoutes);
    app.use("/calendar", campoCalendarRoutes);
    app.use("/matches", matchRoutes);
    app.use("/api/conversations", conversazioneRoute);

    app.listen(3000, () => {
      console.log("✅ Server started on port 3000");
    });
  } catch (err) {
    console.error("❌ Errore connessione MongoDB", err);
  }
}

start();

// ============================================
// IMPORTANTE:
// 1. Le routes delle immagini DEVONO essere
//    registrate PRIMA di struttureRoutes
//    altrimenti /:id cattura anche /:id/images
// 2. Il path delle immagini è relativo a dist/
//    quindi usiamo ../../images per tornare
//    alla root del progetto
// ============================================
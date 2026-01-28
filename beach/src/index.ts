import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Routes
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
import friendshipRoutes from "./routes/friendshipRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import communityRoutes from "./routes/communityRoutes";

import { requireAuth, AuthRequest } from "./middleware/authMiddleware";

dotenv.config();

const app = express();
app.use(express.json());

/* =========================
   LOGGING MIDDLEWARE
========================= */
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`🌐 ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  console.log(`   🔐 Auth: ${authHeader ? "Presente" : "Assente"}`);
  next();
});

/* =========================
   MONGODB CONNECTION
========================= */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB Atlas connesso");

    mongoose.connection.on("error", err => {
      console.error("❌ MongoDB error:", err);
    });

  } catch (error) {
    console.error("❌ Errore connessione MongoDB", error);
    process.exit(1);
  }
}

/* =========================
   SERVER START
========================= */
async function start() {
  await connectDB();

  /* =========================
     ROOT
  ========================= */
  app.get("/", (_req, res) => {
    res.json({
      message: "Backend Beach Booking API ✅",
      version: "1.0.0",
    });
  });

  /* =========================
     STATIC FILES
  ========================= */
  const profileImagesPath = path.join(__dirname, "../../beach/images/profilo");
  app.use("/images/profilo", express.static(profileImagesPath));

  const struttureImagesPath = path.join(__dirname, "../../beach/images/strutture");
  app.use("/images/strutture", express.static(struttureImagesPath));

  /* =========================
     ROUTES
  ========================= */
  app.use("/auth", authRoutes);
  app.use("/users", userRoutes);
  app.use("/users", userPreferencesRoutes);

  app.use("/strutture", struttureImagesRoutes);
  app.use("/strutture", struttureRoutes);

  app.use("/bookings", bookingRoutes);
  app.use("/owner", ownerRoutes);
  app.use("/campi", campiRoutes);
  app.use("/calendar", campoCalendarRoutes);
  app.use("/matches", matchRoutes);
  app.use("/api/conversations", conversazioneRoute);

  app.use("/friends", friendshipRoutes);
  app.use("/notifications", notificationRoutes);
  app.use("/community", communityRoutes);

  /* =========================
     AUTH TEST
  ========================= */
  app.get("/api/auth/test", requireAuth, (req: AuthRequest, res) => {
    res.json({
      authenticated: true,
      userId: req.user?.id,
      role: req.user?.role,
      timestamp: new Date(),
    });
  });

  /* =========================
     404
  ========================= */
  app.use("*", (req, res) => {
    res.status(404).json({
      error: "Route non trovata",
      requested: req.originalUrl,
    });
  });

  /* =========================
     LISTEN
  ========================= */
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server avviato su porta ${PORT}`);
  });
}

start();

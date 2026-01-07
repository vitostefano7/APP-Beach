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
import friendshipRoutes from "./routes/friendshipRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { requireAuth, AuthRequest } from "./middleware/authMiddleware";

const app = express();
app.use(express.json());

// Middleware per logging migliorato
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`🌐 ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  console.log(`   🔐 Auth: ${authHeader ? 'Presente' : 'Assente'}`);
  if (authHeader) {
    console.log(`   📝 Token: ${authHeader.substring(0, 30)}...`);
  }
  next();
});

async function start() {
  try {
    await mongoose.connect(
      "mongodb://admin:adminpass@localhost:27017/beach?authSource=admin"
    );
    console.log("✅ MongoDB Connected");

    // Route principale
    app.get("/", (_req, res) => {
      res.json({
        message: "Backend Beach Booking API ✅",
        version: "1.0.0",
        endpoints: {
          friends: "/friends",
          friendsSuggestions: "/friends/suggestions",
          notifications: "/notifications",
          users: "/api/users",
          bookings: "/api/bookings",
          matches: "/api/matches",
          strutture: "/api/strutture"
        }
      });
    });

    // ✅ Serve immagini statiche
    const profileImagesPath = path.join(__dirname, "../../beach/images/profilo");
    console.log("📁 Serving profile images from:", profileImagesPath);
    app.use("/images/profilo", express.static(profileImagesPath));
    
    const struttureImagesPath = path.join(__dirname, "../../beach/images/strutture");
    console.log("📁 Serving strutture images from:", struttureImagesPath);
    app.use("/images/strutture", express.static(struttureImagesPath));

    // ✅ Route registration
    app.use("/auth", authRoutes);
    app.use("/users", userRoutes);
    app.use("/users", userPreferencesRoutes);
    
    // Routes immagini PRIMA di struttureRoutes
    app.use("/strutture", struttureImagesRoutes);
    app.use("/strutture", struttureRoutes);
    
    app.use("/bookings", bookingRoutes);
    app.use("/owner", ownerRoutes);
    app.use("/campi", campiRoutes);
    app.use("/calendar", campoCalendarRoutes);
    app.use("/matches", matchRoutes);
    app.use("/api/conversations", conversazioneRoute);
    
    // ✅ Friends routes
    console.log("📦 Loading friendship routes...");
    app.use("/friends", friendshipRoutes);
    console.log("✅ Friendship routes mounted at /friends");

    // ✅ Notifications routes
    console.log("📦 Loading notification routes...");
    app.use("/notifications", notificationRoutes);
    console.log("✅ Notification routes mounted at /notifications");

    // ✅ Endpoint di test autenticazione
    app.get("/api/auth/test", requireAuth, (req: AuthRequest, res) => {
      res.json({
        authenticated: true,
        userId: req.user?.id,
        role: req.user?.role,
        message: "Autenticazione funzionante",
        timestamp: new Date()
      });
    });

    // ✅ Endpoint di debug per verificare le routes
    app.get("/api/debug/routes", (req, res) => {
      res.json({
        message: "Routes disponibili",
        friendsRoutes: {
          base: "/friends",
          suggestions: "/friends/suggestions",
          incomingRequests: "/friends/requests/incoming",
          outgoingRequests: "/friends/requests/outgoing",
          stats: "/friends/stats"
        },
        authTest: "/api/auth/test",
        timestamp: new Date()
      });
    });

    // ✅ Catch-all per 404
    app.use("*", (req, res) => {
      console.log(`❌ 404: Route non trovata: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        error: "Route non trovata",
        requested: req.originalUrl,
        availableRoutes: [
          "/api/debug/routes",
          "/api/auth/test",
          "/friends/suggestions",
          "/friends/requests/incoming",
          "/friends/requests/outgoing",
          "/friends/stats"
        ]
      });
    });

    app.listen(3000, () => {
      console.log("✅ Server started on port 3000");
      console.log("📡 Endpoints disponibili:");
      console.log("   👥 Friends API: http://localhost:3000/friends");
      console.log("   💡 Suggestions: http://localhost:3000/friends/suggestions");
      console.log("   🔐 Auth test: http://localhost:3000/api/auth/test");
      console.log("   🔍 Debug routes: http://localhost:3000/api/debug/routes");
    });
  } catch (err) {
    console.error("❌ Errore connessione MongoDB", err);
  }
}

start();
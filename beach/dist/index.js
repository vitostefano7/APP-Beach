"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const struttureRoutes_1 = __importDefault(require("./routes/struttureRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const ownerRoutes_1 = __importDefault(require("./routes/ownerRoutes"));
const campiRoutes_1 = __importDefault(require("./routes/campiRoutes"));
const campoCalendarRoutes_1 = __importDefault(require("./routes/campoCalendarRoutes"));
const matchRoutes_1 = __importDefault(require("./routes/matchRoutes"));
const userPreferencesRoutes_1 = __importDefault(require("./routes/userPreferencesRoutes"));
const conversazioneRoutes_1 = __importDefault(require("./routes/conversazioneRoutes"));
const struttureImagesRoutes_1 = __importDefault(require("./routes/struttureImagesRoutes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
async function start() {
    try {
        await mongoose_1.default.connect("mongodb://admin:adminpass@localhost:27017/beach?authSource=admin");
        console.log("✅ MongoDB Connected");
        app.get("/", (_req, res) => {
            res.send("Backend Beach Booking API ✅");
        });
        // ✅ Serve immagini statiche (PRIMA di tutte le routes)
        // Immagini profilo utente → beach/images/profilo
        const profileImagesPath = path_1.default.join(__dirname, "../../beach/images/profilo");
        console.log("📁 Serving profile images from:", profileImagesPath);
        app.use("/images/profilo", express_1.default.static(profileImagesPath));
        // Immagini strutture → beach/images/strutture
        const struttureImagesPath = path_1.default.join(__dirname, "../../beach/images/strutture");
        console.log("📁 Serving strutture images from:", struttureImagesPath);
        app.use("/images/strutture", express_1.default.static(struttureImagesPath));
        // Route registration
        app.use("/auth", authRoutes_1.default);
        app.use("/users", userRoutes_1.default);
        app.use("/users", userPreferencesRoutes_1.default);
        // ✅ Routes immagini PRIMA di struttureRoutes
        app.use("/strutture", struttureImagesRoutes_1.default);
        app.use("/strutture", struttureRoutes_1.default);
        app.use("/bookings", bookingRoutes_1.default);
        app.use("/owner", ownerRoutes_1.default);
        app.use("/campi", campiRoutes_1.default);
        app.use("/calendar", campoCalendarRoutes_1.default);
        app.use("/matches", matchRoutes_1.default);
        app.use("/api/conversations", conversazioneRoutes_1.default);
        app.listen(3000, () => {
            console.log("✅ Server started on port 3000");
        });
    }
    catch (err) {
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

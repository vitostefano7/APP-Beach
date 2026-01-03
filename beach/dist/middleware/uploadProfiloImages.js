"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// ✅ Percorso dove salvare le immagini
const uploadDir = path_1.default.join(__dirname, "../../images/profilo");
// ✅ Crea la cartella se non esiste
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
    console.log("📁 Cartella profilo creata:", uploadDir);
}
// ✅ Configurazione storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Genera nome file unico: userId_timestamp.ext
        const userId = req.user?.id || "unknown";
        const timestamp = Date.now();
        const ext = path_1.default.extname(file.originalname);
        const filename = `${userId}_${timestamp}${ext}`;
        cb(null, filename);
    },
});
// ✅ Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new Error("Solo immagini sono permesse (jpeg, jpg, png, gif, webp)"));
    }
};
// ✅ Configurazione multer
exports.uploadAvatar = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});

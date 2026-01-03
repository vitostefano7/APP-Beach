"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadStrutturaImage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const UPLOAD_DIR = "C:/Users/Vito/Desktop/Beach/APP-Beach/beach/src/images";
// crea la cartella se non esiste
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        console.log("sono nel middl di upload");
        const ext = path_1.default.extname(file.originalname);
        const name = `struttura-${Date.now()}${ext}`;
        cb(null, name);
    },
});
const fileFilter = (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        cb(new Error("Solo immagini consentite"));
    }
    else {
        cb(null, true);
    }
};
exports.uploadStrutturaImage = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

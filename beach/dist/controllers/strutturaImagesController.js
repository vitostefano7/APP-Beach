"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMainStrutturaImage = exports.deleteStrutturaImage = exports.addStrutturaImage = exports.upload = void 0;
const Strutture_1 = __importDefault(require("../models/Strutture"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// ✅ Configurazione Multer con path corretto
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Salva in beach/images/strutture
        // Da dist/controllers/ devo salire 3 livelli: dist -> beach-backend -> APP-Beach -> beach
        const uploadDir = path_1.default.join(__dirname, "../../../beach/images/strutture");
        // Crea directory se non esiste
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        console.log("📁 Salvando immagine struttura in:", uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `struttura-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error("Solo immagini sono permesse (jpeg, jpg, png, webp)"));
    }
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: fileFilter,
});
// ✅ Upload immagine
const addStrutturaImage = async (req, res) => {
    try {
        console.log("📸 Upload immagine struttura");
        const strutturaId = req.params.id;
        const userId = req.user?.id;
        if (!req.file) {
            return res.status(400).json({ message: "Nessun file caricato" });
        }
        console.log("📁 File ricevuto:", req.file.filename);
        console.log("💾 Path completo:", req.file.path);
        const struttura = await Strutture_1.default.findById(strutturaId);
        if (!struttura) {
            // Elimina file se struttura non esiste
            fs_1.default.unlinkSync(req.file.path);
            return res.status(404).json({ message: "Struttura non trovata" });
        }
        if (struttura.owner.toString() !== userId) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(403).json({ message: "Non autorizzato" });
        }
        // ✅ Path relativo per il database
        const imagePath = `/images/strutture/${req.file.filename}`;
        // Limite massimo 10 immagini
        if (struttura.images.length >= 10) {
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({ message: "Limite massimo di 10 immagini raggiunto" });
        }
        struttura.images.push(imagePath);
        await struttura.save();
        console.log("✅ Immagine salvata:", imagePath);
        res.status(201).json({
            message: "Immagine caricata con successo",
            image: imagePath,
            images: struttura.images
        });
    }
    catch (error) {
        console.error("❌ Errore upload immagine struttura:", error);
        // Pulizia file in caso di errore
        if (req.file) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Errore server" });
    }
};
exports.addStrutturaImage = addStrutturaImage;
// ✅ Elimina immagine
const deleteStrutturaImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;
        const userId = req.user?.id;
        const struttura = await Strutture_1.default.findById(id);
        if (!struttura) {
            return res.status(404).json({ message: "Struttura non trovata" });
        }
        if (struttura.owner.toString() !== userId) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        // Rimuovi dall'array
        const imageIndex = struttura.images.indexOf(imageUrl);
        if (imageIndex === -1) {
            return res.status(404).json({ message: "Immagine non trovata" });
        }
        struttura.images.splice(imageIndex, 1);
        await struttura.save();
        // Elimina file fisico
        const filename = imageUrl.replace("/images/strutture/", "");
        const filePath = path_1.default.join(__dirname, "../../../beach/images/strutture", filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            console.log("🗑️ File eliminato:", filePath);
        }
        res.json({
            message: "Immagine eliminata con successo",
            images: struttura.images,
        });
    }
    catch (error) {
        console.error("❌ Errore eliminazione immagine:", error);
        res.status(500).json({ message: "Errore durante l'eliminazione" });
    }
};
exports.deleteStrutturaImage = deleteStrutturaImage;
// ✅ Imposta immagine principale
const setMainStrutturaImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;
        const userId = req.user?.id;
        const struttura = await Strutture_1.default.findById(id);
        if (!struttura) {
            return res.status(404).json({ message: "Struttura non trovata" });
        }
        if (struttura.owner.toString() !== userId) {
            return res.status(403).json({ message: "Non autorizzato" });
        }
        const imageIndex = struttura.images.indexOf(imageUrl);
        if (imageIndex === -1) {
            return res.status(404).json({ message: "Immagine non trovata" });
        }
        // Sposta in prima posizione
        struttura.images.splice(imageIndex, 1);
        struttura.images.unshift(imageUrl);
        await struttura.save();
        console.log("⭐ Immagine principale impostata:", imageUrl);
        res.json({
            message: "Immagine principale impostata",
            images: struttura.images,
        });
    }
    catch (error) {
        console.error("❌ Errore impostazione immagine principale:", error);
        res.status(500).json({ message: "Errore durante l'operazione" });
    }
};
exports.setMainStrutturaImage = setMainStrutturaImage;

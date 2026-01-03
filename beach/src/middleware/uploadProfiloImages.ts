import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Percorso dove salvare le immagini
const uploadDir = path.join(__dirname, "../../images/profilo");

// ✅ Crea la cartella se non esiste
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Cartella profilo creata:", uploadDir);
}

// ✅ Configurazione storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Genera nome file unico: userId_timestamp.ext
    const userId = (req as any).user?.id || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// ✅ Filtro per accettare solo immagini
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Solo immagini sono permesse (jpeg, jpg, png, gif, webp)"));
  }
};

// ✅ Configurazione multer
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});
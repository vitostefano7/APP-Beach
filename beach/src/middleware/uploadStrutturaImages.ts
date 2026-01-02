import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = "C:/Users/Vito/Desktop/Beach/APP-Beach/beach/src/images";

// crea la cartella se non esiste
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    console.log("sono nel middl di upload");
    const ext = path.extname(file.originalname);
    const name = `struttura-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Solo immagini consentite"));
  } else {
    cb(null, true);
  }
};

export const uploadStrutturaImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

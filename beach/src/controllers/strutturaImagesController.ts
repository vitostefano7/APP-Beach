import { Request, Response } from "express";
import Struttura from "../models/Strutture";
import multer from "multer";
import path from "path";
import fs from "fs";

// Estendiamo il tipo Request per includere il file di Multer
interface RequestConFile extends Request {
    file?: Express.Multer.File;
}

// ✅ Configurazione Multer con path corretto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Salva in beach/images/strutture
    // Da dist/controllers/ devo salire 3 livelli: dist -> beach-backend -> APP-Beach -> beach
    const uploadDir = path.join(__dirname, "../../../beach/images/strutture");
    
    // Crea directory se non esiste
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log("📁 Salvando immagine struttura in:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `struttura-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo immagini sono permesse (jpeg, jpg, png, webp)"));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter,
});

// ✅ Upload immagine
export const addStrutturaImage = async (req: RequestConFile, res: Response) => {
    try {
        console.log("📸 Upload immagine struttura");
        const strutturaId = req.params.id;
        const userId = (req as any).user?.id;

        if (!req.file) {
            return res.status(400).json({ message: "Nessun file caricato" });
        }

        console.log("📁 File ricevuto:", req.file.filename);
        console.log("💾 Path completo:", req.file.path);

        const struttura = await Struttura.findById(strutturaId);

        if (!struttura) {
            // Elimina file se struttura non esiste
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: "Struttura non trovata" });
        }

        if (struttura.owner.toString() !== userId) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ message: "Non autorizzato" });
        }

        // ✅ Path relativo per il database
        const imagePath = `/images/strutture/${req.file.filename}`;
        
        // Limite massimo 10 immagini
        if (struttura.images.length >= 10) {
            fs.unlinkSync(req.file.path);
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

    } catch (error) {
        console.error("❌ Errore upload immagine struttura:", error);
        
        // Pulizia file in caso di errore
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ message: "Errore server" });
    }
};

// ✅ Elimina immagine
export const deleteStrutturaImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;
        const userId = (req as any).user?.id;

        const struttura = await Struttura.findById(id);

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
        const filePath = path.join(__dirname, "../../../beach/images/strutture", filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("🗑️ File eliminato:", filePath);
        }

        res.json({
            message: "Immagine eliminata con successo",
            images: struttura.images,
        });
    } catch (error) {
        console.error("❌ Errore eliminazione immagine:", error);
        res.status(500).json({ message: "Errore durante l'eliminazione" });
    }
};

// ✅ Imposta immagine principale
export const setMainStrutturaImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;
        const userId = (req as any).user?.id;

        const struttura = await Struttura.findById(id);

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
    } catch (error) {
        console.error("❌ Errore impostazione immagine principale:", error);
        res.status(500).json({ message: "Errore durante l'operazione" });
    }
};
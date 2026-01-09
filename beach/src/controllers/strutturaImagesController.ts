import { Request, Response } from "express";
import Struttura from "../models/Strutture";
import multer from "multer";
import cloudinary from "../config/cloudinary";

// ✅ Configurazione da variabili d'ambiente
const STRUTTURE_FOLDER = process.env.CLOUDINARY_STRUTTURE_FOLDER || "images/struttura-images";
const MAX_WIDTH = parseInt(process.env.CLOUDINARY_STRUTTURE_MAX_WIDTH || "1920");
const MAX_HEIGHT = parseInt(process.env.CLOUDINARY_STRUTTURE_MAX_HEIGHT || "1080");
const QUALITY = process.env.CLOUDINARY_STRUTTURE_QUALITY || "auto:good";
const MAX_FILE_SIZE = parseInt(process.env.CLOUDINARY_STRUTTURE_MAX_SIZE || "10485760"); // 10MB
const MAX_IMAGES = parseInt(process.env.CLOUDINARY_STRUTTURE_MAX_IMAGES || "10");

// Estendiamo il tipo Request per includere il file di Multer
interface RequestConFile extends Request {
    file?: Express.Multer.File;
}

// ✅ Configurazione Multer - Memory storage per Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Solo immagini sono permesse (jpeg, jpg, png, webp)"));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter,
});

// ✅ Upload immagine su Cloudinary
export const addStrutturaImage = async (req: RequestConFile, res: Response) => {
    try {
        console.log("📸 Upload immagine struttura");
        const strutturaId = req.params.id;
        const userId = (req as any).user?.id;

        if (!req.file) {
            return res.status(400).json({ message: "Nessun file caricato" });
        }

        console.log("📁 File ricevuto:", req.file.originalname);
        console.log("📏 Dimensione:", req.file.size, "bytes");

        const struttura = await Struttura.findById(strutturaId);

        if (!struttura) {
            return res.status(404).json({ message: "Struttura non trovata" });
        }

        if (struttura.owner.toString() !== userId) {
            return res.status(403).json({ message: "Non autorizzato" });
        }

        // Limite massimo immagini
        if (struttura.images.length >= MAX_IMAGES) {
            return res.status(400).json({ message: `Limite massimo di ${MAX_IMAGES} immagini raggiunto` });
        }

        // ✅ Upload su Cloudinary
        const base64 = req.file.buffer.toString("base64");
        const dataUri = `data:${req.file.mimetype};base64,${base64}`;
        const timestamp = Date.now();
        const publicId = `strutture/${strutturaId}/${timestamp}`;

        console.log("☁️ Caricamento su Cloudinary...", publicId);

        const result = await cloudinary.uploader.upload(dataUri, {
            public_id: publicId,
            folder: STRUTTURE_FOLDER,
            resource_type: "image",
            transformation: [
                { width: MAX_WIDTH, height: MAX_HEIGHT, crop: "limit" },
                { quality: QUALITY },
                { fetch_format: "auto" }
            ]
        });

        console.log("✅ Upload Cloudinary completato:", result.secure_url);

        const imageUrl = result.secure_url;
        struttura.images.push(imageUrl);
        await struttura.save();

        res.status(201).json({ 
            message: "Immagine caricata con successo", 
            image: imageUrl,
            images: struttura.images
        });

    } catch (error) {
        console.error("❌ Errore upload immagine struttura:", error);
        res.status(500).json({ message: "Errore server durante l'upload" });
    }
};

// ✅ Elimina immagine da Cloudinary
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

        // ✅ Elimina da Cloudinary se è un URL Cloudinary
        if (imageUrl.includes("cloudinary.com")) {
            try {
                // Estrai public_id dall'URL
                const urlParts = imageUrl.split("/");
                const uploadIndex = urlParts.indexOf("upload");
                if (uploadIndex !== -1) {
                    const publicIdWithExt = urlParts.slice(uploadIndex + 2).join("/");
                    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf("."));
                    
                    console.log("🗑️ Eliminazione da Cloudinary:", publicId);
                    await cloudinary.uploader.destroy(publicId, {
                        invalidate: true,
                        resource_type: "image"
                    });
                    console.log("✅ Immagine eliminata da Cloudinary");
                }
            } catch (cloudError) {
                console.error("⚠️ Errore eliminazione da Cloudinary (non bloccante):", cloudError);
                // Continua comunque, l'importante è che sia rimossa dal DB
            }
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
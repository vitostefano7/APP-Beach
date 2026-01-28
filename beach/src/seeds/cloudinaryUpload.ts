// seeds/cloudinaryUpload.ts - Upload funzioni per Cloudinary
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { AVATAR_DIR, STRUTTURA_IMG_DIR } from "./config";

export function getAvatarFiles(): string[] {
  if (!fs.existsSync(AVATAR_DIR)) return [];
  return fs
    .readdirSync(AVATAR_DIR)
    .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .map((file) => path.join(AVATAR_DIR, file));
}

export async function uploadAvatarsToCloudinary(): Promise<string[]> {
  // Recupera immagini già presenti su Cloudinary nella cartella images/user-profile
  try {
    const result = await cloudinary.search
      .expression('folder:images/user-profile')
      .max_results(500)
      .execute();

    if (result.resources && result.resources.length > 0) {
      console.log(`✅ Trovate ${result.resources.length} immagini profilo su Cloudinary`);
      return result.resources.map((r: any) => r.secure_url);
    } else {
      console.warn(`⚠️ Nessuna immagine trovata su Cloudinary in images/user-profile`);
      return [];
    }
  } catch (error) {
    console.error('❌ Errore nel recupero immagini da Cloudinary:', error);
    return [];
  }
}

export function getStrutturaImageFiles(): string[] {
  if (!fs.existsSync(STRUTTURA_IMG_DIR)) return [];
  return fs
    .readdirSync(STRUTTURA_IMG_DIR)
    .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .map((file) => path.join(STRUTTURA_IMG_DIR, file));
}

export async function uploadStrutturaImagesToCloudinary(): Promise<string[]> {
  // Recupera immagini già presenti su Cloudinary nella cartella images/struttura-images
  try {
    const folder = "images/struttura-images";
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .max_results(500)
      .execute();

    if (result.resources && result.resources.length > 0) {
      console.log(`✅ Trovate ${result.resources.length} immagini strutture su Cloudinary`);
      return result.resources.map((r: any) => r.secure_url);
    } else {
      console.warn(`⚠️ Nessuna immagine trovata su Cloudinary in ${folder}`);
      return [];
    }
  } catch (error) {
    console.error('❌ Errore nel recupero immagini strutture da Cloudinary:', error);
    return [];
  }
}

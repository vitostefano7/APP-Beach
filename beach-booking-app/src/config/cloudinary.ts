// Configurazione Cloudinary per upload da frontend

export const CLOUDINARY_CONFIG = {
  cloudName: "ddkt2wunn", // Cloud name dal .env del backend
  uploadPreset: "strutturaImage", // Preset unsigned per upload strutture
  apiUrl: "https://api.cloudinary.com/v1_1",
};

export const CLOUDINARY_FOLDERS = {
  strutture: "images/struttura-images",
  profilo: "images/profilo",
};

/**
 * Carica un'immagine su Cloudinary usando l'upload preset unsigned
 * @param imageUri URI locale dell'immagine da caricare
 * @param folder Cartella Cloudinary dove salvare l'immagine
 * @returns URL pubblico dell'immagine caricata
 */
export async function uploadToCloudinary(
  imageUri: string,
  folder: string = CLOUDINARY_FOLDERS.strutture
): Promise<string> {
  const formData = new FormData();
  
  // Estrai l'estensione del file
  const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `photo-${Date.now()}.${ext}`;
  
  // Aggiungi l'immagine al FormData
  formData.append("file", {
    uri: imageUri,
    type: `image/${ext === "jpg" ? "jpeg" : ext}`,
    name: filename,
  } as any);
  
  // Parametri Cloudinary
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
  formData.append("folder", folder);
  formData.append("display_name", filename);
  
  // Upload a Cloudinary
  const response = await fetch(
    `${CLOUDINARY_CONFIG.apiUrl}/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    console.error("Errore Cloudinary:", error);
    throw new Error(error.error?.message || "Errore durante l'upload su Cloudinary");
  }
  
  const data = await response.json();
  
  // Ritorna l'URL pubblico dell'immagine
  return data.secure_url;
}

/**
 * Carica più immagini su Cloudinary in sequenza
 * @param imageUris Array di URI locali delle immagini
 * @param folder Cartella Cloudinary
 * @param onProgress Callback opzionale per monitorare il progresso
 * @returns Array di URL pubblici delle immagini caricate
 */
export async function uploadMultipleToCloudinary(
  imageUris: string[],
  folder: string = CLOUDINARY_FOLDERS.strutture,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  
  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];
    
    // Notifica progresso
    if (onProgress) {
      onProgress(i + 1, imageUris.length);
    }
    
    try {
      const url = await uploadToCloudinary(uri, folder);
      uploadedUrls.push(url);
    } catch (error) {
      console.error(`Errore upload immagine ${i + 1}:`, error);
      throw error;
    }
  }
  
  return uploadedUrls;
}

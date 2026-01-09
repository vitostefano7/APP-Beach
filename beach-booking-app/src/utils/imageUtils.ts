import API_URL from "../config/api";

/**
 * Risolve l'URL completo di un'immagine.
 * Se l'URL è già completo (es: Cloudinary), lo ritorna così com'è.
 * Se è un path relativo (es: /images/strutture/...), lo concatena con API_URL.
 * 
 * @param imageUrl URL dell'immagine (può essere relativo o assoluto)
 * @returns URL completo dell'immagine
 */
export function resolveImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl) return "";
  
  // Se l'URL inizia con http:// o https://, è già completo
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  
  // Altrimenti è un path relativo, concatena con API_URL
  return `${API_URL}${imageUrl}`;
}

/**
 * Risolve un array di URL di immagini
 * @param images Array di URL immagini
 * @returns Array di URL completi
 */
export function resolveImageUrls(images: string[] | undefined | null): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images.map(img => resolveImageUrl(img));
}

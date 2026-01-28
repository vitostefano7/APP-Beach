import API_URL from "../config/api";

function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;

  // Se l'URL inizia con http:// o https://, restituiscilo così com'è (es. Cloudinary)
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;

  // Altrimenti, concatena con API_URL (per compatibilità con vecchi percorsi relativi)
  const baseUrl = API_URL.replace(/\/$/, "");
  const cleanPath = avatarUrl.startsWith("/") ? avatarUrl.slice(1) : avatarUrl;
  return `${baseUrl}/${cleanPath}`;
}

function getInitials(name?: string, surname?: string): string {
  if (!name) return "??";

  const trimmedName = name.trim();
  if (trimmedName.length === 0) return "??";

  // Se presente cognome, usa prima lettera di entrambi
  if (surname && surname.trim().length > 0) {
    return `${trimmedName.charAt(0)}${surname.trim().charAt(0)}`.toUpperCase();
  }

  // Nome singolo: prendi prime 2 lettere
  if (trimmedName.length === 1) {
    return trimmedName.toUpperCase();
  }

  // Controlla se il nome contiene spazio (nome completo in un campo)
  const parts = trimmedName.split(" ").filter(part => part.length > 0);

  if (parts.length === 1) {
    return trimmedName.substring(0, 2).toUpperCase();
  } else {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
}

export { resolveAvatarUrl, getInitials };

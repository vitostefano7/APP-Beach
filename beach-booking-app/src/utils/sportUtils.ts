/**
 * Utility centralizzata per la gestione e normalizzazione dei nomi degli sport
 */

export const SPORT_LABELS: Record<string, string> = {
  // Beach Volleyball
  beach_volley: 'Beach Volley',
  'beach volley': 'Beach Volley',
  beach_volleyball: 'Beach Volley',
  'beach volleyball': 'Beach Volley',
  beachvolley: 'Beach Volley',
  'beach-volley': 'Beach Volley',
  
  // Volleyball
  volley: 'Volley',
  volleyball: 'Volley',
  pallavolo: 'Volley',
  
  // Beach Tennis
  beach_tennis: 'Beach Tennis',
  'beach tennis': 'Beach Tennis',
  beachtennis: 'Beach Tennis',
  'beach-tennis': 'Beach Tennis',
  
  // Tennis
  tennis: 'Tennis',
  
  // Padel
  padel: 'Padel',
  
  // Calcio
  calcio: 'Calcio',
  football: 'Calcio',
  soccer: 'Calcio',
  
  // Calcetto
  calcetto: 'Calcetto',
  futsal: 'Calcetto',
  
  // Calciotto
  calciotto: 'Calciotto',
  
  // Calcio a 7
  calcio_a_7: 'Calcio a 7',
  'calcio a 7': 'Calcio a 7',
  calcio7: 'Calcio a 7',
  
  // Basket
  basket: 'Basket',
  basketball: 'Basket',
  pallacanestro: 'Basket',
};

/**
 * Normalizza il nome di uno sport in formato leggibile
 * @param sport - Il codice o nome dello sport da normalizzare
 * @returns Il nome formattato dello sport
 */
export function formatSportName(sport?: string): string {
  if (!sport) return 'Sport';

  // Prova match esatto
  if (SPORT_LABELS[sport]) return SPORT_LABELS[sport];

  // Prova lowercase
  const lower = sport.toLowerCase();
  if (SPORT_LABELS[lower]) return SPORT_LABELS[lower];

  // Prova normalizzato (sostituisce spazi, trattini, underscore)
  const normalized = lower.replace(/[\s_-]+/g, '_');
  if (SPORT_LABELS[normalized]) return SPORT_LABELS[normalized];

  // Fallback: capitalizza la prima lettera
  return sport.charAt(0).toUpperCase() + sport.slice(1);
}

/**
 * Ottiene il codice sport normalizzato
 * @param sport - Il nome o codice dello sport
 * @returns Il codice sport normalizzato
 */
export function getSportCode(sport: string): string {
  const normalized = sport.toLowerCase().replace(/[\s-]+/g, '_');
  return normalized;
}

/**
 * Converte un codice sport (es. "volleyball") nel nome formattato (es. "Pallavolo")
 * Utile per interfacciare codici del backend con display frontend
 */
export function sportCodeToName(code: string): string {
  return formatSportName(code);
}

/**
 * Converte un nome sport formattato nel codice corrispondente
 * Es: "Pallavolo" -> "volleyball", "Beach Volley" -> "beach_volleyball"
 */
export function sportNameToCode(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Trova la chiave corrispondente nel dizionario
  for (const [code, label] of Object.entries(SPORT_LABELS)) {
    if (label.toLowerCase() === lowerName) {
      return code;
    }
  }
  
  // Fallback: converti il nome in formato codice
  return getSportCode(name);
}

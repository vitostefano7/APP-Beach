/**
 * Service per gestire regole e validazioni sport-specifiche
 * Sostituisce matchSportRules.ts con logica dinamica basata sul modello Sport
 */

import Sport, { ISport } from '../models/Sport';
import mongoose from 'mongoose';

// Cache per evitare query ripetute al database
const sportCache = new Map<string, ISport>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti
let lastCacheUpdate = 0;

/**
 * Recupera uno sport dal database con caching
 */
export async function getSportById(sportId: string | mongoose.Types.ObjectId): Promise<ISport | null> {
  const id = sportId.toString();
  
  // Refresh cache se scaduto
  if (Date.now() - lastCacheUpdate > CACHE_TTL) {
    sportCache.clear();
    lastCacheUpdate = Date.now();
  }
  
  // Cerca in cache
  if (sportCache.has(id)) {
    return sportCache.get(id)!;
  }
  
  // Query database
  const sport = await Sport.findById(id);
  if (sport) {
    sportCache.set(id, sport);
  }
  
  return sport;
}

/**
 * Recupera uno sport dal database per codice con caching
 */
export async function getSportByCode(code: string): Promise<ISport | null> {
  // Cerca in cache
  const cached = Array.from(sportCache.values()).find(s => s.code === code);
  if (cached) return cached;
  
  // Query database
  const sport = await Sport.findByCode(code);
  if (sport) {
    sportCache.set(sport._id.toString(), sport);
  }
  
  return sport;
}

/**
 * Valida se il numero di giocatori è valido per lo sport
 */
export async function validateMaxPlayersForSport(
  maxPlayers: number,
  sportId: string | mongoose.Types.ObjectId
): Promise<{ valid: boolean; error?: string }> {
  const sport = await getSportById(sportId);
  
  if (!sport) {
    return { valid: false, error: 'Sport non trovato' };
  }
  
  if (maxPlayers < sport.minPlayers || maxPlayers > sport.maxPlayers) {
    return {
      valid: false,
      error: `${sport.name} richiede tra ${sport.minPlayers} e ${sport.maxPlayers} giocatori`,
    };
  }
  
  // Verifica se richiede numero pari
  if (sport.requiresEvenPlayers && maxPlayers % 2 !== 0) {
    return {
      valid: false,
      error: `${sport.name} richiede un numero pari di giocatori`,
    };
  }
  
  return { valid: true };
}

/**
 * Valida se una formazione è consentita per lo sport
 */
export async function validateFormationForSport(
  formation: string,
  sportId: string | mongoose.Types.ObjectId
): Promise<{ valid: boolean; error?: string }> {
  const sport = await getSportById(sportId);
  
  if (!sport) {
    return { valid: false, error: 'Sport non trovato' };
  }
  
  if (!sport.allowedFormations.includes(formation)) {
    return {
      valid: false,
      error: `Formazione ${formation} non consentita per ${sport.name}. Formazioni valide: ${sport.allowedFormations.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Valida se l'ambiente (indoor/outdoor) è compatibile con lo sport
 */
export async function validateEnvironmentForSport(
  isIndoor: boolean,
  sportId: string | mongoose.Types.ObjectId
): Promise<{ valid: boolean; error?: string }> {
  const sport = await getSportById(sportId);
  
  if (!sport) {
    return { valid: false, error: 'Sport non trovato' };
  }
  
  if (isIndoor && !sport.allowsIndoor) {
    return {
      valid: false,
      error: `${sport.name} non può essere praticato indoor`,
    };
  }
  
  if (!isIndoor && !sport.allowsOutdoor) {
    return {
      valid: false,
      error: `${sport.name} non può essere praticato outdoor`,
    };
  }
  
  return { valid: true };
}

/**
 * Ottiene le superfici raccomandate per uno sport e ambiente
 */
export async function getRecommendedSurfaces(
  sportId: string | mongoose.Types.ObjectId,
  isIndoor: boolean
): Promise<string[]> {
  const sport = await getSportById(sportId);
  
  if (!sport || !sport.recommendedSurfaces) {
    return [];
  }
  
  const surfaces = sport.recommendedSurfaces;
  
  // Se ci sono superfici "any" (valide per entrambi gli ambienti)
  if (surfaces.any && surfaces.any.length > 0) {
    return surfaces.any;
  }
  
  // Altrimenti ritorna quelle specifiche per l'ambiente
  if (isIndoor && surfaces.indoor) {
    return surfaces.indoor;
  }
  
  if (!isIndoor && surfaces.outdoor) {
    return surfaces.outdoor;
  }
  
  return [];
}

/**
 * Verifica se una superficie è raccomandata per lo sport
 * (Non vincolante, solo informativo)
 */
export async function isSurfaceRecommended(
  surface: string,
  sportId: string | mongoose.Types.ObjectId,
  isIndoor: boolean
): Promise<boolean> {
  const recommended = await getRecommendedSurfaces(sportId, isIndoor);
  return recommended.includes(surface);
}

/**
 * Ottiene le regole di punteggio per uno sport
 */
export async function getScoringRules(
  sportId: string | mongoose.Types.ObjectId
) {
  const sport = await getSportById(sportId);
  
  if (!sport) {
    return null;
  }
  
  return {
    system: sport.scoringSystem,
    rules: sport.scoringRules,
    sportName: sport.name,
  };
}

/**
 * Verifica se lo sport supporta il pricing per giocatore
 */
export async function allowsPlayerPricing(
  sportId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  const sport = await getSportById(sportId);
  return sport?.allowsPlayerPricing ?? false;
}

/**
 * Pulisce la cache (utile per testing o dopo update al database)
 */
export function clearSportCache(): void {
  sportCache.clear();
  lastCacheUpdate = 0;
}

/**
 * Precarica tutti gli sport attivi in cache
 */
export async function preloadSports(): Promise<void> {
  const sports = await Sport.find({ isActive: true });
  sports.forEach(sport => {
    sportCache.set(sport._id.toString(), sport);
  });
  lastCacheUpdate = Date.now();
}

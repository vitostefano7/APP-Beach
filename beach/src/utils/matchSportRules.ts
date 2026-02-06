/**
 * Regole e validazioni per i partecipanti alle partite basate sul tipo di sport
 */

export type SportType = "volley" | "beach_volley" | "beach_tennis" | "tennis" | "padel" | "calcio" | "calcetto" | "calciotto" | "calcio_a_7" | "basket";

export interface MaxPlayersRules {
  min: number;
  max: number;
  allowedValues: number[];
  mustBeEven: boolean;
  fixed?: number; // Se presente, maxPlayers deve essere esattamente questo valore
}

/**
 * Restituisce le regole per maxPlayers basate sul tipo di sport
 */
export function getMaxPlayersRulesForSport(sport: SportType): MaxPlayersRules {
  switch (sport) {
    case "volley":
      return {
        min: 12,
        max: 12,
        allowedValues: [12], // 6v6
        mustBeEven: true,
        fixed: 12,
      };
    case "beach_volley":
      return {
        min: 4,
        max: 8,
        allowedValues: [4, 6, 8], // 2v2, 3v3, 4v4
        mustBeEven: true,
      };
    case "beach_tennis":
      return {
        min: 2,
        max: 4,
        allowedValues: [2, 4], // 1v1, 2v2
        mustBeEven: true,
      };
    case "tennis":
      return {
        min: 2,
        max: 4,
        allowedValues: [2, 4], // 1v1, 2v2
        mustBeEven: true,
      };
    case "padel":
      return {
        min: 2,
        max: 4,
        allowedValues: [2, 4], // 1v1, 2v2
        mustBeEven: true,
      };
    case "calcio":
      return {
        min: 22,
        max: 22,
        allowedValues: [22], // 11v11
        mustBeEven: true,
        fixed: 22,
      };
    case "calcetto":
      return {
        min: 10,
        max: 10,
        allowedValues: [10], // 5v5
        mustBeEven: true,
        fixed: 10,
      };
    case "calciotto":
      return {
        min: 16,
        max: 16,
        allowedValues: [16], // 8v8
        mustBeEven: true,
        fixed: 16,
      };
    case "calcio_a_7":
      return {
        min: 14,
        max: 14,
        allowedValues: [14], // 7v7
        mustBeEven: true,
        fixed: 14,
      };
    case "basket":
      return {
        min: 4,
        max: 10,
        allowedValues: [4, 6, 8, 10], // 2v2, 3v3, 4v4, 5v5
        mustBeEven: true,
      };
    default:
      // Default fallback
      return {
        min: 2,
        max: 8,
        allowedValues: [2, 4, 6, 8],
        mustBeEven: true,
      };
  }
}

/**
 * Valida se maxPlayers è valido per il tipo di sport
 */
export function validateMaxPlayersForSport(
  maxPlayers: number,
  sport: SportType
): { valid: boolean; error?: string } {
  const rules = getMaxPlayersRulesForSport(sport);

  // Controlla se è un valore fisso (es. volley = 10)
  if (rules.fixed !== undefined) {
    if (maxPlayers !== rules.fixed) {
      return {
        valid: false,
        error: `${getSportDisplayName(sport)} richiede esattamente ${rules.fixed} giocatori (${getTeamFormationLabel(rules.fixed, sport)})`,
      };
    }
    return { valid: true };
  }

  // Controlla range min/max
  if (maxPlayers < rules.min || maxPlayers > rules.max) {
    return {
      valid: false,
      error: `${getSportDisplayName(sport)} richiede tra ${rules.min} e ${rules.max} giocatori`,
    };
  }

  // Controlla se deve essere pari
  if (rules.mustBeEven && maxPlayers % 2 !== 0) {
    return {
      valid: false,
      error: "Il numero di giocatori deve essere pari per formare i team",
    };
  }

  // Controlla se è tra i valori permessi
  if (!rules.allowedValues.includes(maxPlayers)) {
    return {
      valid: false,
      error: `Valori permessi per ${getSportDisplayName(sport)}: ${rules.allowedValues.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Restituisce l'etichetta della formazione (es. "2v2", "5v5")
 */
export function getTeamFormationLabel(maxPlayers: number, sport?: SportType): string {
  const playersPerTeam = Math.floor(maxPlayers / 2);
  return `${playersPerTeam}v${playersPerTeam}`;
}

/**
 * Restituisce il nome visualizzato dello sport
 */
export function getSportDisplayName(sport: SportType): string {
  switch (sport) {
    case "volley":
      return "Volley";
    case "beach_volley":
      return "Beach Volley";
    case "beach_tennis":
      return "Beach Tennis";
    case "tennis":
      return "Tennis";
    case "padel":
      return "Padel";
    case "calcio":
      return "Calcio";
    case "calcetto":
      return "Calcetto";
    case "calciotto":
      return "Calciotto";
    case "calcio_a_7":
      return "Calcio a 7";
    case "basket":
      return "Basket";
    default:
      return sport;
  }
}

/**
 * Restituisce il maxPlayers di default consigliato per un tipo di sport
 */
export function getDefaultMaxPlayersForSport(sport: SportType): number {
  const rules = getMaxPlayersRulesForSport(sport);
  
  // Se c'è un valore fisso, usa quello
  if (rules.fixed !== undefined) {
    return rules.fixed;
  }
  
  // Altrimenti usa il massimo consentito
  return rules.max;
}

/**
 * Calcola quanti giocatori per team
 */
export function getPlayersPerTeam(maxPlayers: number): number {
  return Math.floor(maxPlayers / 2);
}

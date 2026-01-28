/**
 * Regole e validazioni per i partecipanti alle partite basate sul tipo di sport
 * Frontend version
 */

export type SportType = "Beach Volley" | "volley";

export interface MaxPlayersRules {
  min: number;
  max: number;
  allowedValues: number[];
  mustBeEven: boolean;
  fixed?: number;
}

/**
 * Restituisce le regole per maxPlayers basate sul tipo di sport
 */
export function getMaxPlayersRulesForSport(sport: SportType): MaxPlayersRules {
  switch (sport) {
    case "Beach Volley":
      return {
        min: 4,
        max: 8,
        allowedValues: [4, 6, 8], // 2v2, 3v3, 4v4
        mustBeEven: true,
      };
    case "volley":
      return {
        min: 10,
        max: 10,
        allowedValues: [10], // Solo 5v5
        mustBeEven: true,
        fixed: 10,
      };
    default:
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

  if (rules.fixed !== undefined) {
    if (maxPlayers !== rules.fixed) {
      return {
        valid: false,
        error: `${getSportDisplayName(sport)} richiede esattamente ${rules.fixed} giocatori (${getTeamFormationLabel(rules.fixed, sport)})`,
      };
    }
    return { valid: true };
  }

  if (maxPlayers < rules.min || maxPlayers > rules.max) {
    return {
      valid: false,
      error: `${getSportDisplayName(sport)} richiede tra ${rules.min} e ${rules.max} giocatori`,
    };
  }

  if (rules.mustBeEven && maxPlayers % 2 !== 0) {
    return {
      valid: false,
      error: "Il numero di giocatori deve essere pari per formare i team",
    };
  }

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
    case "beach_volley":
      return "Beach Volley";
    case "volley":
      return "Volley";
    default:
      return sport;
  }
}

/**
 * Restituisce il maxPlayers di default consigliato per un tipo di sport
 */
export function getDefaultMaxPlayersForSport(sport: SportType): number {
  const rules = getMaxPlayersRulesForSport(sport);
  
  if (rules.fixed !== undefined) {
    return rules.fixed;
  }
  
  return rules.max;
}

/**
 * Calcola quanti giocatori per team
 */
export function getPlayersPerTeam(maxPlayers: number): number {
  return Math.floor(maxPlayers / 2);
}

/**
 * Restituisce l'emoji per il tipo di sport
 */
export function getSportEmoji(sport: SportType): string {
  switch (sport) {
    case "beach_volley":
      return "🏐";
    case "volley":
      return "🏐";
    default:
      return "⚽";
  }
}

/**
 * Seed per popolare la collezione Sport con gli 8 sport supportati
 */
import mongoose from "mongoose";
import Sport from "../models/Sport";

export const SPORTS_DATA = [
  {
    name: "Volley",
    code: "volley",
    icon: "volleyball",
    color: "#F44336",
    minPlayers: 12,
    maxPlayers: 12,
    allowedFormations: ["6v6"],
    requiresEvenPlayers: true,
    allowsIndoor: true,
    allowsOutdoor: true,
    recommendedSurfaces: {
      indoor: ["pvc"],
      outdoor: ["cement"],
    },
    allowsPlayerPricing: false,
    scoringSystem: "set-based",
    scoringRules: {
      setsToWin: 2, // Best of 3
      pointsPerSet: 25,
      tiebreakAdvantage: 2, // +2 sul 24-24
    },
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Beach Volley",
    code: "beach_volley",
    icon: "beach",
    color: "#FF9800",
    minPlayers: 4,
    maxPlayers: 8,
    allowedFormations: ["2v2", "3v3", "4v4"],
    requiresEvenPlayers: true,
    allowsIndoor: true,
    allowsOutdoor: true,
    recommendedSurfaces: {
      any: ["sand"], // Sabbia sia indoor che outdoor
    },
    allowsPlayerPricing: true, // Piccoli gruppi, permette split costi
    scoringSystem: "set-based",
    scoringRules: {
      setsToWin: 2, // Best of 3
      pointsPerSet: 21,
      tiebreakAdvantage: 2, // +2 sul 20-20
    },
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "Beach Tennis",
    code: "beach_tennis",
    icon: "tennis",
    color: "#FFC107",
    minPlayers: 2,
    maxPlayers: 4,
    allowedFormations: ["1v1", "2v2"],
    requiresEvenPlayers: true,
    allowsIndoor: true,
    allowsOutdoor: true,
    recommendedSurfaces: {
      any: ["sand"], // Sabbia sia indoor che outdoor
    },
    allowsPlayerPricing: true, // Piccoli gruppi
    scoringSystem: "game-based",
    scoringRules: {
      gamesToWin: 7, // Può essere 7 o 9
      tiebreakPoints: 7,
    },
    isActive: true,
    sortOrder: 3,
  },
  {
    name: "Tennis",
    code: "tennis",
    icon: "tennis",
    color: "#009688",
    minPlayers: 2,
    maxPlayers: 4,
    allowedFormations: ["1v1", "2v2"],
    requiresEvenPlayers: true,
    allowsIndoor: true,
    allowsOutdoor: true,
    recommendedSurfaces: {
      indoor: ["grass", "clay", "cement"],
      outdoor: ["grass", "clay", "cement"],
    },
    allowsPlayerPricing: true, // Piccoli gruppi
    scoringSystem: "set-based",
    scoringRules: {
      setsToWin: 2, // Best of 3
      pointsPerSet: 6, // 6 giochi per set
      tiebreakAdvantage: 2, // +2 nel tiebreak
    },
    isActive: true,
    sortOrder: 4,
  },
  {
    name: "Padel",
    code: "padel",
    icon: "tennis",
    color: "#00BCD4",
    minPlayers: 2,
    maxPlayers: 4,
    allowedFormations: ["1v1", "2v2"],
    requiresEvenPlayers: true,
    allowsIndoor: true,
    allowsOutdoor: true,
    recommendedSurfaces: {
      indoor: ["synthetic"],
      outdoor: ["synthetic"],
    },
    allowsPlayerPricing: true, // Piccoli gruppi
    scoringSystem: "set-based",
    scoringRules: {
      setsToWin: 2, // Best of 3
      pointsPerSet: 6, // 6 giochi per set
      tiebreakAdvantage: 2, // +2 nel tiebreak
    },
    isActive: true,
    sortOrder: 5,
  },
  {
    name: "Calcio",
    code: "calcio",
    icon: "soccer",
    color: "#4CAF50",
    minPlayers: 22,
    maxPlayers: 22,
    allowedFormations: ["11v11"],
    requiresEvenPlayers: true,
    allowsIndoor: false,
    allowsOutdoor: true,
    recommendedSurfaces: {
      outdoor: ["grass", "synthetic", "clay"],
    },
    allowsPlayerPricing: false,
    scoringSystem: "point-based",
    scoringRules: {
      allowsDraw: true,
    },
    isActive: true,
    sortOrder: 6,
  },
  {
    name: "Calcetto",
    code: "calcetto",
    icon: "soccer",
    color: "#8BC34A",
    minPlayers: 10,
    maxPlayers: 10,
    allowedFormations: ["5v5"],
    requiresEvenPlayers: true,
    allowsIndoor: true,
    allowsOutdoor: true,
    recommendedSurfaces: {
      indoor: ["synthetic"],
      outdoor: ["synthetic"],
    },
    allowsPlayerPricing: false,
    scoringSystem: "point-based",
    scoringRules: {
      allowsDraw: true,
    },
    isActive: true,
    sortOrder: 7,
  },
  {
    name: "Calciotto",
    code: "calciotto",
    icon: "soccer",
    color: "#66BB6A",
    minPlayers: 16,
    maxPlayers: 16,
    allowedFormations: ["8v8"],
    requiresEvenPlayers: true,
    allowsIndoor: true,
    allowsOutdoor: true,
    recommendedSurfaces: {
      indoor: ["synthetic"],
      outdoor: ["synthetic"],
    },
    allowsPlayerPricing: false,
    scoringSystem: "point-based",
    scoringRules: {
      allowsDraw: true,
    },
    isActive: true,
    sortOrder: 8,
  },
  {
    name: "Calcio a 7",
    code: "calcio_a_7",
    icon: "soccer",
    color: "#81C784",
    minPlayers: 14,
    maxPlayers: 14,
    allowedFormations: ["7v7"],
    requiresEvenPlayers: true,
    allowsIndoor: true,
    allowsOutdoor: true,
    recommendedSurfaces: {
      indoor: ["synthetic"],
      outdoor: ["synthetic"],
    },
    allowsPlayerPricing: false,
    scoringSystem: "point-based",
    scoringRules: {
      allowsDraw: true,
    },
    isActive: true,
    sortOrder: 9,
  },
  {
    name: "Basket",
    code: "basket",
    icon: "basketball",
    color: "#FF5722",
    minPlayers: 4,
    maxPlayers: 10,
    allowedFormations: ["2v2", "3v3", "4v4", "5v5"],
    requiresEvenPlayers: true,
    allowsIndoor: true,
    allowsOutdoor: true,
    recommendedSurfaces: {
      indoor: ["pvc"],
      outdoor: ["cement"],
    },
    allowsPlayerPricing: true, // Per formazioni piccole (2v2, 3v3)
    scoringSystem: "point-based",
    scoringRules: {
      allowsDraw: false, // Basket va a overtime se necessario
    },
    isActive: true,
    sortOrder: 10,
  },
];

/**
 * Popola la collezione Sport
 */
export async function seedSports() {
  console.log("\n🏀 Populating Sport collection...");

  // Elimina sport esistenti
  await Sport.deleteMany({});

  // Crea i nuovi sport
  const sports = await Sport.insertMany(SPORTS_DATA);

  console.log(`✅ Created ${sports.length} sports:`);
  sports.forEach((sport) => {
    console.log(`   - ${sport.name} (${sport.code})`);
  });

  return sports;
}

/**
 * Ottiene un mapping sport code -> ObjectId per facilitare i seed successivi
 */
export async function getSportMapping(): Promise<Record<string, mongoose.Types.ObjectId>> {
  const sports = await Sport.find({});
  const mapping: Record<string, mongoose.Types.ObjectId> = {};

  sports.forEach((sport) => {
    mapping[sport.code] = sport._id;
  });

  return mapping;
}

/**
 * Ottiene uno sport casuale per l'ambiente specificato
 */
export async function getRandomSportForEnvironment(
  isIndoor: boolean,
  sportMapping: Record<string, mongoose.Types.ObjectId>
): Promise<{ id: mongoose.Types.ObjectId; code: string }> {
  const indoorSports = ["volley", "beach_volley", "beach_tennis", "tennis", "padel", "calcetto", "basket"];
  const outdoorSports = [
    "volley",
    "beach_volley",
    "beach_tennis",
    "tennis",
    "padel",
    "calcio",
    "calcetto",
    "calciotto",
    "calcio_a_7",
    "basket",
  ];

  const availableSports = isIndoor ? indoorSports : outdoorSports;
  const randomCode = availableSports[Math.floor(Math.random() * availableSports.length)];

  return {
    id: sportMapping[randomCode],
    code: randomCode,
  };
}

/**
 * Ottiene la superficie raccomandata per uno sport specifico
 */
export function getRecommendedSurfaceForSport(sportCode: string, isIndoor: boolean): string {
  const sportData = SPORTS_DATA.find((s) => s.code === sportCode);
  if (!sportData || !sportData.recommendedSurfaces) return "cement";

  const surfaces = sportData.recommendedSurfaces;

  // Se ha "any", usa quello
  if (surfaces.any && surfaces.any.length > 0) {
    return surfaces.any[0];
  }

  // Altrimenti usa indoor/outdoor
  if (isIndoor && surfaces.indoor && surfaces.indoor.length > 0) {
    return surfaces.indoor[0];
  }

  if (!isIndoor && surfaces.outdoor && surfaces.outdoor.length > 0) {
    return surfaces.outdoor[0];
  }

  return "cement";
}

/**
 * Ottiene maxPlayers per uno sport
 */
export function getMaxPlayersForSport(sportCode: string): number {
  const sportData = SPORTS_DATA.find((s) => s.code === sportCode);
  return sportData?.maxPlayers ?? 8;
}

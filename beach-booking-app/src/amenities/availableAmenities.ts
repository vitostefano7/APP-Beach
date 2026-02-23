
export type AmenityIconFamily = "Ionicons" | "FontAwesome5" | "MaterialCommunityIcons";

export type AmenityIcon =
  | string
  | {
      family: AmenityIconFamily;
      name: string;
    };

export interface AmenityDefinition {
  key: string;
  label: string;
  icon: AmenityIcon;
}

export const AVAILABLE_AMENITIES: AmenityDefinition[] = [
  { key: "toilets", label: "Bagni", icon: { family: "FontAwesome5", name: "toilet" } },
  { key: "lockerRoom", label: "Spogliatoi", icon: { family: "FontAwesome5", name: "restroom" }},
  { key: "showers", label: "Docce", icon: { family: "FontAwesome5", name: "shower" } },
  { key: "parking", label: "Parcheggio", icon: { family: "FontAwesome5", name: "parking" } },
  { key: "restaurant", label: "Ristorante", icon: "restaurant" },
  { key: "bar", label: "Bar/Caffè", icon: "cafe" },
  { key: "wifi", label: "WiFi", icon: "wifi" },
  { key: "airConditioning", label: "Aria condizionata", icon: "snow" },
  { key: "lighting", label: "Illuminazione notturna", icon: "bulb" },
  { key: "gym", label: "Palestra", icon: "barbell" },
  { key: "store", label: "Negozio sportivo", icon: { family: "FontAwesome5", name: "shopping-cart" } },
  { key: "firstAid", label: "Pronto soccorso", icon: { family: "FontAwesome5", name: "first-aid" } },
  { key: "locker", label: "Armadietti", icon: { family: "FontAwesome5", name: "lock" } },
  { key: "disabledAccess", label: "Accesso disabili", icon: { family: "FontAwesome5", name: "accessible-icon" } },
  { key: "disabledParking", label: "Parcheggio disabili", icon: { family: "FontAwesome5", name: "parking" } },
  { key: "defibrillator", label: "Defibrillatore", icon: { family: "FontAwesome5", name: "heartbeat" } },
  { key: "relaxArea", label: "Area relax", icon: { family: "FontAwesome5", name: "couch" } },
  { key: "equipmentRental", label: "Noleggio attrezzatura", icon: { family: "FontAwesome5", name: "money-bill" } },
  { key: "equipmentStorage", label: "Deposito attrezzatura", icon: { family: "FontAwesome5", name: "cube" } },
  { key: "coachService", label: "Allenatore/Istruttore", icon: { family: "FontAwesome5", name: "user" } },
  { key: "courses", label: "Corsi sportivi", icon: { family: "FontAwesome5", name: "school" } },
  { key: "tournaments", label: "Tornei/Eventi", icon: { family: "FontAwesome5", name: "trophy" } },
  { key: "scoreboard", label: "Tabellone segnapunti", icon: { family: "FontAwesome5", name: "chart-bar" } },
  { key: "coworking", label: "Area coworking", icon: { family: "FontAwesome5", name: "laptop" } },
  { key: "kidsArea", label: "Area bambini", icon: { family: "FontAwesome5", name: "child" } },
  { key: "bikeParking", label: "Parcheggio bici", icon: { family: "FontAwesome5", name: "bicycle" } },
  { key: "chargingStation", label: "Ricarica auto elettriche", icon: "flash" },
  { key: "spa", label: "SPA", icon: { family: "FontAwesome5", name: "spa" } },
  { key: "sauna", label: "Sauna", icon: "flame" },
  { key: "turkishBath", label: "Bagno turco", icon: "water" },
  { key: "massage", label: "Massaggi", icon: "hand-left" },
];

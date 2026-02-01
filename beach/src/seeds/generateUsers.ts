// seeds/generateUsers.ts - Generazione utenti
import bcrypt from "bcrypt";
import User from "../models/User";
import PlayerProfile from "../models/PlayerProfile";
import UserPreferences from "../models/UserPreferences";
import { DEFAULT_PASSWORD, SALT_ROUNDS, randomElement, CITIES } from "./config";
import fs from "fs";
import path from "path";

export async function generateUsers(avatarUrls: string[]) {
  const password = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // Leggi utenti statici
  const utentiPath = path.join(__dirname, "utenti_statici.json");
  const ownerPath = path.join(__dirname, "owner_statici.json");
  const utenti: any[] = JSON.parse(fs.readFileSync(utentiPath, "utf-8"));
  const owners: any[] = JSON.parse(fs.readFileSync(ownerPath, "utf-8"));

  // Gli utenti statici ora possono avere già tutti i campi (incluso role, location, ecc.)
  const usersData: any[] = [...utenti, ...owners];

  const numPlayers = utenti.filter(u => u.role === "player").length;
  const numOwners = owners.length;
  console.log(`\n👥 Generazione ${numPlayers} player e ${numOwners} owner...`);

  // Popola solo i campi forniti (name, surname, username, email, role)
  const users = await User.insertMany(
    usersData.map((u, index) => ({
      ...u,
      password: u.password || password,
      isActive: typeof u.isActive !== "undefined" ? u.isActive : true,
      avatarUrl: u.avatarUrl || (avatarUrls.length ? avatarUrls[index % avatarUrls.length] : undefined),
    })),
    { lean: true }
  );

  const players = users.filter((u: any) => u.role === "player");
  const ownersList = users.filter((u: any) => u.role === "owner");

  console.log(`✅ Creati ${users.length} utenti (${players.length} player, ${ownersList.length} owner)`);
  // Non generare profili o preferenze random
  console.log('USERS OK');

  // Crea UserPreferences per ogni utente player con città preferita basata su location
  const cityMapping: { [key: string]: string } = {
    "12.4964,41.9028": "Roma",
    "9.1900,45.4642": "Milano",
    "14.2681,40.8518": "Napoli",
    "7.6869,45.0703": "Torino",
    "13.3615,38.1157": "Palermo",
    "8.9463,44.4056": "Genova",
    "11.3426,44.4949": "Bologna",
    "11.2558,43.7696": "Firenze",
    "12.3155,45.4408": "Venezia",
    "16.8719,41.1171": "Bari",
    "15.0830,37.5079": "Catania",
    "10.9916,45.4384": "Verona",
    "15.5540,38.1938": "Messina",
    "11.8768,45.4064": "Padova",
    "13.7768,45.6495": "Trieste",
  };

  // Lista di città italiane per playHistory casuale
  const italianCities = ["Milano", "Roma", "Napoli", "Torino", "Palermo", "Genova", "Bologna", "Firenze"];

  for (const user of players) {
    const coordsKey = `${user.location.coordinates[0]},${user.location.coordinates[1]}`;
    const city = cityMapping[coordsKey] || "Roma";
    
    // 🆕 Genera playHistory casuale (storia partite per città)
    const playHistory = new Map<string, number>();
    const numCitiesPlayed = Math.floor(Math.random() * 3) + 1; // 1-3 città
    
    // Aggiungi la città principale con più partite
    playHistory.set(city, Math.floor(Math.random() * 10) + 5); // 5-15 partite
    
    // Aggiungi altre città casuali con meno partite
    const otherCities = italianCities.filter(c => c !== city);
    for (let i = 0; i < numCitiesPlayed - 1 && i < otherCities.length; i++) {
      const randomCity = otherCities[Math.floor(Math.random() * otherCities.length)];
      if (!playHistory.has(randomCity)) {
        playHistory.set(randomCity, Math.floor(Math.random() * 5) + 1); // 1-5 partite
      }
    }
    
    // Trova città più giocata per suggestedCity
    const mostPlayedCity = Array.from(playHistory.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    // Converti Map in oggetto plain per Mongoose
    const playHistoryObj = Object.fromEntries(playHistory);
    
    await UserPreferences.create({
      user: user._id,
      preferredLocation: {
        city,
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
        radius: 30,
        // 🆕 Città suggerita automaticamente (calcolata da playHistory)
        suggestedCity: mostPlayedCity,
        suggestedLat: user.location.coordinates[1],
        suggestedLng: user.location.coordinates[0],
        suggestedUpdatedAt: new Date(),
      },
      // 🆕 Storia partite per città (convertita da Map a oggetto)
      playHistory: playHistoryObj,
      lastVisitedCity: city,
      pushNotifications: false,
      darkMode: false,
    });
  }

  console.log('✅ USER PREFERENCES OK (con playHistory e città suggerita)');

  return { users, players, owners: ownersList };
}

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
  return { users, players, owners: ownersList };
}

// seeds/generateFollowers.ts
import StrutturaFollower from "../models/StrutturaFollower";
import UserFollower from "../models/UserFollower";
import { randomInt, randomElement } from "./config";

export async function generateFollowers(users: any[], strutture: any[]) {
  console.log(`👥 Creazione relazioni StrutturaFollower (utenti che seguono strutture)...`);

  const strutturaFollowersData = [];
  for (const user of users) {
    const numFollow = randomInt(2, 10);
    const shuffled = [...strutture].sort(() => 0.5 - Math.random());
    for (let i = 0; i < numFollow; i++) {
      strutturaFollowersData.push({
        user: user._id,
        struttura: shuffled[i]._id,
        status: "active",
      });
    }
  }

  const strutturaFollowers = await StrutturaFollower.insertMany(strutturaFollowersData);
  console.log(`✅ ${strutturaFollowers.length} StrutturaFollower creati`);

  console.log(`👥 Creazione relazioni UserFollower (strutture che seguono utenti)...`);
  const userFollowersData = [];
  
  // Ogni struttura segue alcuni utenti (clienti abituali)
  for (const struttura of strutture) {
    const numFollow = randomInt(10, 30);
    const shuffled = [...users].sort(() => 0.5 - Math.random());

    for (let i = 0; i < numFollow && i < shuffled.length; i++) {
      userFollowersData.push({
        struttura: struttura._id,
        user: shuffled[i]._id,
        status: "active",
      });
    }
  }

  const userFollowers = await UserFollower.insertMany(userFollowersData);
  console.log(`✅ ${userFollowers.length} UserFollower creati`);

  return { strutturaFollowers, userFollowers };
}

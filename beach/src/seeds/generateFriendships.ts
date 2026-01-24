// seeds/generateFriendships.ts
import Friendship from "../models/Friendship";
import { randomInt, randomElement } from "./config";

export async function generateFriendships(players: any[]) {
  console.log(`🤝 Creazione amicizie tra giocatori...`);

  const friendshipsData = [];
  const friendshipSet = new Set<string>();

  for (const player of players) {
    const numFriends = randomInt(5, 15);
    const shuffled = [...players]
      .filter((p) => p._id.toString() !== player._id.toString())
      .sort(() => 0.5 - Math.random());

    for (let i = 0; i < numFriends && i < shuffled.length; i++) {
      const friend = shuffled[i];
      const key1 = `${player._id}-${friend._id}`;
      const key2 = `${friend._id}-${player._id}`;

      // Avoid duplicates
      if (friendshipSet.has(key1) || friendshipSet.has(key2)) continue;

      friendshipsData.push({
        requester: player._id,
        recipient: friend._id,
        status: randomElement(["accepted", "accepted", "accepted", "pending"]), // 75% accepted
      });

      friendshipSet.add(key1);
    }
  }

  const friendships = await Friendship.insertMany(friendshipsData);
  console.log(`✅ ${friendships.length} amicizie create`);

  return friendships;
}

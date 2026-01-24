// seeds/generateConversations.ts
import Conversation from "../models/Conversazione";
import Message from "../models/Message";
import { randomInt, randomElement } from "./config";

export async function generateConversations(users: any[], strutture: any[], matches: any[]) {
  console.log(`💬 Creazione conversazioni...`);

  const conversationsData = [];
  const messagesData = [];

  // Get players and owners separately
  const players = users.filter((u: any) => u.ruolo === "player");
  const owners = users.filter((u: any) => u.ruolo === "owner");

  // DIRECT CONVERSATIONS (Player ↔ Owner about a struttura)
  const numDirectConversations = Math.min(Math.floor(players.length * 0.2), strutture.length * 3);
  for (let i = 0; i < numDirectConversations; i++) {
    const player = randomElement(players);
    const struttura = randomElement(strutture);
    const owner = owners.find((o: any) => o._id.equals(struttura.owner));

    if (!owner) continue;

    const conversationId = new (require("mongoose").Types.ObjectId)();
    conversationsData.push({
      _id: conversationId,
      type: 'direct',
      user: player._id,
      struttura: struttura._id,
      owner: owner._id,
      participants: [player._id, owner._id],
      lastMessage: 'Info prenotazione',
      lastMessageAt: new Date(),
      unreadByUser: randomInt(0, 3),
      unreadByOwner: randomInt(0, 2),
    });

    // Add messages
    const numMessages = randomInt(3, 12);
    for (let m = 0; m < numMessages; m++) {
      const sender = randomElement([player, owner]);
      const senderType = sender._id.equals(player._id) ? 'user' : 'owner';
      messagesData.push({
        conversationId: conversationId,
        sender: sender._id,
        senderType: senderType,
        content: `Messaggio ${m + 1} riguardo ${struttura.nome}`,
        read: false,
        createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
      });
    }
  }

  // GROUP CONVERSATIONS (Match chats)
  const matchesWithPlayers = matches.filter((m: any) => m.players && m.players.length >= 2);
  const numGroupConversations = Math.min(matchesWithPlayers.length, 50);
  
  // Create unique set of matches to avoid duplicates
  const selectedMatches = [...matchesWithPlayers]
    .sort(() => 0.5 - Math.random())
    .slice(0, numGroupConversations);

  for (let i = 0; i < selectedMatches.length; i++) {
    const match = selectedMatches[i];
    
    // Get participants from match.players
    const participants = match.players?.map((p: any) => p.user) || [];
    if (participants.length < 2) continue;

    const conversationId = new (require("mongoose").Types.ObjectId)();
    conversationsData.push({
      _id: conversationId,
      type: 'group',
      participants,
      match: match._id,
      groupName: `Partita ${i + 1}`,
      lastMessage: 'Ci vediamo al campo!',
      lastMessageAt: new Date(),
      unreadCount: participants.reduce((acc: any, p: any) => {
        acc[p.toString()] = randomInt(0, 5);
        return acc;
      }, {}),
    });

    // Add group messages
    const numMessages = randomInt(5, 20);
    for (let m = 0; m < numMessages; m++) {
      const sender = randomElement(participants);
      // Get the user to determine senderType
      const senderUser = users.find((u: any) => u._id.equals(sender));
      const senderType = senderUser?.ruolo === 'owner' ? 'owner' : 'user';
      
      messagesData.push({
        conversationId: conversationId,
        sender: sender,
        senderType: senderType,
        content: `Messaggio gruppo ${m + 1}`,
        read: randomInt(0, 1) === 1,
        createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
      });
    }
  }

  const conversations = await Conversation.insertMany(conversationsData);
  console.log(`✅ ${conversations.length} conversazioni create`);

  const messages = await Message.insertMany(messagesData);
  console.log(`✅ ${messages.length} messaggi creati`);

  return { conversations, messages };
}

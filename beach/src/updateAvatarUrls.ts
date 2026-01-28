// Script per aggiornare avatarUrl degli utenti di test
// Esegui con: npx ts-node updateAvatarUrls.ts

import mongoose from 'mongoose';
import User from './models/user';

const MONGO_URI = 'mongodb://localhost:27017/tuo_database'; // Cambia con la tua connessione

const updates = [
  {
    email: 'luca@test.it',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    email: 'mario@test.it',
    avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
  {
    email: 'francesca@test.it',
    avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
];

async function main() {
  await mongoose.connect(MONGO_URI);
  for (const u of updates) {
    const res = await User.findOneAndUpdate(
      { email: u.email },
      { avatarUrl: u.avatarUrl },
      { new: true }
    );
    console.log('Aggiornato:', res?.email, res?.avatarUrl);
  }
  await mongoose.disconnect();
}

main().catch(console.error);

import mongoose from 'mongoose';
import Conversation from './models/Conversazione';
import dotenv from 'dotenv';

dotenv.config();

async function fixConversationTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beach');
    console.log('✅ Connesso a MongoDB');

    // Aggiorna tutte le conversazioni che NON hanno un campo match e non hanno type='direct'
    const result = await Conversation.updateMany(
      {
        match: { $exists: false },
        $or: [
          { type: { $exists: false } },
          { type: { $ne: 'direct' } }
        ]
      },
      {
        $set: { type: 'direct' }
      }
    );

    console.log(`✅ Aggiornate ${result.modifiedCount} conversazioni dirette`);

    // Aggiorna tutte le conversazioni che HANNO un campo match
    const result2 = await Conversation.updateMany(
      {
        match: { $exists: true },
        $or: [
          { type: { $exists: false } },
          { type: { $ne: 'group' } }
        ]
      },
      {
        $set: { type: 'group' }
      }
    );

    console.log(`✅ Aggiornate ${result2.modifiedCount} conversazioni di gruppo`);

    // Mostra un riepilogo
    const direct = await Conversation.countDocuments({ type: 'direct' });
    const group = await Conversation.countDocuments({ type: 'group' });
    
    console.log(`\n📊 Riepilogo:`);
    console.log(`   - Conversazioni dirette: ${direct}`);
    console.log(`   - Conversazioni di gruppo: ${group}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnesso da MongoDB');
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

fixConversationTypes();

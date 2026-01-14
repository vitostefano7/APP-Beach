import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/beach';

async function fixConversationIndex() {
  try {
    console.log('🔌 Connessione a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connesso a MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const conversationsCollection = db.collection('conversations');

    // Lista degli indici esistenti
    console.log('📋 Indici esistenti:');
    const indexes = await conversationsCollection.indexes();
    indexes.forEach((index) => {
      console.log(' -', JSON.stringify(index));
    });

    // Rimuovi l'indice problematico se esiste
    try {
      console.log('\n🗑️  Rimozione indice type_1_match_1...');
      await conversationsCollection.dropIndex('type_1_match_1');
      console.log('✅ Indice rimosso');
    } catch (error: any) {
      if (error.code === 27) {
        console.log('⚠️  Indice non trovato (già rimosso)');
      } else {
        throw error;
      }
    }

    // Ricrea l'indice corretto
    console.log('\n🔨 Creazione nuovo indice con partialFilterExpression...');
    await conversationsCollection.createIndex(
      { type: 1, match: 1 },
      {
        unique: true,
        partialFilterExpression: { 
          type: 'group', 
          match: { $exists: true }
        },
        name: 'type_1_match_1'
      }
    );
    console.log('✅ Nuovo indice creato');

    // Mostra gli indici finali
    console.log('\n📋 Indici finali:');
    const finalIndexes = await conversationsCollection.indexes();
    finalIndexes.forEach((index) => {
      console.log(' -', JSON.stringify(index));
    });

    console.log('\n✅ Operazione completata con successo!');
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnesso da MongoDB');
    process.exit(0);
  }
}

fixConversationIndex();

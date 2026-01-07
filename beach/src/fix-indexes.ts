import mongoose from 'mongoose';
import Conversazione from './models/Conversazione';

async function fixIndexes() {
  try {
    await mongoose.connect('mongodb://admin:adminpass@localhost:27017/beach?authSource=admin');
    console.log('✅ Connesso a MongoDB');

    const collection = mongoose.connection.collection('conversations');
    
    // Lista gli index attuali
    const indexes = await collection.indexes();
    console.log('📋 Index attuali:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Rimuovi il vecchio index problematico se esiste
    try {
      await collection.dropIndex('user_1_struttura_1');
      console.log('✅ Rimosso vecchio index user_1_struttura_1');
    } catch (e: any) {
      if (e.code === 27) {
        console.log('ℹ️  Index user_1_struttura_1 non esiste (già rimosso)');
      } else {
        console.log('⚠️  Errore rimozione index:', e.message);
      }
    }

    // Forza la ricreazione degli index dal modello
    await Conversazione.syncIndexes();
    console.log('✅ Index ricreati dal modello');

    // Lista gli index finali
    const finalIndexes = await collection.indexes();
    console.log('\n📋 Index finali:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key), 
                  idx.unique ? '(unique)' : '',
                  idx.partialFilterExpression ? `(partial: ${JSON.stringify(idx.partialFilterExpression)})` : '');
    });

    console.log('\n✅ Fix completato!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

fixIndexes();

/**
 * 🧪 Utility per aggiornare playHistory degli utenti
 * Può essere chiamata manualmente o da un webhook dopo ogni prenotazione completata
 */

import UserPreferences from '../models/UserPreferences';
import Booking from '../models/Booking';
import Struttura from '../models/Strutture';

/**
 * Aggiorna playHistory quando una prenotazione viene completata
 */
export async function updatePlayHistoryForBooking(userId: string, strutturaId: string) {
  try {
    console.log('📊 Aggiornamento playHistory per:', { userId, strutturaId });
    
    // Ottieni struttura per recuperare la città
    const struttura = await Struttura.findById(strutturaId);
    if (!struttura) {
      console.log('⚠️ Struttura non trovata');
      return;
    }
    
    const city = struttura.location.city;
    console.log('🏙️ Città struttura:', city);
    
    // Trova o crea preferenze utente
    let preferences = await UserPreferences.findOne({ user: userId });
    if (!preferences) {
      preferences = new UserPreferences({ user: userId });
    }
    
    // Inizializza playHistory se non esiste
    if (!preferences.playHistory) {
      preferences.playHistory = new Map();
    }
    
    // Incrementa contatore per questa città
    const currentCount = preferences.playHistory.get(city) || 0;
    preferences.playHistory.set(city, currentCount + 1);
    
    // Aggiorna lastVisitedCity
    preferences.lastVisitedCity = city;
    
    await preferences.save();
    
    console.log('✅ PlayHistory aggiornato:', {
      city,
      newCount: currentCount + 1,
      totalHistory: Object.fromEntries(preferences.playHistory)
    });
    
    // Ricalcola città suggerita se necessario
    await recalculateSuggestedCity(preferences);
    
  } catch (error) {
    console.error('❌ Errore aggiornamento playHistory:', error);
  }
}

/**
 * Ricalcola città suggerita basandosi sul playHistory
 */
async function recalculateSuggestedCity(preferences: any) {
  const playHistory = preferences.playHistory;
  
  if (!playHistory || playHistory.size === 0) {
    console.log('⚠️ Nessun playHistory disponibile');
    return;
  }
  
  // Converti Map in array e trova città con più partite
  const historyArray = Array.from(playHistory.entries());
  const mostPlayedCity = historyArray.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  console.log('🎯 Città più giocata:', mostPlayedCity, 'partite:', playHistory.get(mostPlayedCity));
  
  // Geocoding per ottenere coordinate
  try {
    const geocodeUrl = 
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(mostPlayedCity)},Italia&` +
      `format=json&limit=1`;
    
    const geocodeRes = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'SportBookingApp/1.0' },
    });
    
    const geocodeData = await geocodeRes.json();
    
    if (geocodeData && geocodeData.length > 0) {
      const lat = parseFloat(geocodeData[0].lat);
      const lng = parseFloat(geocodeData[0].lon);
      
      // Aggiorna città suggerita solo se diversa
      if (!preferences.preferredLocation) {
        preferences.preferredLocation = {};
      }
      
      preferences.preferredLocation.suggestedCity = mostPlayedCity;
      preferences.preferredLocation.suggestedLat = lat;
      preferences.preferredLocation.suggestedLng = lng;
      preferences.preferredLocation.suggestedUpdatedAt = new Date();
      
      await preferences.save();
      console.log('✅ Città suggerita aggiornata:', mostPlayedCity);
    }
  } catch (error) {
    console.error('❌ Errore geocoding:', error);
  }
}

/**
 * 🧪 SEED: Popola playHistory con dati di test
 */
export async function seedPlayHistory() {
  try {
    console.log('🌱 Inizio seed playHistory...');
    
    const users = await UserPreferences.find().populate('user');
    
    for (const userPref of users) {
      // Esempio: assegna storia casuale
      const testHistory = {
        'Milano': Math.floor(Math.random() * 10) + 1,
        'Roma': Math.floor(Math.random() * 5),
        'Napoli': Math.floor(Math.random() * 3),
      };
      
      userPref.playHistory = new Map(Object.entries(testHistory));
      userPref.lastVisitedCity = 'Milano';
      
      await userPref.save();
      
      // Calcola città suggerita
      await recalculateSuggestedCity(userPref);
      
      console.log(`✅ PlayHistory seeded per user ${(userPref as any).user}:`, testHistory);
    }
    
    console.log('✅ Seed playHistory completato');
  } catch (error) {
    console.error('❌ Errore seed playHistory:', error);
  }
}

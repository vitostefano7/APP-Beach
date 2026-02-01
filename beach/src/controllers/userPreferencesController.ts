// controllers/userPreferencesController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import UserPreferences from '../models/UserPreferences';
import Struttura from '../models/Strutture';
import Campo from '../models/Campo';

/**
 * 🧠 Helper: Calcola città suggerita dal playHistory
 */
const calculateSuggestedCity = async (preferences: any) => {
  const playHistory = preferences.playHistory;
  
  // Se non c'è history, non fare nulla
  if (!playHistory || (playHistory instanceof Map ? playHistory.size === 0 : Object.keys(playHistory).length === 0)) {
    console.log('⚠️ [calculateSuggestedCity] Nessun playHistory disponibile');
    return;
  }
  
  // Converti Map in oggetto se necessario
  const historyObj = playHistory instanceof Map ? Object.fromEntries(playHistory) : playHistory;
  
  // Trova città con più partite
  const cities = Object.keys(historyObj);
  if (cities.length === 0) {
    console.log('⚠️ [calculateSuggestedCity] PlayHistory vuoto');
    return;
  }
  
  const mostPlayedCity = cities.reduce((a, b) => 
    historyObj[a] > historyObj[b] ? a : b
  );
  
  console.log('🎯 [calculateSuggestedCity] Città più giocata:', mostPlayedCity, 'partite:', historyObj[mostPlayedCity]);
  
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
      
      const needsUpdate = 
        preferences.preferredLocation.suggestedCity !== mostPlayedCity ||
        !preferences.preferredLocation.suggestedUpdatedAt ||
        (Date.now() - preferences.preferredLocation.suggestedUpdatedAt.getTime()) > 30 * 24 * 60 * 60 * 1000; // 30 giorni
      
      if (needsUpdate) {
        preferences.preferredLocation.suggestedCity = mostPlayedCity;
        preferences.preferredLocation.suggestedLat = lat;
        preferences.preferredLocation.suggestedLng = lng;
        preferences.preferredLocation.suggestedUpdatedAt = new Date();
        
        await preferences.save();
        console.log('✅ [calculateSuggestedCity] Città suggerita aggiornata:', mostPlayedCity);
      } else {
        console.log('ℹ️ [calculateSuggestedCity] Città suggerita già aggiornata');
      }
    }
  } catch (error) {
    console.error('❌ [calculateSuggestedCity] Errore geocoding:', error);
  }
};

/**
 * 📌 GET /users/preferences
 * Ottieni preferenze dell'utente loggato
 */
export const getUserPreferences = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📌 [getUserPreferences] Inizio:', { userId: req.user!.id });

    console.log('🔍 [getUserPreferences] Ricerca preferenze');
    let preferences = await UserPreferences.findOne({ user: req.user!.id });

    // Se non esistono, creale con valori default
    if (!preferences) {
      console.log('⚠️ [getUserPreferences] Preferenze non trovate, creo default');
      preferences = await UserPreferences.create({
        user: req.user!.id,
      });
    }
    
    // 🆕 Calcola città suggerita se necessario
    await calculateSuggestedCity(preferences);

    console.log('✅ [getUserPreferences] Preferenze recuperate');
    res.json(preferences);
  } catch (err) {
    console.error('❌ [getUserPreferences] Errore:', err);
    res.status(500).json({ message: 'Errore caricamento preferenze' });
  }
};

/**
 * 📌 PUT /users/preferences
 * Aggiorna preferenze generali
 */
export const updateUserPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const {
      pushNotifications,
      darkMode,
      privacyLevel,
      favoriteSports,
      preferredTimeSlot,
    } = req.body;

    console.log('📌 [updateUserPreferences] Inizio:', { userId: req.user!.id, body: req.body });

    console.log('🔍 [updateUserPreferences] Ricerca preferenze');
    let preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences) {
      console.log('⚠️ [updateUserPreferences] Preferenze non trovate, creo nuove');
      preferences = new UserPreferences({ user: req.user!.id });
    }

    // Aggiorna solo i campi forniti
    if (pushNotifications !== undefined) preferences.pushNotifications = pushNotifications;
    if (darkMode !== undefined) preferences.darkMode = darkMode;
    if (privacyLevel) preferences.privacyLevel = privacyLevel;
    if (favoriteSports) preferences.favoriteSports = favoriteSports;
    if (preferredTimeSlot !== undefined) preferences.preferredTimeSlot = preferredTimeSlot;

    console.log('💾 [updateUserPreferences] Salvataggio preferenze');
    await preferences.save();

    console.log('✅ [updateUserPreferences] Preferenze aggiornate');
    res.json({
      message: 'Preferenze aggiornate con successo',
      preferences,
    });
  } catch (err) {
    console.error('❌ [updateUserPreferences] Errore:', err);
    res.status(500).json({ message: 'Errore aggiornamento preferenze' });
  }
};

/**
 * 📌 PUT /users/preferences/location
 * Aggiorna location preferita
 */
export const updatePreferredLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { city, address, lat, lng, radius } = req.body;

    console.log('📌 [updatePreferredLocation] Inizio:', { userId: req.user!.id, city, lat, lng });

    if (!city || !lat || !lng) {
      console.log('⚠️ [updatePreferredLocation] Campi obbligatori mancanti');
      return res.status(400).json({
        message: 'City, lat e lng sono obbligatori',
      });
    }

    console.log('🔍 [updatePreferredLocation] Ricerca preferenze');
    let preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences) {
      console.log('⚠️ [updatePreferredLocation] Preferenze non trovate, creo nuove');
      preferences = new UserPreferences({ user: req.user!.id });
    }

    preferences.preferredLocation = {
      city,
      address,
      lat,
      lng,
      radius: radius || 10,
    };

    console.log('💾 [updatePreferredLocation] Salvataggio location');
    await preferences.save();

    console.log('✅ [updatePreferredLocation] Location aggiornata');
    res.json({
      message: 'Location preferita aggiornata',
      preferredLocation: preferences.preferredLocation,
    });
  } catch (err) {
    console.error('❌ [updatePreferredLocation] Errore:', err);
    res.status(500).json({ message: 'Errore aggiornamento location' });
  }
};

/**
 * 📌 POST /users/preferences/favorites/:strutturaId
 * Aggiungi struttura ai preferiti (stellina)
 */
export const addFavoriteStruttura = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId } = req.params;

    console.log('📌 [addFavoriteStruttura] Inizio:', { userId: req.user!.id, strutturaId });

    console.log('🔍 [addFavoriteStruttura] Verifica struttura');
    // Verifica che la struttura esista
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      isActive: true,
      isDeleted: false,
    });

    if (!struttura) {
      console.log('⚠️ [addFavoriteStruttura] Struttura non trovata');
      return res.status(404).json({ message: 'Struttura non trovata' });
    }

    console.log('🔍 [addFavoriteStruttura] Ricerca preferenze');
    let preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences) {
      console.log('⚠️ [addFavoriteStruttura] Preferenze non trovate, creo nuove');
      preferences = new UserPreferences({ user: req.user!.id });
    }

    // Aggiungi solo se non è già nei preferiti
    if (!preferences.favoriteStrutture.includes(strutturaId as any)) {
      console.log('➕ [addFavoriteStruttura] Aggiunta struttura ai preferiti');
      preferences.favoriteStrutture.push(strutturaId as any);
      await preferences.save();
    } else {
      console.log('⚠️ [addFavoriteStruttura] Struttura già nei preferiti');
    }

    console.log('✅ [addFavoriteStruttura] Struttura aggiunta ai preferiti');
    res.json({
      message: 'Struttura aggiunta ai preferiti',
      favoriteStrutture: preferences.favoriteStrutture,
    });
  } catch (err) {
    console.error('❌ [addFavoriteStruttura] Errore:', err);
    res.status(500).json({ message: 'Errore aggiunta preferito' });
  }
};

/**
 * 📌 DELETE /users/preferences/favorites/:strutturaId
 * Rimuovi struttura dai preferiti
 */
export const removeFavoriteStruttura = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId } = req.params;

    console.log('📌 [removeFavoriteStruttura] Inizio:', { userId: req.user!.id, strutturaId });

    console.log('🔍 [removeFavoriteStruttura] Ricerca preferenze');
    const preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences) {
      console.log('⚠️ [removeFavoriteStruttura] Preferenze non trovate');
      return res.status(404).json({ message: 'Preferenze non trovate' });
    }

    // Rimuovi dai preferiti
    console.log('➖ [removeFavoriteStruttura] Rimozione struttura dai preferiti');
    preferences.favoriteStrutture = preferences.favoriteStrutture.filter(
      (id) => id.toString() !== strutturaId
    );

    await preferences.save();

    console.log('✅ [removeFavoriteStruttura] Struttura rimossa dai preferiti');
    res.json({
      message: 'Struttura rimossa dai preferiti',
      favoriteStrutture: preferences.favoriteStrutture,
    });
  } catch (err) {
    console.error('❌ [removeFavoriteStruttura] Errore:', err);
    res.status(500).json({ message: 'Errore rimozione preferito' });
  }
};

/**
 * 📌 GET /users/preferences/favorites
 * Ottieni strutture favorite con dettagli completi
 */
export const getFavoriteStrutture = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📌 [getFavoriteStrutture] Inizio:', { userId: req.user!.id });

    console.log('🔍 [getFavoriteStrutture] Ricerca preferenze');
    const preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences || preferences.favoriteStrutture.length === 0) {
      console.log('⚠️ [getFavoriteStrutture] Nessuna struttura favorita');
      return res.json([]);
    }

    console.log('🔍 [getFavoriteStrutture] Caricamento strutture favorite');
    // Carica le strutture favorite con i dettagli completi
    const strutture = await Struttura.find({
      _id: { $in: preferences.favoriteStrutture },
      isActive: true,
      isDeleted: false,
    }).lean();

    // Aggrega sport dai campi (come in getStrutture)
    const struttureWithSports = await Promise.all(
      strutture.map(async (struttura) => {
        const campi = await Campo.find({
          struttura: struttura._id,
          isActive: true,
        })
          .select('sport indoor pricePerHour')
          .lean();

        const sportsSet = new Set<string>();
        campi.forEach((campo) => {
          if (campo.sport === 'beach volley') {
            sportsSet.add('Beach Volley');
          } else if (campo.sport === 'volley') {
            sportsSet.add('Volley');
          }
        });
        const sports = Array.from(sportsSet);

        const pricePerHour =
          campi.length > 0 ? Math.min(...campi.map((c) => c.pricePerHour)) : 0;

        const indoor = campi.some((c) => c.indoor);

        return {
          ...struttura,
          sports,
          pricePerHour,
          indoor,
          isFavorite: true, // Flag per il frontend
        };
      })
    );

    console.log('✅ [getFavoriteStrutture] Strutture favorite recuperate:', struttureWithSports.length);
    res.json(struttureWithSports);
  } catch (err) {
    console.error('❌ [getFavoriteStrutture] Errore:', err);
    res.status(500).json({ message: 'Errore caricamento preferiti' });
  }
};

/**
 * 📌 UTILITY: Calcola distanza tra due coordinate (formula Haversine)
 * Usata per trovare strutture vicine alla location preferita
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raggio della Terra in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
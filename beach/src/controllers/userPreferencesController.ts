// controllers/userPreferencesController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import UserPreferences from '../models/UserPreferences';
import Struttura from '../models/Strutture';
import Campo from '../models/Campo';

/**
 * 📌 GET /users/preferences
 * Ottieni preferenze dell'utente loggato
 */
export const getUserPreferences = async (req: AuthRequest, res: Response) => {
  try {
    let preferences = await UserPreferences.findOne({ user: req.user!.id });

    // Se non esistono, creale con valori default
    if (!preferences) {
      preferences = await UserPreferences.create({
        user: req.user!.id,
      });
    }

    res.json(preferences);
  } catch (err) {
    console.error('Errore getUserPreferences:', err);
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

    let preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences) {
      preferences = new UserPreferences({ user: req.user!.id });
    }

    // Aggiorna solo i campi forniti
    if (pushNotifications !== undefined) preferences.pushNotifications = pushNotifications;
    if (darkMode !== undefined) preferences.darkMode = darkMode;
    if (privacyLevel) preferences.privacyLevel = privacyLevel;
    if (favoriteSports) preferences.favoriteSports = favoriteSports;
    if (preferredTimeSlot !== undefined) preferences.preferredTimeSlot = preferredTimeSlot;

    await preferences.save();

    res.json({
      message: 'Preferenze aggiornate con successo',
      preferences,
    });
  } catch (err) {
    console.error('Errore updateUserPreferences:', err);
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

    if (!city || !lat || !lng) {
      return res.status(400).json({
        message: 'City, lat e lng sono obbligatori',
      });
    }

    let preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences) {
      preferences = new UserPreferences({ user: req.user!.id });
    }

    preferences.preferredLocation = {
      city,
      address,
      lat,
      lng,
      radius: radius || 10,
    };

    await preferences.save();

    res.json({
      message: 'Location preferita aggiornata',
      preferredLocation: preferences.preferredLocation,
    });
  } catch (err) {
    console.error('Errore updatePreferredLocation:', err);
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

    // Verifica che la struttura esista
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      isActive: true,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ message: 'Struttura non trovata' });
    }

    let preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences) {
      preferences = new UserPreferences({ user: req.user!.id });
    }

    // Aggiungi solo se non è già nei preferiti
    if (!preferences.favoriteStrutture.includes(strutturaId as any)) {
      preferences.favoriteStrutture.push(strutturaId as any);
      await preferences.save();
    }

    res.json({
      message: 'Struttura aggiunta ai preferiti',
      favoriteStrutture: preferences.favoriteStrutture,
    });
  } catch (err) {
    console.error('Errore addFavoriteStruttura:', err);
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

    const preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences) {
      return res.status(404).json({ message: 'Preferenze non trovate' });
    }

    // Rimuovi dai preferiti
    preferences.favoriteStrutture = preferences.favoriteStrutture.filter(
      (id) => id.toString() !== strutturaId
    );

    await preferences.save();

    res.json({
      message: 'Struttura rimossa dai preferiti',
      favoriteStrutture: preferences.favoriteStrutture,
    });
  } catch (err) {
    console.error('Errore removeFavoriteStruttura:', err);
    res.status(500).json({ message: 'Errore rimozione preferito' });
  }
};

/**
 * 📌 GET /users/preferences/favorites
 * Ottieni strutture favorite con dettagli completi
 */
export const getFavoriteStrutture = async (req: AuthRequest, res: Response) => {
  try {
    const preferences = await UserPreferences.findOne({ user: req.user!.id });

    if (!preferences || preferences.favoriteStrutture.length === 0) {
      return res.json([]);
    }

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
          if (campo.sport === 'beach_volley') {
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

    res.json(struttureWithSports);
  } catch (err) {
    console.error('Errore getFavoriteStrutture:', err);
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
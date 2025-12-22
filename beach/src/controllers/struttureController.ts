import { Request, Response } from "express";
import Struttura from "../models/Strutture";
import Campo from "../models/Campo";
import { AuthRequest } from "../middleware/authMiddleware";
import axios from "axios";

/**
 * 📌 GET /strutture
 * Tutte le strutture pubbliche (PLAYER)
 */
export const getStrutture = async (_req: Request, res: Response) => {
  try {
    const strutture = await Struttura.find({
      isActive: true,
      isDeleted: false,
    }).sort({ isFeatured: -1, createdAt: -1 });
    res.json(strutture);
  } catch (err) {
    console.error("❌ getStrutture error:", err);
    res.status(500).json({ message: "Errore caricamento strutture" });
  }
};

/**
 * 📌 GET /strutture/:id
 * Dettaglio singola struttura
 */
export const getStrutturaById = async (req: Request, res: Response) => {
  try {
    const struttura = await Struttura.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!struttura) {
      return res.status(404).json({ message: "Struttura non trovata" });
    }
    res.json(struttura);
  } catch (err) {
    console.error("❌ getStrutturaById error:", err);
    res.status(500).json({ message: "Errore struttura" });
  }
};

/**
 * 📌 GET /strutture/:id/campi
 * Tutti i campi di una struttura
 */
export const getCampiByStruttura = async (
  req: Request,
  res: Response
) => {
  try {
    const campi = await Campo.find({
      struttura: req.params.id,
      isActive: true,
    }).sort({ pricePerHour: 1 });
    res.json(campi);
  } catch (err) {
    console.error("❌ getCampiByStruttura error:", err);
    res.status(500).json({ message: "Errore caricamento campi" });
  }
};

/**
 * 📌 GET /strutture/owner/me
 * Strutture dell'owner loggato
 */
export const getOwnerStrutture = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const strutture = await Struttura.find({
      owner: req.user!.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });
    res.json(strutture);
  } catch (err) {
    console.error("❌ getOwnerStrutture error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📌 POST /strutture
 * Crea nuova struttura (OWNER)
 */
export const createStruttura = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { name, description, location, amenities, openingHours } = req.body;

    // Validazione campi obbligatori
    if (!name || !location?.city) {
      return res.status(400).json({ 
        message: "Nome e città sono obbligatori" 
      });
    }

    // Validazione coordinate
    if (!location.lat || !location.lng) {
      return res.status(400).json({ 
        message: "Coordinate mancanti. Seleziona un indirizzo valido" 
      });
    }

    // Crea la struttura
    const struttura = new Struttura({
      name,
      description,
      owner: req.user!.id,
      location: {
        address: location.address,
        city: location.city,
        lat: location.lat,
        lng: location.lng,
        coordinates: location.coordinates || [location.lng, location.lat],
      },
      amenities: amenities || {},
      openingHours: openingHours || {},
      isActive: true,
      isFeatured: false,
      isDeleted: false,
    });

    await struttura.save();
    console.log("✅ Struttura creata:", struttura._id);

    res.status(201).json({
      message: "Struttura creata con successo",
      struttura,
    });
  } catch (err) {
    console.error("❌ createStruttura error:", err);
    res.status(500).json({ message: "Errore creazione struttura" });
  }
};

/**
 * 📌 PUT /strutture/:id
 * Modifica struttura (OWNER)
 */
export const updateStruttura = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const struttura = await Struttura.findOne({
      _id: req.params.id,
      owner: req.user!.id,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ 
        message: "Struttura non trovata o non autorizzato" 
      });
    }

    const { name, description, location, amenities, isActive } = req.body;

    if (name) struttura.name = name;
    if (description !== undefined) struttura.description = description;
    if (location) {
      struttura.location = {
        ...struttura.location,
        ...location,
        coordinates: location.coordinates || [location.lng, location.lat],
      };
    }
    if (amenities) struttura.amenities = amenities;
    if (isActive !== undefined) struttura.isActive = isActive;

    await struttura.save();

    res.json({
      message: "Struttura aggiornata con successo",
      struttura,
    });
  } catch (err) {
    console.error("❌ updateStruttura error:", err);
    res.status(500).json({ message: "Errore aggiornamento struttura" });
  }
};

/**
 * 📌 DELETE /strutture/:id
 * Elimina struttura definitivamente (OWNER)
 */
export const deleteStruttura = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log("🗑️ Richiesta eliminazione struttura:", req.params.id);
    
    const struttura = await Struttura.findOne({
      _id: req.params.id,
      owner: req.user!.id,
      isDeleted: false,
    });

    if (!struttura) {
      console.log("❌ Struttura non trovata o non autorizzato");
      return res.status(404).json({ 
        message: "Struttura non trovata o non autorizzato" 
      });
    }

    const strutturaNome = struttura.name;
    
    // Elimina prima tutti i campi associati
    const campiEliminati = await Campo.deleteMany({ struttura: req.params.id });
    console.log(`✅ ${campiEliminati.deletedCount} campi eliminati`);

    // Elimina la struttura
    await Struttura.findByIdAndDelete(req.params.id);
    console.log("✅ Struttura eliminata definitivamente:", strutturaNome);

    res.json({ message: "Struttura e campi eliminati con successo" });
  } catch (err) {
    console.error("❌ deleteStruttura error:", err);
    res.status(500).json({ message: "Errore eliminazione struttura" });
  }
};

/**
 * 📌 GET /strutture/search-address
 * Proxy per cercare indirizzi (Nominatim)
 */
export const searchAddress = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.length < 3) {
      return res.status(400).json({ 
        message: "Query deve essere almeno 3 caratteri" 
      });
    }

    console.log("🔍 Cercando indirizzo:", query);

    // Chiama Nominatim con axios
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          countrycodes: "it",
          format: "json",
          addressdetails: 1,
          limit: 5,
        },
        headers: {
          "User-Agent": "SportApp/1.0 (contact@sportapp.com)",
        },
        timeout: 5000, // 5 secondi di timeout
      }
    );

    console.log("✅ Risultati trovati:", response.data.length);

    // Trasforma i risultati
    const suggestions = response.data.map((item: any) => ({
      place_id: item.place_id,
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      address: {
        city: item.address?.city,
        town: item.address?.town,
        village: item.address?.village,
        municipality: item.address?.municipality,
        road: item.address?.road,
        postcode: item.address?.postcode,
      },
    }));

    res.json(suggestions);
  } catch (err: any) {
    console.error("❌ searchAddress error:", err.message);
    
    if (err.response) {
      // Nominatim ha risposto con un errore
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
      return res.status(err.response.status).json({ 
        message: "Errore dal servizio di geocoding" 
      });
    }
    
    res.status(500).json({ message: "Errore ricerca indirizzo" });
  }
};
import { Request, Response } from "express";
import Campo from "../models/Campo";
import Struttura from "../models/Strutture";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * 📌 GET /campi/struttura/:id
 * Tutti i campi di una struttura (PUBLIC)
 */
export const getCampiByStruttura = async (req: Request, res: Response) => {
  try {
    const campi = await Campo.find({
      struttura: req.params.id,
      isActive: true, // Player vedono solo campi attivi
    }).sort({ name: 1 });
    
    res.json(campi);
  } catch (err) {
    console.error("❌ getCampiByStruttura error:", err);
    res.status(500).json({ message: "Errore caricamento campi" });
  }
};

/**
 * 📌 GET /campi/struttura/:id/all
 * Tutti i campi di una struttura (OWNER - include anche non attivi)
 */
export const getAllCampiByStruttura = async (req: AuthRequest, res: Response) => {
  try {
    // Verifica che la struttura appartenga all'owner
    const struttura = await Struttura.findOne({
      _id: req.params.id,
      owner: req.user!.id,
    });

    if (!struttura) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const campi = await Campo.find({
      struttura: req.params.id,
      // Nessun filtro su isActive - mostra tutti i campi
    }).sort({ name: 1 });
    
    res.json(campi);
  } catch (err) {
    console.error("❌ getAllCampiByStruttura error:", err);
    res.status(500).json({ message: "Errore caricamento campi" });
  }
};

/**
 * 📌 POST /campi
 * Crea nuovi campi per una struttura (OWNER)
 */
export const createCampi = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId, campi } = req.body;

    // Validazione
    if (!strutturaId || !campi || campi.length === 0) {
      return res.status(400).json({ 
        message: "ID struttura e campi sono obbligatori" 
      });
    }

    // Verifica che la struttura esista e appartenga all'owner
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      owner: req.user!.id,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ 
        message: "Struttura non trovata o non autorizzato" 
      });
    }

    // Valida ogni campo
    for (const campo of campi) {
      if (!campo.name || !campo.sport || !campo.surface || !campo.pricePerHour) {
        return res.status(400).json({ 
          message: "Tutti i campi devono avere nome, sport, superficie e prezzo" 
        });
      }
    }

    // Crea i campi
    const campiToCreate = campi.map((campo: any) => ({
      struttura: strutturaId,
      name: campo.name,
      sport: campo.sport,
      surface: campo.surface,
      maxPlayers: campo.maxPlayers || 4,
      indoor: campo.indoor || false,
      pricePerHour: campo.pricePerHour,
      isActive: true,
    }));

    const createdCampi = await Campo.insertMany(campiToCreate);
    console.log(`✅ ${createdCampi.length} campi creati per struttura ${strutturaId}`);

    res.status(201).json({
      message: "Campi creati con successo",
      campi: createdCampi,
    });
  } catch (err) {
    console.error("❌ createCampi error:", err);
    res.status(500).json({ message: "Errore creazione campi" });
  }
};

/**
 * 📌 GET /campi/:id
 * Dettaglio singolo campo (PUBLIC/OWNER)
 */
export const getCampoById = async (req: Request, res: Response) => {
  try {
    const campo = await Campo.findOne({
      _id: req.params.id,
      // NON filtrare per isActive - l'owner deve vedere anche campi non attivi
    }).populate("struttura");

    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    console.log("📋 Campo caricato:", campo.name, "- isActive:", campo.isActive);
    res.json(campo);
  } catch (err) {
    console.error("❌ getCampoById error:", err);
    res.status(500).json({ message: "Errore caricamento campo" });
  }
};

/**
 * 📌 PUT /campi/:id
 * Modifica campo (OWNER)
 */
export const updateCampo = async (req: AuthRequest, res: Response) => {
  try {
    const campo = await Campo.findById(req.params.id).populate("struttura");

    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    // Verifica ownership tramite struttura
    const struttura = await Struttura.findOne({
      _id: campo.struttura,
      owner: req.user!.id,
    });

    if (!struttura) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    const { name, sport, surface, maxPlayers, indoor, pricePerHour, isActive } = req.body;

    if (name) campo.name = name;
    if (sport) campo.sport = sport;
    if (surface) campo.surface = surface;
    if (maxPlayers !== undefined) campo.maxPlayers = maxPlayers;
    if (indoor !== undefined) campo.indoor = indoor;
    if (pricePerHour !== undefined) campo.pricePerHour = pricePerHour;
    if (isActive !== undefined) campo.isActive = isActive;

    await campo.save();

    res.json({
      message: "Campo aggiornato con successo",
      campo,
    });
  } catch (err) {
    console.error("❌ updateCampo error:", err);
    res.status(500).json({ message: "Errore aggiornamento campo" });
  }
};

/**
 * 📌 DELETE /campi/:id
 * Elimina campo definitivamente (OWNER)
 */
export const deleteCampo = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🗑️ Richiesta eliminazione campo:", req.params.id);
    
    const campo = await Campo.findById(req.params.id);

    if (!campo) {
      console.log("❌ Campo non trovato:", req.params.id);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    // Verifica ownership tramite struttura
    const struttura = await Struttura.findOne({
      _id: campo.struttura,
      owner: req.user!.id,
    });

    if (!struttura) {
      console.log("❌ Non autorizzato - struttura non appartiene all'utente");
      return res.status(403).json({ message: "Non autorizzato" });
    }

    console.log("✅ Eliminazione autorizzata - cancello definitivamente");
    const campoNome = campo.name;
    await Campo.findByIdAndDelete(req.params.id);

    console.log("✅ Campo eliminato definitivamente:", campoNome);
    res.json({ message: "Campo eliminato con successo" });
  } catch (err) {
    console.error("❌ deleteCampo error:", err);
    res.status(500).json({ message: "Errore eliminazione campo" });
  }
};
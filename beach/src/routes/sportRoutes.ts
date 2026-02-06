import { Router } from "express";
import Sport from "../models/Sport";

const router = Router();

/**
 * GET /api/sports
 * Lista tutti gli sport attivi
 */
router.get("/", async (req, res) => {
  try {
    const sports = await Sport.getActiveSports();

    res.json({
      success: true,
      data: sports,
      count: sports.length,
    });
  } catch (error: any) {
    console.error("Errore recupero sport:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero degli sport",
      error: error.message,
    });
  }
});

/**
 * GET /api/sports/:id
 * Dettaglio singolo sport
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sport = await Sport.findById(id);

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: "Sport non trovato",
      });
    }

    if (!sport.isActive) {
      return res.status(404).json({
        success: false,
        message: "Sport non disponibile",
      });
    }

    res.json({
      success: true,
      data: sport,
    });
  } catch (error: any) {
    console.error("Errore recupero sport:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero dello sport",
      error: error.message,
    });
  }
});

/**
 * GET /api/sports/code/:code
 * Cerca sport per codice (es. "beach_volley")
 */
router.get("/code/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const sport = await Sport.findByCode(code);

    if (!sport) {
      return res.status(404).json({
        success: false,
        message: "Sport non trovato",
      });
    }

    res.json({
      success: true,
      data: sport,
    });
  } catch (error: any) {
    console.error("Errore recupero sport per codice:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero dello sport",
      error: error.message,
    });
  }
});

/**
 * GET /api/sports/environment/:type
 * Lista sport per ambiente (indoor/outdoor)
 */
router.get("/environment/:type", async (req, res) => {
  try {
    const { type } = req.params;

    if (type !== "indoor" && type !== "outdoor") {
      return res.status(400).json({
        success: false,
        message: 'Tipo ambiente non valido. Usa "indoor" o "outdoor"',
      });
    }

    const sports = await Sport.getSportsForEnvironment(type);

    res.json({
      success: true,
      data: sports,
      count: sports.length,
      environment: type,
    });
  } catch (error: any) {
    console.error("Errore recupero sport per ambiente:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero degli sport",
      error: error.message,
    });
  }
});

export default router;

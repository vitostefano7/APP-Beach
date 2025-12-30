import { Request, Response } from "express";
import Campo from "../models/Campo";
import { AuthRequest } from "../middleware/authMiddleware";

/**
 * 💰 AGGIORNA LE REGOLE DI PRICING DI UN CAMPO
 * PUT /campi/:id/pricing
 */
export const updateCampoPricing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ownerId = req.user!.id;
    const { pricingRules } = req.body;

    console.log("💰 Aggiornamento pricing campo:", id);

    // Verifica campo
    const campo = await Campo.findById(id).populate("struttura");
    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    // Verifica autorizzazione
    if ((campo.struttura as any).owner.toString() !== ownerId) {
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Validazione base
    if (!pricingRules || !pricingRules.mode) {
      return res.status(400).json({ message: "Dati pricing non validi: mode richiesto" });
    }

    // Valida flatPrices o basePrices in base alla modalità
    if (pricingRules.mode === "flat") {
      if (!pricingRules.flatPrices || 
          typeof pricingRules.flatPrices.oneHour !== "number" ||
          typeof pricingRules.flatPrices.oneHourHalf !== "number") {
        return res.status(400).json({ message: "Dati pricing non validi: flatPrices richiesti" });
      }
    } else {
      if (!pricingRules.basePrices || 
          typeof pricingRules.basePrices.oneHour !== "number" ||
          typeof pricingRules.basePrices.oneHourHalf !== "number") {
        return res.status(400).json({ message: "Dati pricing non validi: basePrices richiesti" });
      }
    }

    // Validazione fasce orarie
    if (pricingRules.timeSlotPricing?.enabled) {
      const slots = pricingRules.timeSlotPricing.slots || [];

      for (const slot of slots) {
        if (slot.start >= slot.end) {
          return res.status(400).json({
            message: `Fascia oraria non valida: ${slot.label}`,
          });
        }
        if (!slot.prices || 
            typeof slot.prices.oneHour !== "number" ||
            typeof slot.prices.oneHourHalf !== "number") {
          return res.status(400).json({
            message: `Prezzi non validi per fascia: ${slot.label}`,
          });
        }
      }
    }

    // Aggiorna pricing rules
    (campo as any).pricingRules = pricingRules;

    // Aggiorna anche pricePerHour per retrocompatibilità
    const basePrice = pricingRules.mode === "flat" 
      ? pricingRules.flatPrices.oneHour 
      : pricingRules.basePrices.oneHour;
    (campo as any).pricePerHour = basePrice;

    await campo.save();

    console.log("✅ Pricing aggiornato");
    res.json(campo);
  } catch (err) {
    console.error("❌ updateCampoPricing error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * 📊 GET PRICING DI UN CAMPO
 * GET /campi/:id/pricing
 */
export const getCampoPricing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campo = await Campo.findById(id).select("pricingRules sport name pricePerHour");
    if (!campo) {
      return res.status(404).json({ message: "Campo non trovato" });
    }

    // Se il campo non ha pricingRules, crea una struttura di default
    let pricingRules = (campo as any).pricingRules;
    
    if (!pricingRules || !pricingRules.mode) {
      const basePrice = (campo as any).pricePerHour || 20;
      pricingRules = {
        mode: "flat",
        flatPrices: {
          oneHour: basePrice,
          oneHourHalf: basePrice * 1.4,
        },
        basePrices: {
          oneHour: basePrice,
          oneHourHalf: basePrice * 1.4,
        },
        timeSlotPricing: {
          enabled: false,
          slots: [],
        },
      };
    }

    res.json({
      campoId: (campo as any)._id,
      name: (campo as any).name,
      sport: (campo as any).sport,
      pricingRules: pricingRules,
    });
  } catch (err) {
    console.error("❌ getCampoPricing error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
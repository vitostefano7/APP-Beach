import { Request, Response } from "express";
import Campo from "../models/Campo";
import { AuthRequest } from "../middleware/authMiddleware";
import { validatePricingRules } from "../utils/pricingUtils";

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

    console.log("🔍 Cercando campo...");
    // Verifica campo
    const campo = await Campo.findById(id).populate("struttura");
    if (!campo) {
      console.log("❌ Campo non trovato:", id);
      return res.status(404).json({ message: "Campo non trovato" });
    }

    // Verifica autorizzazione
    if ((campo.struttura as any).owner.toString() !== ownerId) {
      console.log("❌ Non autorizzato per campo:", id);
      return res.status(403).json({ message: "Non autorizzato" });
    }

    // Validazione base
    if (!pricingRules || !pricingRules.mode) {
      console.log("❌ Dati pricing non validi: mode mancante");
      return res.status(400).json({ message: "Dati pricing non validi: mode richiesto" });
    }

    console.log("🔍 Validando regole pricing...");
    // Valida flatPrices o basePrices in base alla modalità
    if (pricingRules.mode === "flat") {
      if (
        !pricingRules.flatPrices ||
        typeof pricingRules.flatPrices.oneHour !== "number" ||
        typeof pricingRules.flatPrices.oneHourHalf !== "number"
      ) {
        console.log("❌ flatPrices non validi");
        return res.status(400).json({ message: "Dati pricing non validi: flatPrices richiesti" });
      }
      if (pricingRules.flatPrices.oneHour < 0 || pricingRules.flatPrices.oneHourHalf < 0) {
        console.log("❌ Prezzi negativi in flatPrices");
        return res.status(400).json({ message: "I prezzi non possono essere negativi" });
      }
    } else {
      if (
        !pricingRules.basePrices ||
        typeof pricingRules.basePrices.oneHour !== "number" ||
        typeof pricingRules.basePrices.oneHourHalf !== "number"
      ) {
        console.log("❌ basePrices non validi");
        return res.status(400).json({ message: "Dati pricing non validi: basePrices richiesti" });
      }
      if (pricingRules.basePrices.oneHour < 0 || pricingRules.basePrices.oneHourHalf < 0) {
        console.log("❌ Prezzi negativi in basePrices");
        return res.status(400).json({ message: "I prezzi non possono essere negativi" });
      }
    }

    // Validazione fasce orarie
    if (pricingRules.timeSlotPricing?.enabled) {
      const slots = pricingRules.timeSlotPricing.slots || [];

      for (const slot of slots) {
        // Valida formato orari
        if (!/^\d{2}:\d{2}$/.test(slot.start) || !/^\d{2}:\d{2}$/.test(slot.end)) {
          console.log("❌ Formato orario non valido per fascia:", slot.label);
          return res.status(400).json({
            message: `Formato orario non valido per fascia: ${slot.label}`,
          });
        }

        // Valida range
        if (slot.start >= slot.end) {
          console.log("❌ Fascia oraria non valida:", slot.label);
          return res.status(400).json({
            message: `Fascia oraria non valida: ${slot.label} (start >= end)`,
          });
        }

        // Valida prezzi
        if (
          !slot.prices ||
          typeof slot.prices.oneHour !== "number" ||
          typeof slot.prices.oneHourHalf !== "number"
        ) {
          console.log("❌ Prezzi non validi per fascia:", slot.label);
          return res.status(400).json({
            message: `Prezzi non validi per fascia: ${slot.label}`,
          });
        }

        if (slot.prices.oneHour < 0 || slot.prices.oneHourHalf < 0) {
          console.log("❌ Prezzi negativi per fascia:", slot.label);
          return res.status(400).json({
            message: `Prezzi negativi per fascia: ${slot.label}`,
          });
        }

        // Valida daysOfWeek (opzionale)
        if (slot.daysOfWeek) {
          if (!Array.isArray(slot.daysOfWeek)) {
            console.log("❌ daysOfWeek non array per fascia:", slot.label);
            return res.status(400).json({
              message: `daysOfWeek deve essere un array per fascia: ${slot.label}`,
            });
          }
          for (const day of slot.daysOfWeek) {
            if (typeof day !== "number" || day < 0 || day > 6) {
              console.log("❌ daysOfWeek non valido per fascia:", slot.label);
              return res.status(400).json({
                message: `daysOfWeek non valido per fascia: ${slot.label} (valori ammessi: 0-6)`,
              });
            }
          }
        }
      }
    }

    // Validazione date overrides
    if (pricingRules.dateOverrides?.enabled) {
      const dates = pricingRules.dateOverrides.dates || [];

      for (const dateOverride of dates) {
        // Valida formato data
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOverride.date)) {
          console.log("❌ Formato data non valido:", dateOverride.date);
          return res.status(400).json({
            message: `Formato data non valido: ${dateOverride.date} (richiesto YYYY-MM-DD)`,
          });
        }

        // Valida prezzi
        if (
          !dateOverride.prices ||
          typeof dateOverride.prices.oneHour !== "number" ||
          typeof dateOverride.prices.oneHourHalf !== "number"
        ) {
          console.log("❌ Prezzi non validi per data:", dateOverride.label);
          return res.status(400).json({
            message: `Prezzi non validi per data: ${dateOverride.label}`,
          });
        }

        if (dateOverride.prices.oneHour < 0 || dateOverride.prices.oneHourHalf < 0) {
          console.log("❌ Prezzi negativi per data:", dateOverride.label);
          return res.status(400).json({
            message: `Prezzi negativi per data: ${dateOverride.label}`,
          });
        }
      }
    }

    // Validazione period overrides
    if (pricingRules.periodOverrides?.enabled) {
      const periods = pricingRules.periodOverrides.periods || [];

      for (const period of periods) {
        // Valida formato date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(period.startDate)) {
          console.log("❌ Formato startDate non valido:", period.startDate);
          return res.status(400).json({
            message: `Formato startDate non valido: ${period.startDate} (richiesto YYYY-MM-DD)`,
          });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(period.endDate)) {
          console.log("❌ Formato endDate non valido:", period.endDate);
          return res.status(400).json({
            message: `Formato endDate non valido: ${period.endDate} (richiesto YYYY-MM-DD)`,
          });
        }

        // Valida range
        if (period.startDate > period.endDate) {
          console.log("❌ Periodo non valido:", period.label);
          return res.status(400).json({
            message: `Periodo non valido: ${period.label} (startDate > endDate)`,
          });
        }

        // Valida prezzi
        if (
          !period.prices ||
          typeof period.prices.oneHour !== "number" ||
          typeof period.prices.oneHourHalf !== "number"
        ) {
          console.log("❌ Prezzi non validi per periodo:", period.label);
          return res.status(400).json({
            message: `Prezzi non validi per periodo: ${period.label}`,
          });
        }

        if (period.prices.oneHour < 0 || period.prices.oneHourHalf < 0) {
          console.log("❌ Prezzi negativi per periodo:", period.label);
          return res.status(400).json({
            message: `Prezzi negativi per periodo: ${period.label}`,
          });
        }
      }
    }

    console.log("🔍 Validazione avanzata: sovrapposizioni...");
    // 🔍 Validazione avanzata: sovrapposizioni
    const validationErrors = validatePricingRules(pricingRules);
    if (validationErrors.length > 0) {
      console.log("❌ Errori di validazione:", validationErrors);
      return res.status(400).json({
        message: "Errori di validazione",
        errors: validationErrors,
      });
    }

    console.log("💾 Salvando pricing rules...");
    // ✅ Aggiorna pricing rules
    (campo as any).pricingRules = pricingRules;

    // Aggiorna anche pricePerHour per retrocompatibilità
    const basePrice =
      pricingRules.mode === "flat"
        ? pricingRules.flatPrices.oneHour
        : pricingRules.basePrices.oneHour;
    (campo as any).pricePerHour = basePrice;

    await campo.save();

    console.log("✅ Pricing aggiornato");
    console.log("📤 Invio risposta aggiornamento pricing");
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

    console.log("📊 GET pricing campo:", id);

    console.log("🔍 Cercando campo per pricing...");
    const campo = await Campo.findById(id).select(
      "pricingRules sport name pricePerHour"
    );
    if (!campo) {
      console.log("❌ Campo non trovato:", id);
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
        dateOverrides: {
          enabled: false,
          dates: [],
        },
        periodOverrides: {
          enabled: false,
          periods: [],
        },
        playerCountPricing: {
          enabled: false,
          prices: [],
        },
      };
    }

    console.log("📤 Invio pricing campo");
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

/**
 * 🔍 VALIDA LE REGOLE DI PRICING (endpoint pubblico per testing)
 * POST /campi/pricing/validate
 */
export const validateCampoPricingRules = async (req: Request, res: Response) => {
  try {
    const { pricingRules } = req.body;

    console.log("🔍 Validazione regole pricing");

    if (!pricingRules) {
      console.log("❌ pricingRules mancante");
      return res.status(400).json({ message: "pricingRules richiesto" });
    }

    const errors = validatePricingRules(pricingRules);

    if (errors.length > 0) {
      console.log("❌ Regole non valide:", errors);
      return res.status(400).json({
        valid: false,
        errors,
      });
    }

    console.log("✅ Regole valide");
    console.log("📤 Invio risultato validazione");
    res.json({
      valid: true,
      message: "Regole di pricing valide",
    });
  } catch (err) {
    console.error("❌ validateCampoPricingRules error:", err);
    res.status(500).json({ message: "Errore server" });
  }
};
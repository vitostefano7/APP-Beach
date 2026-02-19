// seeds/generateCampi.ts
import Campo from "../models/Campo";
import { randomInt, randomElement } from "./config";
import mongoose from "mongoose";
import { getRandomSportForEnvironment, getRecommendedSurfaceForSport, getMaxPlayersForSport } from "./seedSports";

/**
 * Converte openingHours (formato Struttura) in weeklySchedule (formato Campo)
 * openingHours: { monday: { closed: true } | { slots: [{open, close}] } }
 * weeklySchedule: { monday: { enabled: boolean, open?: string, close?: string } }
 */
function convertOpeningHoursToWeeklySchedule(openingHours: any) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const weeklySchedule: any = {};

  days.forEach((day) => {
    const dayConfig = openingHours[day];
    if (!dayConfig || dayConfig.closed === true) {
      // Giorno chiuso
      weeklySchedule[day] = { enabled: false };
    } else if (dayConfig.slots && dayConfig.slots.length > 0) {
      // Usa il primo slot (in caso di multi-slot, prendiamo il primo)
      const firstSlot = dayConfig.slots[0];
      weeklySchedule[day] = {
        enabled: true,
        open: firstSlot.open,
        close: firstSlot.close,
      };
    } else {
      // Fallback: giorno abilitato con orari di default
      weeklySchedule[day] = { enabled: true, open: "09:00", close: "22:00" };
    }
  });

  return weeklySchedule;
}

export async function generateCampi(strutture: any[], sportMapping: Record<string, mongoose.Types.ObjectId>) {
  console.log(`🏐 Creazione campi per ${strutture.length} strutture...`);

  const campiData: any[] = [];

  // Ogni struttura ha 3-4 campi con sport diversificati
  for (const struttura of strutture) {
    const numCampi = randomInt(3, 4);

    for (let campoNum = 1; campoNum <= numCampi; campoNum++) {
      const isIndoor = Math.random() > 0.6; // 40% indoor, 60% outdoor
      
      // Scegli sport casuale per l'ambiente
      const sportInfo = await getRandomSportForEnvironment(isIndoor, sportMapping);
      const sportCode = sportInfo.code;
      const sportId = sportInfo.id;
      
      // Superficie raccomandata per lo sport
      const surface = getRecommendedSurfaceForSport(sportCode, isIndoor);
      
      // MaxPlayers per lo sport
      const maxPlayers = getMaxPlayersForSport(sportCode);

      // Prezzo base
      const pricePerHour = randomInt(30, 50);
      const flatOne = randomInt(30, 50);
      const flatOneHalf = randomInt(42, 70);
      const baseOne = randomInt(30, 45);
      const baseOneHalf = randomInt(42, 63);

      // ✅ playerCountPricing abilitato solo per sport che lo permettono
      const allowsPlayerPricing = ["beach_volley", "beach_tennis", "basket"].includes(sportCode);
      const enablePlayerPricing = allowsPlayerPricing && Math.random() > 0.3;
      
      let playerPrices: any[] = [];
      if (enablePlayerPricing) {
        // Genera prezzi per player count basati sul maxPlayers dello sport
        if (sportCode === "beach_volley") {
          playerPrices = [
            {
              count: 4,
              label: "4 giocatori",
              prices: {
                oneHour: Math.max(8, Math.round(pricePerHour / 4)),
                oneHourHalf: Math.max(11, Math.round((pricePerHour * 1.4) / 4)),
              },
            },
            {
              count: 6,
              label: "6 giocatori",
              prices: {
                oneHour: Math.max(6, Math.round(pricePerHour / 6)),
                oneHourHalf: Math.max(8, Math.round((pricePerHour * 1.4) / 6)),
              },
            },
            {
              count: 8,
              label: "8 giocatori",
              prices: {
                oneHour: Math.max(5, Math.round(pricePerHour / 8)),
                oneHourHalf: Math.max(7, Math.round((pricePerHour * 1.4) / 8)),
              },
            },
          ];
        } else if (sportCode === "beach_tennis") {
          playerPrices = [
            {
              count: 2,
              label: "2 giocatori",
              prices: {
                oneHour: Math.max(15, Math.round(pricePerHour / 2)),
                oneHourHalf: Math.max(21, Math.round((pricePerHour * 1.4) / 2)),
              },
            },
            {
              count: 4,
              label: "4 giocatori",
              prices: {
                oneHour: Math.max(8, Math.round(pricePerHour / 4)),
                oneHourHalf: Math.max(11, Math.round((pricePerHour * 1.4) / 4)),
              },
            },
          ];
        } else if (sportCode === "basket") {
          playerPrices = [
            {
              count: 4,
              label: "4 giocatori (2v2)",
              prices: {
                oneHour: Math.max(8, Math.round(pricePerHour / 4)),
                oneHourHalf: Math.max(11, Math.round((pricePerHour * 1.4) / 4)),
              },
            },
            {
              count: 6,
              label: "6 giocatori (3v3)",
              prices: {
                oneHour: Math.max(6, Math.round(pricePerHour / 6)),
                oneHourHalf: Math.max(8, Math.round((pricePerHour * 1.4) / 6)),
              },
            },
          ];
        }
      }

      // ✅ Pricing avanzato con esempi realistici
      const enableTimeSlot = Math.random() > 0.5;
      const timeSlots = enableTimeSlot
        ? [
            {
              start: "18:00",
              end: "23:00",
              label: "Serale Weekend",
              prices: { oneHour: randomInt(45, 60), oneHourHalf: randomInt(63, 84) },
              daysOfWeek: [5, 6, 0], // Ven, Sab, Dom
            },
            {
              start: "18:00",
              end: "23:00",
              label: "Serale Feriale",
              prices: { oneHour: randomInt(35, 50), oneHourHalf: randomInt(49, 70) },
              daysOfWeek: [1, 2, 3, 4], // Lun-Gio
            },
          ]
        : [];

      // Nome campo con sport type
      const sportNames: Record<string, string> = {
        volley: "Volley",
        beach_volley: "Beach",
        beach_tennis: "Beach Tennis",
        calcio: "Calcio",
        calcetto: "Calcetto",
        calciotto: "Calciotto",
        calcio_a_7: "Calcio a 7",
        basket: "Basket",
      };

      campiData.push({
        struttura: struttura._id,
        name: `Campo ${sportNames[sportCode] || sportCode} ${campoNum}`,
        sport: sportId, // ObjectId dello sport
        surface: surface,
        maxPlayers: maxPlayers,
        indoor: isIndoor,
        pricePerHour: pricePerHour,
        isActive: true,
        pricingRules: {
          mode: Math.random() > 0.5 ? "flat" : "advanced",
          flatPrices: { oneHour: flatOne, oneHourHalf: flatOneHalf },
          basePrices: { oneHour: baseOne, oneHourHalf: baseOneHalf },
          timeSlotPricing: {
            enabled: enableTimeSlot,
            slots: timeSlots,
          },
          dateOverrides: { enabled: false, dates: [] },
          periodOverrides: { enabled: false, periods: [] },
          playerCountPricing: { enabled: !!enablePlayerPricing, prices: playerPrices },
        },
        // ✅ Sincronizza weeklySchedule con openingHours della struttura
        weeklySchedule: convertOpeningHoursToWeeklySchedule(struttura.openingHours),
      });
    }
  }

  const campi = await Campo.insertMany(campiData);
  console.log(`✅ ${campi.length} campi creati (distribuiti su ${Object.keys(sportMapping).length} sport)`);
  return campi;
}

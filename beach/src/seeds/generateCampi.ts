// seeds/generateCampi.ts
import Campo from "../models/Campo";
import { randomInt, randomElement } from "./config";

export async function generateCampi(strutture: any[]) {
  console.log(`🏐 Creazione campi per ${strutture.length} strutture...`);

  const campiData: any[] = [];

  // Ogni struttura ha esattamente 3 campi: 2 beach (maxPlayers=8) e 1 volley
  strutture.forEach((struttura: any, idx: number) => {
    // Campo 1: Beach Volley
    for (let beachNum = 1; beachNum <= 2; beachNum++) {
      const isBeach = true;
      const isIndoor = false;

      // deterministico prezzo base e possibili tariffe per-player
      const pricePerHour = randomInt(30, 50);
      const flatOne = randomInt(30, 50);
      const flatOneHalf = randomInt(42, 70);
      const baseOne = randomInt(30, 45);
      const baseOneHalf = randomInt(42, 63);

      // ✅ playerCountPricing abilitato per campi beach volley
      const enablePlayerPricing = true;
      const playerPrices = [
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

      const campoMaxPlayers = 8; // Beach sempre 8 giocatori max

      // ✅ Pricing avanzato con esempi realistici
      const enableTimeSlot = Math.random() > 0.5;
      const enableDateOverride = idx === 0 && beachNum === 1; // Solo primo campo beach della prima struttura
      const enablePeriodOverride = idx === 1 && beachNum === 1; // Solo primo campo beach della seconda struttura

      // TimeSlot con giorni specifici (weekend vs feriali)
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

      // Date override per eventi speciali
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateOverrides = enableDateOverride
        ? [
            {
              date: formatDate(tomorrow),
              label: "Evento Speciale",
              prices: { oneHour: 25, oneHourHalf: 35 },
            },
          ]
        : [];

      // Period override per estate/inverno
      const summerStart = new Date();
      summerStart.setMonth(5, 1); // 1 giugno
      const summerEnd = new Date();
      summerEnd.setMonth(8, 30); // 30 settembre
      const periodOverrides = enablePeriodOverride
        ? [
            {
              startDate: formatDate(summerStart),
              endDate: formatDate(summerEnd),
              label: "Estate",
              prices: { oneHour: randomInt(50, 65), oneHourHalf: randomInt(70, 91) },
            },
          ]
        : [];

      campiData.push({
        struttura: struttura._id,
        name: `Campo Beach ${beachNum}`,
        sport: "beach volley",
        surface: "sand",
        maxPlayers: campoMaxPlayers,
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
          dateOverrides: { enabled: enableDateOverride, dates: dateOverrides },
          periodOverrides: { enabled: enablePeriodOverride, periods: periodOverrides },
          playerCountPricing: { enabled: !!enablePlayerPricing, prices: playerPrices },
        },
        weeklySchedule: {
          monday: { enabled: true, open: "09:00", close: "22:00" },
          tuesday: { enabled: true, open: "09:00", close: "22:00" },
          wednesday: { enabled: true, open: "09:00", close: "22:00" },
          thursday: { enabled: true, open: "09:00", close: "22:00" },
          friday: { enabled: true, open: "09:00", close: "23:00" },
          saturday: { enabled: true, open: "08:00", close: "23:00" },
          sunday: { enabled: true, open: "08:00", close: "22:00" },
        },
      });
    }

    // Campo 3: Volley normale (indoor/outdoor)
    const isIndoorVolley = Math.random() > 0.5;
    const volleyPricePerHour = randomInt(30, 50);
    const volleyFlatOne = randomInt(30, 50);
    const volleyFlatOneHalf = randomInt(42, 70);
    const volleyBaseOne = randomInt(30, 45);
    const volleyBaseOneHalf = randomInt(42, 63);

    const enableVolleyTimeSlot = Math.random() > 0.5;
    const volleyTimeSlots = enableVolleyTimeSlot
      ? [
          {
            start: "18:00",
            end: "23:00",
            label: "Serale Weekend",
            prices: { oneHour: randomInt(45, 60), oneHourHalf: randomInt(63, 84) },
            daysOfWeek: [5, 6, 0],
          },
          {
            start: "18:00",
            end: "23:00",
            label: "Serale Feriale",
            prices: { oneHour: randomInt(35, 50), oneHourHalf: randomInt(49, 70) },
            daysOfWeek: [1, 2, 3, 4],
          },
        ]
      : [];

    campiData.push({
      struttura: struttura._id,
      name: "Campo Volley",
      sport: "volley",
      surface: isIndoorVolley ? "pvc" : "cement",
      maxPlayers: 10,
      indoor: isIndoorVolley,
      pricePerHour: volleyPricePerHour,
      isActive: true,
      pricingRules: {
        mode: Math.random() > 0.5 ? "flat" : "advanced",
        flatPrices: { oneHour: volleyFlatOne, oneHourHalf: volleyFlatOneHalf },
        basePrices: { oneHour: volleyBaseOne, oneHourHalf: volleyBaseOneHalf },
        timeSlotPricing: {
          enabled: enableVolleyTimeSlot,
          slots: volleyTimeSlots,
        },
        dateOverrides: { enabled: false, dates: [] },
        periodOverrides: { enabled: false, periods: [] },
        playerCountPricing: { enabled: false, prices: [] },
      },
      weeklySchedule: {
        monday: { enabled: true, open: "09:00", close: "22:00" },
        tuesday: { enabled: true, open: "09:00", close: "22:00" },
        wednesday: { enabled: true, open: "09:00", close: "22:00" },
        thursday: { enabled: true, open: "09:00", close: "22:00" },
        friday: { enabled: true, open: "09:00", close: "23:00" },
        saturday: { enabled: true, open: "08:00", close: "23:00" },
        sunday: { enabled: true, open: "08:00", close: "22:00" },
      },
    });
  });

  function formatDate(date: Date) {
    return date.toISOString().split("T")[0];
  }

  const campi = await Campo.insertMany(campiData);
  console.log(`✅ ${campi.length} campi creati`);
  return campi;
}

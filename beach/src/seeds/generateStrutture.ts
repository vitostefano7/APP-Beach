
// seeds/generateStrutture.ts
import Struttura from "../models/Strutture";

import { generateStrutturaDescription } from "./strutturaUtils";
import { randomInt, randomElement } from "./config";
import fs from "fs";
import cloudinary from "../config/cloudinary";

function generateItalianMobilePhone() {
  const prefix = `${randomInt(20, 99)}`;
  const suffix = `${randomInt(1000000, 9999999)}`;
  return `+393${prefix}${suffix}`;
}

export async function generateStrutture(owners: any[]) {
  // Leggi strutture statiche
  const staticPath = require('path').join(__dirname, 'strutture_statiche.txt');
  const lines = fs.readFileSync(staticPath, 'utf-8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  // Recupera immagini da Cloudinary (cartella images/struttura-images)
  let strutturaImageUrls: string[] = [];
  try {
    const result = await cloudinary.search
      .expression('folder:images/struttura-images')
      .sort_by('public_id','desc')
      .max_results(200)
      .execute();
    strutturaImageUrls = result.resources.map((r: any) => r.secure_url);
    console.log(`✅ Recuperate ${strutturaImageUrls.length} immagini da Cloudinary per le strutture`);
  } catch (err) {
    console.error('Errore nel recupero immagini da Cloudinary:', err);
    strutturaImageUrls = [];
  }

  if (strutturaImageUrls.length === 0) {
    console.warn('⚠️ Nessuna immagine disponibile, le strutture non avranno foto');
  }

  let currentCity = '';
  const struttureData = [];
  let idx = 0;
  for (const line of lines) {
    if (!line.includes(' - ')) {
      currentCity = line;
      continue;
    }
    // Esempio: Via dei Fori Imperiali, 1 - 41.8925, 12.4853 - Palestra Colosseo Fitness
    const [addressPart, coordsPart, name] = line.split(' - ');
    const [lat, lng] = coordsPart.split(',').map(s => parseFloat(s.trim()));
    const ownerIndex = idx % owners.length;
    const imageCount = strutturaImageUrls.length > 0 ? randomInt(1, 5) : 0;
    const images = [];
    for (let j = 0; j < imageCount; j++) {
      const randomIdx = randomInt(0, strutturaImageUrls.length - 1);
      images.push(strutturaImageUrls[randomIdx]);
    }
    // Usa la lista di servizi definiti nell'applicazione per evitare hard‑code
    // la costante qui sotto è mantenuta in sincronia con AVAILABLE_AMENITIES
    // presenti nel codice React; aggiungere chiavi lì aggiornerà automaticamente
    // anche i seed.
    const ALL_AMENITY_KEYS = [
      "toilets",
      "lockerRoom",
      "showers",
      "parking",
      "restaurant",
      "bar",
      "wifi",
      "airConditioning",
      "lighting",
      "gym",
      "store",
      "firstAid",
      "locker",
      "disabledAccess",
      "disabledParking",
      "defibrillator",
      "relaxArea",
      "equipmentRental",
      "equipmentStorage",
      "coachService",
      "courses",
      "tournaments",
      "scoreboard",
      "coworking",
      "kidsArea",
      "bikeParking",
      "chargingStation",
      "spa",
      "sauna",
      "turkishBath",
      "massage",
    ];

    // crea un sottoinsieme casuale di servizi (1‑5 elementi)
    const shuffled = [...ALL_AMENITY_KEYS].sort(() => Math.random() - 0.5);
    const amenitiesCount = randomInt(1, Math.min(5, ALL_AMENITY_KEYS.length));
    const amenitiesList = shuffled.slice(0, amenitiesCount);
    struttureData.push({
      name: name,
      description: generateStrutturaDescription(),
      phone: generateItalianMobilePhone(),
      owner: owners[ownerIndex]._id,
      location: {
        address: addressPart,
        city: currentCity,
        lat,
        lng,
        coordinates: [lng, lat],
      },
      amenities: amenitiesList,
      // Opening hours per day (expected format by the app)
      openingHours: (() => {
        const defaultOpening = "08:00";
        const defaultClosing = "23:00";
        const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
        const oh: any = {};
        
        // ✅ Prima struttura (idx===0) ha weekend chiuso per testing occupancy
        const isClosedWeekend = idx === 0;
        
        days.forEach((d) => {
          // Occasionally close weekends for variety
          const shouldCloseWeekend = isClosedWeekend || Math.random() < 0.3;
          if ((d === "saturday" || d === "sunday") && shouldCloseWeekend) {
            oh[d] = { closed: true };
          } else {
            oh[d] = { slots: [{ open: defaultOpening, close: defaultClosing }] };
          }
        });
        return oh;
      })(),
      images,
      rating: {
        average: randomInt(3, 5),
        count: randomInt(5, 100)
      },
      isActive: true,
      isFeatured: Math.random() > 0.8,
      isDeleted: false,
      // ✅ 70% delle strutture supportano split payment per garantire disponibilità di partite aperte
      isCostSplittingEnabled: Math.random() > 0.3,
    });
    idx++;
  }

  console.log(`👷 Creazione ${struttureData.length} strutture statiche...`);

  // Garantisci che ogni owner abbia almeno una struttura con isCostSplittingEnabled: true
  const ownerMap = new Map<string, any[]>();
  struttureData.forEach((struttura, index) => {
    const ownerId = struttura.owner.toString();
    if (!ownerMap.has(ownerId)) {
      ownerMap.set(ownerId, []);
    }
    ownerMap.get(ownerId)!.push({ struttura, index });
  });

  for (const [ownerId, ownerStrutture] of ownerMap) {
    const hasSplitEnabled = ownerStrutture.some(item => item.struttura.isCostSplittingEnabled);
    if (!hasSplitEnabled) {
      // Imposta isCostSplittingEnabled: true su una struttura casuale per questo owner
      const randomIndex = Math.floor(Math.random() * ownerStrutture.length);
      struttureData[ownerStrutture[randomIndex].index].isCostSplittingEnabled = true;
    }
  }

  const strutture = await Struttura.insertMany(struttureData);
  console.log(`✅ ${strutture.length} strutture create`);
  return strutture;
}

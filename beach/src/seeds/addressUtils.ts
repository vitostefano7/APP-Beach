// Funzione di generazione indirizzo

export function generateAddress(CITIES: string[], cityCoords: {[key:string]:{lat:number,lng:number}}, CITY_STREETS: {[key:string]:string[]}): { address: string; city: string; lat: number; lng: number } {
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const coords = cityCoords[city];
  const streets = CITY_STREETS[city] || ["Via Garibaldi", "Viale Roma", "Corso Vittorio Emanuele", "Via Mazzini", "Piazza Dante", "Via Verdi", "Corso Italia"];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const civic = Math.floor(Math.random() * 200) + 1;
  const lat = coords.lat + (Math.random() - 0.5) * 0.04;
  const lng = coords.lng + (Math.random() - 0.5) * 0.04;
  return {
    address: `${street}, ${civic}`,
    city,
    lat: Math.round(lat * 100000) / 100000,
    lng: Math.round(lng * 100000) / 100000
  };
}

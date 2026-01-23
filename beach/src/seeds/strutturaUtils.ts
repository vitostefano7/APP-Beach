// Funzioni di generazione struttura

export function generateStrutturaDescription(): string {
  const descrizioni = [
    "Struttura moderna con campi in sabbia di ultima generazione.",
    "Centro sportivo con servizi bar e spogliatoi.",
    "Location ideale per tornei e allenamenti.",
    "Ambiente accogliente e staff qualificato.",
    "Campi illuminati per partite serali.",
    "Ampio parcheggio gratuito disponibile."
  ];
  return descrizioni[Math.floor(Math.random() * descrizioni.length)];
}

export function generateStrutturaName(city: string, index: number): string {
  const nomi = [
    "Beach Arena",
    "Sport Village",
    "Beach Center",
    "Arena Club",
    "Volley Park",
    "Beach House"
  ];
  return `${nomi[index % nomi.length]} ${city}`;
}

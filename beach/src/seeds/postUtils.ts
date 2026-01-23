// Funzioni di generazione post e commenti

export function generatePostContent(isStruttura: boolean = false): string {
  const contenuti = isStruttura
    ? [
        "Nuovo torneo in arrivo!",
        "Prenota il tuo campo per il weekend!",
        "Promozione speciale per i nuovi iscritti.",
        "Foto della finale di ieri!",
        "Grazie a tutti per la partecipazione!"
      ]
    : [
        "Grande partita oggi!",
        "Cerco compagni per sabato.",
        "Chi viene a giocare domani?",
        "Complimenti agli avversari!",
        "Mi sono divertito un sacco!"
      ];
  return contenuti[Math.floor(Math.random() * contenuti.length)];
}

export function generateComment(): string {
  const commenti = [
    "Bravo!",
    "Ci vediamo in campo!",
    "Ottima organizzazione.",
    "A presto!",
    "Grande squadra!"
  ];
  return commenti[Math.floor(Math.random() * commenti.length)];
}

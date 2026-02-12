# Descrizione logica componenti player (Dashboard)

## 1. Header
Visualizza le informazioni principali dell'utente e il numero di inviti pendenti. Mostra un saluto personalizzato e funge da "benvenuto" nella dashboard.

## 2. NextMatchCard
Mostra la prossima partita dell'utente (prenotazione futura o in corso). Se non ci sono partite, viene mostrato uno stato vuoto con invito a prenotare.

## 3. InviteCard
Visualizza gli inviti a partite in attesa di risposta. Permette di accettare o rifiutare l'invito e di vedere i dettagli della partita.

## 4. RecentMatchesCarousel
Carosello che mostra le ultime partite completate con risultati. Permette di accedere rapidamente ai dettagli delle partite passate.

## 5. SuggestedFriendCard / SuggestedItemsCarousel
Suggerisce amici o strutture da seguire, in base alle preferenze dell’utente e alle sue interazioni. Permette di inviare richieste di amicizia o seguire strutture.

## 6. OpenMatchCard
Mostra le partite aperte disponibili nelle vicinanze (filtrate per posizione GPS, città preferita o strutture visitate). Permette di unirsi rapidamente a una partita.

## 7. EmptyStateCard
Componente generico per mostrare stati vuoti (es. nessuna partita, nessun invito, nessun suggerimento). Offre azioni alternative (es. "Prenota ora", "Cerca partite").

## 8. Quick Action Buttons
Due pulsanti rapidi per accedere a "Prenota un campo" (naviga alla tab Strutture) e "Community" (naviga alla sezione community/amici).

## 9. Filtri geografici (useGeographicMatchFiltering)
Gestisce il filtraggio delle partite aperte in base a:
- Posizione GPS attuale
- Città preferita impostata nelle preferenze
- Strutture già visitate

## 10. useSuggestedItems
Hook che recupera e gestisce la logica dei suggerimenti (amici e strutture) da mostrare all’utente.

## 11. Gestione inviti
- Carica tutti i match in cui l’utente è invitato e non ha ancora risposto.
- Filtra inviti scaduti (meno di 2 ore all’inizio della partita).
- Permette di accettare/rifiutare direttamente dalla dashboard.

## 12. Caricamento dati e refresh
- Carica dati principali (prossima partita, inviti, partite recenti, suggerimenti) all’apertura della schermata e al refresh manuale.
- Mostra indicatori di caricamento durante le operazioni asincrone.

## 13. Navigazione
Tutti i componenti interattivi permettono di navigare verso schermate di dettaglio (es. dettaglio partita, profilo utente, dettaglio struttura, storico partite, preferenze, ecc.).

---
Ogni componente è pensato per offrire un'esperienza utente fluida, con dati sempre aggiornati e azioni rapide per le attività più frequenti di un giocatore.
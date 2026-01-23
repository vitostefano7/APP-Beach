# Indicazioni e logica del file `seeds.ts`

Questo file genera dati di test per l'app Beach Volley, popolando il database MongoDB con utenti, strutture, campi, prenotazioni, match, post, follower, notifiche e altro. Di seguito tutte le principali logiche, configurazioni e regole considerate:

## 1. Configurazione Generale
- **Database:** Connessione a MongoDB tramite variabili d'ambiente (`MONGO_URI`)
- **Cloudinary:** Upload di avatar utenti e immagini strutture tramite variabili d'ambiente
- **Password default:** Tutti gli utenti hanno password `123`
- **Quantità dati:**
  - 500 player
  - 50 owner
  - 100 strutture
  - 500 post utenti
  - 200 post strutture
  - 1000 prenotazioni passate
  - 500 prenotazioni future
  - 3 mesi di calendario rolling

## 2. Avatar e Immagini Strutture
- Upload automatico su Cloudinary da `images/profilo` e `images/struttura`
- Se mancano immagini, i campi avatarUrl e images restano vuoti

## 3. Generazione Utenti
- Nomi e cognomi italiani casuali
- Email e username unici, generati in modo deterministico
- Ruolo: `player` o `owner`
- Circa 10% dei player con profilo privato
- Avatar assegnato ciclicamente dagli avatar disponibili

## 4. Profili e Preferenze
- Ogni player ha un profilo con livello, partite giocate, rating
- Preferenze: notifiche push, dark mode, privacy, città preferita, sport preferiti, fascia oraria
- la citta preferità deve essere coerente tra il nome e la sua latitudine e longitudine

## 5. Amicizie
- Ogni player ha 5-15 amicizie casuali (no duplicati né auto-amicizie)
- Stato: `accepted` o `pending`
- Se accepted, può essere reciproca

## 6. Strutture
- 100 strutture con owner casuale
- Nome, descrizione, città, indirizzo, coordinate, amenities random (ma l'indirizzo, città e coordinate devono essere coerenti e reali)
- 30% featured, ~20% con split costi abilitato
- 2-4 immagini random per struttura (se disponibili)

## 7. Followers
- I player seguono 1-3 strutture random
- Le strutture seguono 3-5 player random
- Alcuni casi test fissi (Mario segue le prime strutture, ecc.)

## 8. Post
- 500 post utenti, 200 post strutture
- Like e commenti random
- I post delle strutture sono associati all'owner e alla struttura

## 9. Campi
- Ogni struttura ha 2-3 campi (prime 3 strutture ne hanno 3)
- Sport: beach volley o volley
- i campo da volley sono da 5v5 mentre i campi da beach possono essere da 2v2, 3v3, 4v4
- Prezzi flat e avanzati, con regole per fasce orarie, date e periodi
- Pricing per numero giocatori abilitato per tutti i campi beach volley

## 10. Calendario
- Generazione di slot ogni 30 minuti per 3 mesi per ogni campo
- Slot disabilitati se prenotati

## 11. Prenotazioni
- 1000 passate, 500 future
- Pubbliche (split payment) solo se la struttura lo consente
- Numero giocatori variabile per beach volley
- Slot prenotati disabilitati nel calendario

## 12. Match
- Vari stati: completati con/senza risultato, in corso, aperti, completi, bozza
- **100 match aperti futuri** con vari stati:
  - **70% complete**: tutti i posti occupati (maxPlayers giocatori)
  - **30% incomplete**: parzialmente riempite (30-70% dei posti)
- Partecipanti random, team A/B, risultati realistici
- Match pubblici solo se la struttura lo consente
- le partite di beach devono essere un misto di 2v2 fino a 4v4
- **Validazione team**: controlli per assicurare che entrambi i team (A e B) abbiano almeno un giocatore
- **Organizzatore sempre nel team A**: per tutte le partite future (draft, open, full, in progress)
- Match completati con team vuoti vengono saltati con warning

## 13. Conversazioni e Messaggi
- Conversazioni dirette (utente-struttura) e di gruppo (match)
- Messaggi di esempio per ogni conversazione

## 14. Notifiche
- Notifiche di follower, inviti match, join, risultati, nuove prenotazioni
- Alcune lette, altre non lette

## 15. File di output
- Genera anche un file `lista_utenti.txt` con tutti player e owner generati

---

**Nota:**
- Tutti i dati sono generati in modo casuale ma realistico, con attenzione a coprire tutti i casi d'uso dell'app.
- Alcuni scenari di test sono forzati (privacy, split payment, advanced pricing, ecc.)
- Per modificare la quantità di dati, cambiare le costanti in testa al file.

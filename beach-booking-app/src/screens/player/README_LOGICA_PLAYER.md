# Descrizione logica componenti area /player

## Dashboard
- **DashboardScreen**: Mostra riepilogo rapido (prossima partita, inviti, partite aperte, suggerimenti, ultime partite). Gestisce caricamento dati, filtri geografici, refresh e navigazione rapida.

## Profilo
- **ProfileScreen**: Mostra il profilo dell’utente, statistiche, info personali, accesso a modifica profilo e privacy.
- **EditProfileScreen**: Permette modifica dati personali, avatar, bio, ecc.
- **UserProfileScreen**: Visualizza il profilo di un altro utente (amico o sconosciuto), con possibilità di inviare richiesta amicizia o seguire.
- **FriendsListScreen**: Elenco amici, gestione richieste, accesso ai profili.
- **SettingsScreen**: Impostazioni generali dell’account (notifiche, lingua, ecc.).
- **PrivacySecurityScreen**: Gestione privacy, blocco utenti, visibilità dati.
- **SetupPreferencesScreen**: Configurazione preferenze iniziali (città, sport, notifiche).
- **ThemeContext**: Gestione tema chiaro/scuro.
- **components/StatsCard, StatsCarousel**: Visualizzazione statistiche e risultati personali.

## Prenotazioni
- **LeMiePrenotazioniScreen**: Elenco prenotazioni future e passate dell’utente.
- **DettaglioPrenotazioneScreen**: Dettaglio di una prenotazione (campo, orari, partecipanti, stato, azioni su inviti, gestione squadra, risultati).
- **ConfermaPrenotazioneScreen**: Conferma e riepilogo prenotazione prima dell’invio.
- **DettaglioPrenotazione/components**: Card, modali e visualizzazioni per dettagli, punteggi, cambio squadra, ecc.
- **DettaglioPrenotazione/utils, types, styles**: Utility, tipi e stili per la gestione dettagliata delle prenotazioni.

## Strutture
- **StruttureScreen**: Elenco strutture disponibili, ricerca e filtri.
- **StrutturaDetailScreen**: Dettaglio struttura (campi, servizi, recensioni, posizione, follower).
- **StrutturaFollowersScreen**: Elenco utenti che seguono la struttura.
- **FieldDetailsScreen**: Dettaglio di un campo specifico (disponibilità, prezzi, calendario, prenotazione diretta).
- **FieldDetailsScreen/calendar, pricing, types, api**: Gestione calendario disponibilità, prezzi dinamici, tipi campo, chiamate API.

## Comunicazioni
- **ChatScreen**: Chat 1:1 tra utenti (testo, immagini, notifiche).
- **GroupChatScreen**: Chat di gruppo (es. gruppo partita).
- **ConversazioneScreen**: Dettaglio conversazione, gestione messaggi, partecipanti.

## Utility e Stili
- **utils-player/**: Funzioni di supporto per logica di schermi player (es. filtri, parsing dati, utility per strutture/profili/campi).
- **styles-player/**: File di stile per ogni schermata principale (profilo, strutture, notifiche, chat, ecc.).

---
Ogni componente è pensato per coprire un aspetto specifico dell’esperienza utente player: gestione partite, social, prenotazioni, strutture, comunicazione e personalizzazione.

---

## Funzionamento logico generale e scelte progettuali

- **Modularità**: Ogni macro-area (dashboard, profilo, prenotazioni, strutture, comunicazioni) è suddivisa in schermate e componenti riutilizzabili, per facilitare manutenzione e scalabilità.

- **Gestione stato asincrona**: Tutti i dati vengono caricati tramite chiamate API asincrone, con indicatori di caricamento e gestione errori. I refresh sono centralizzati per garantire dati sempre aggiornati.

- **Filtri e personalizzazione**: L’esperienza utente è personalizzata tramite filtri geografici (GPS, città preferita, strutture visitate) e suggerimenti dinamici (amici, strutture, partite).

- **Navigazione fluida**: Tutte le azioni principali portano rapidamente alle schermate di dettaglio o alle funzioni più usate (es. prenota, invita, chatta, modifica profilo).

- **Comunicazione e social**: Forte integrazione tra gestione partite e funzioni social (amicizie, inviti, chat, follower), per incentivare l’interazione tra utenti.

- **Sicurezza e privacy**: Sono presenti schermate e logiche dedicate a privacy, sicurezza e gestione dei dati personali, con possibilità di bloccare utenti e gestire la visibilità delle informazioni.

- **Esperienza mobile-first**: Tutte le scelte di UI/UX sono pensate per un utilizzo da smartphone, con caroselli, pulsanti rapidi, modali e feedback visivi immediati.

- **Estendibilità**: La struttura a cartelle e componenti permette di aggiungere facilmente nuove funzionalità (es. nuovi filtri, tipi di notifiche, statistiche avanzate) senza impattare il resto dell’app.

Queste scelte garantiscono un’esperienza coerente, intuitiva e facilmente evolvibile per l’utente player.

---

## Dettaglio logico delle principali componenti

### DashboardScreen
- Carica e mostra riepilogo rapido: prossima partita, inviti pendenti, partite aperte, suggerimenti, ultime partite.
- Gestisce refresh manuale e automatico dei dati.
- Applica filtri geografici (GPS, città preferita, strutture visitate) per suggerire partite rilevanti.
- Permette azioni rapide: prenotazione, accesso community, risposta inviti, navigazione dettagli.

### ProfileScreen
- Mostra dati utente, statistiche, storico partite, badge e progressi.
- Permette accesso a modifica profilo, privacy, impostazioni.
- Visualizza componenti statistiche (StatsCard, StatsCarousel).

### EditProfileScreen
- Permette modifica dati personali, avatar, preferenze.
- Gestisce validazione e invio dati aggiornati al backend.

### UserProfileScreen
- Visualizza profilo di altri utenti (amici o sconosciuti).
- Permette invio richiesta amicizia, follow, visualizzazione partite comuni.

### FriendsListScreen
- Elenco amici, gestione richieste in entrata/uscita.
- Navigazione rapida ai profili amici.

### SettingsScreen
- Impostazioni generali: notifiche, lingua, tema, logout.

### PrivacySecurityScreen
- Gestione privacy: visibilità dati, blocco utenti, gestione consensi.

### SetupPreferencesScreen
- Configurazione guidata preferenze iniziali (città, sport, notifiche).

### LeMiePrenotazioniScreen
- Elenco prenotazioni future e passate.
- Filtri per stato, data, struttura.
- Accesso rapido ai dettagli prenotazione.

### DettaglioPrenotazioneScreen
- Mostra dettagli completi di una prenotazione: campo, orari, partecipanti, stato inviti, risultati.
- Permette azioni: accetta/rifiuta invito, cambio squadra, inserimento risultato.
- Usa componenti modali per gestione punteggi, team, dettagli.

### ConfermaPrenotazioneScreen
- Riepilogo finale prima della conferma prenotazione.
- Mostra costi, dettagli campo, partecipanti.

### StruttureScreen
- Elenco strutture disponibili, ricerca per nome/città/servizi.
- Filtri avanzati e ordinamento.
- Accesso rapido a dettagli struttura.

### StrutturaDetailScreen
- Dettaglio struttura: campi, servizi, recensioni, posizione, follower.
- Permette seguire struttura, vedere eventi e partite.

### StrutturaFollowersScreen
- Elenco utenti che seguono la struttura.
- Navigazione ai profili follower.

### FieldDetailsScreen
- Dettaglio campo: disponibilità, prezzi, calendario, prenotazione diretta.
- Mostra slot disponibili e permette prenotazione immediata.

### ChatScreen / GroupChatScreen / ConversazioneScreen
- Gestione chat 1:1 e di gruppo.
- Invio/ricezione messaggi, immagini, notifiche.
- Visualizzazione partecipanti, stato lettura, gestione gruppi.

### Componenti di supporto (StatsCard, StatsCarousel, modali, card)
- Visualizzazione statistiche, risultati, dettagli partita.
- Modali per cambio squadra, inserimento punteggio, conferme azioni.

### Utility e Styles
- Utility per parsing dati, filtri, gestione preferenze.
- File di stile per coerenza grafica e responsività.

---

## Esempi e casistiche logiche delle principali componenti

### DashboardScreen
- Se l’utente ha una partita in corso, viene mostrata come "Partita in corso"; se la prossima partita è futura, viene mostrata come "La tua prossima partita".
- Se ci sono inviti pendenti (non scaduti, non creati da sé), vengono mostrati in cima, con possibilità di accettare/rifiutare.
- Se non ci sono partite aperte nelle vicinanze (in base a GPS/città/strutture visitate), viene suggerito di cercare o impostare preferenze.
  - La logica controlla prima se sono disponibili coordinate GPS: se sì, filtra le partite aperte entro un raggio (es. 30km) dalla posizione attuale.
  - Se non c’è GPS, controlla se l’utente ha impostato una città preferita: in tal caso, filtra le partite entro il raggio specificato dalla città.
  - Se non ci sono né GPS né città preferita, verifica se l’utente ha già giocato in alcune strutture e mostra solo le partite in quelle strutture.
  - Se nessuno di questi criteri restituisce partite disponibili, viene mostrato uno stato vuoto con:
    - Un messaggio che spiega che non ci sono partite aperte nelle vicinanze o nelle strutture note.
    - Un pulsante per cercare tra tutte le partite disponibili (rimuovendo i filtri geografici).
    - Se l’utente non ha una città preferita, viene suggerito di impostarla tramite un pulsante che porta alle preferenze.
  - Questo garantisce che l’utente abbia sempre un’azione proposta e capisca perché non vede partite.
- Se l’utente ha partite completate con risultati, viene mostrato il carosello; altrimenti uno stato vuoto.
- I suggerimenti (amici/strutture) cambiano dinamicamente in base alle interazioni e preferenze.

### ProfileScreen & UserProfileScreen
- Se visualizzo il mio profilo, posso modificarlo; se visualizzo quello di un altro utente, posso inviare richiesta amicizia o seguirlo.
- Se l’utente è già amico, viene mostrata l’opzione per rimuovere l’amicizia.
- Se il profilo è privato, alcune informazioni sono nascoste.

### FriendsListScreen
- Se ho richieste in sospeso, vengono mostrate in cima.
- Se la lista è vuota, viene suggerito di cercare nuovi amici.

### LeMiePrenotazioniScreen
- Se non ho prenotazioni future, viene suggerito di prenotare un campo.
- Se una prenotazione è in attesa di conferma, viene evidenziata.
- Se una partita è stata annullata, viene mostrata come tale.

### DettaglioPrenotazioneScreen
- Se sono invitato, posso accettare/rifiutare; se sono il creatore, posso gestire squadre e inviti.
- Se la partita è completata, posso inserire il risultato (se abilitato).
- Se la partita è in corso, alcune azioni sono disabilitate.

### StruttureScreen & StrutturaDetailScreen
- Se non ci sono strutture nella città selezionata, viene suggerito di cambiare città o ampliare la ricerca.
- Se seguo già una struttura, il pulsante cambia stato.
- Se una struttura non ha campi disponibili, viene mostrato un avviso.

### FieldDetailsScreen
- Se il campo è già prenotato in una fascia oraria, lo slot non è selezionabile.
- Se provo a prenotare senza essere loggato, vengo reindirizzato al login.

### ChatScreen / GroupChatScreen
- Se ricevo un nuovo messaggio, viene mostrata una notifica.
- Se sono stato rimosso da un gruppo, non posso più inviare messaggi.

### Utility e gestione errori
- Se una chiamata API fallisce, viene mostrato un messaggio di errore e la UI si aggiorna di conseguenza.
- Se i dati sono vuoti o non disponibili, viene sempre mostrato uno stato "empty" con suggerimento all’azione.

Queste casistiche coprono i principali flussi e comportamenti previsti per offrire un’esperienza utente chiara e reattiva in ogni situazione.
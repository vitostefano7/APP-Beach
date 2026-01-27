# ScoreModal Component

Componente modale riutilizzabile per l'inserimento dei risultati dei match di beach volley (al meglio di 3 set).

## ✨ Caratteristiche

- ✅ **Design moderno** e coerente con gli altri modal del progetto
- ✅ **Validazione regole Beach Volley**: max 21 punti o ad oltranza con +2 vantaggio
- ✅ **Validazione regole Pallavolo**: max 25 punti o ad oltranza con +2 vantaggio
- ✅ **Header colorato** con icona trofeo e titolo accattivante
- ✅ **Input eleganti** con etichette Team A / Team B
- ✅ **Indicatori visivi** del vincitore di ogni set (badge con trofeo)
- ✅ **Card vincitore** animata con colore distintivo
- ✅ **Validazione completa** con messaggi di errore chiari
- ✅ **Loading state** durante il salvataggio
- ✅ **Completamente riutilizzabile** (player e owner)
- ✅ **Responsive** con maxHeight e maxWidth
- ✅ **Supporto iOS e Android** con shadow/elevation

## 🎨 Miglioramenti Estetici

### Rispetto alla versione precedente:
- Header con colore blu del progetto (`#2196F3`) invece di sfondo bianco
- Modal centrato con overlay scuro (60% opacità)
- Input più grandi (70x60) con bordi arrotondati
- Evidenziazione verde per i set vinti
- Card vincitore con sfondo colorato (verde per Team A, arancione per Team B)
- Bottoni con icone, colore blu principale e ombre
- Help text con icona informativa

## 📦 Utilizzo

```tsx
import ScoreModal from '../../../components/ScoreModal';

// Nel componente
const [showScoreModal, setShowScoreModal] = useState(false);

const handleSaveScore = async (winner: 'A' | 'B', sets: Set[]) => {
  // Logica di salvataggio
  console.log('Winner:', winner);
  console.log('Sets:', sets);
};

// Nel render
<ScoreModal
  visible={showScoreModal}
  onClose={() => setShowScoreModal(false)}
  onSave={handleSaveScore}
  currentScore={currentScore} // Opzionale - per pre-compilare i campi
  matchStatus="in_progress"   // Opzionale
/>
```

## Props

| Prop | Tipo | Required | Default | Descrizione |
|------|------|----------|---------|-------------|
| `visible` | `boolean` | ✅ | - | Visibilità della modal |
| `onClose` | `() => void` | ✅ | - | Callback per chiudere la modal |
| `onSave` | `(winner: 'A' \| 'B', sets: Set[]) => Promise<void>` | ✅ | - | Callback per salvare il risultato |
| `currentScore` | `{ winner?: 'A' \| 'B'; sets: Set[] }` | ❌ | - | Punteggio attuale per pre-compilare i campi |
| `matchStatus` | `string` | ❌ | - | Stato del match (per riferimento futuro) |
| `sportType` | `'beachvolley' \| 'volleyball'` | ❌ | `'beachvolley'` | Tipo di sport per applicare le regole corrette |

### Tipo `Set`

```typescript
interface Set {
  teamA: number;
  teamB: number;
}
```

## Logica di Validazione

### Regole Beach Volley (default)
- **Punteggio standard**: Set vinto con 21 punti se l'avversario ha massimo 19 punti
- **Sul 20-20**: Si va ad oltranza, necessario vantaggio di 2 punti (22-20, 23-21, 24-22, ecc.)
- **Esempio valido**: 21-19 ✅, 21-18 ✅, 22-20 ✅, 25-23 ✅
- **Esempio non valido**: 21-20 ❌, 21-21 ❌, 22-21 ❌, 20-18 ❌

### Regole Pallavolo
- **Punteggio standard**: Set vinto con 25 punti se l'avversario ha massimo 23 punti
- **Sul 24-24**: Si va ad oltranza, necessario vantaggio di 2 punti (26-24, 27-25, 28-26, ecc.)
- **Esempio valido**: 25-23 ✅, 25-22 ✅, 26-24 ✅, 30-28 ✅
- **Esempio non valido**: 25-24 ❌, 25-25 ❌, 26-25 ❌, 24-22 ❌

### Match
1. **Minimo 2 set**: Devono essere compilati almeno i primi 2 set
2. **Determinazione vincitore**: Chi vince 2 set su 3 viene dichiarato vincitore
3. **No pareggi**: Non è possibile salvare un risultato in pareggio (1-1)

## Esempio Completo

```tsx
import React, { useState } from 'react';
import ScoreModal from '../../../components/ScoreModal';

const DettaglioPrenotazione = () => {
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [currentScore, setCurrentScore] = useState({
    winner: undefined,
    sets: [],
  });

  const handleSaveScore = async (winner: 'A' | 'B', sets: Set[]) => {
    try {
      // API call per salvare il risultato
      const response = await fetch(`${API_URL}/bookings/${bookingId}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ winner, sets }),
      });

      if (!response.ok) {
        throw new Error('Errore nel salvataggio');
      }

      // Aggiorna lo stato locale
      setCurrentScore({ winner, sets });
      
      // Chiudi la modal
      setShowScoreModal(false);
    } catch (error) {
      console.error('Errore:', error);
      throw error; // Lascia che la modal gestisca l'errore
    }
  };

  return (
    <>
      {/* Tuo contenuto */}
      <Button onPress={() => setShowScoreModal(true)}>
        Inserisci Risultato
      </Button>

      {/* Modal */}
      <ScoreModal
        visible={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        onSave={handleSaveScore}
        currentScore={currentScore}
        matchStatus="in_progress"
        sportType="beachvolley" // o "volleyball"
      />
    </>
  );
};
```

## Percorso nel Progetto

Il componente si trova in: `src/components/ScoreModal/`

Viene utilizzato sia lato player che lato owner tramite re-export:
- Player: `src/screens/player/prenotazioni/DettaglioPrenotazione/components/ScoreModal.tsx`
- Owner: `src/screens/owner/prenotazioni/DettaglioPrenotazione/components/ScoreModal.tsx`

## Note

- Il componente gestisce automaticamente il reset dei campi quando viene aperto/chiuso
- Durante il salvataggio, tutti i controlli sono disabilitati
- Gli errori vengono gestiti tramite `Alert.alert()` di React Native

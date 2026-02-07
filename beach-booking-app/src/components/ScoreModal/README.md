# ScoreModal Component

Componente modale riutilizzabile per l'inserimento dei risultati delle partite. **Supporta tutti gli sport della piattaforma** con regole di punteggio specifiche.

## ✨ Caratteristiche

- ✅ **Multi-sport**: Volley, Beach Volley, Tennis, Padel, Beach Tennis, Calcio, Calcetto, Calciotto, Calcio a 7, Basket
- ✅ **3 sistemi di punteggio**: Set-based (punti), Set-based (giochi), Point-based
- ✅ **Validazione intelligente** per ogni sport con regole specifiche
- ✅ **Design moderno** e coerente con gli altri modal del progetto
- ✅ **UI adattiva**: mostra 3 set per sport set-based, 1 campo per point-based
- ✅ **Supporto pareggio** per sport che lo consentono (calcio, calcetto, etc.)
- ✅ **Header colorato** con icona trofeo e descrizione sport
- ✅ **Input eleganti** con etichette Team A / Team B
- ✅ **Indicatori visivi** del vincitore di ogni set (badge con trofeo)
- ✅ **Card vincitore** animata con colore distintivo (verde Team A, arancione Team B, grigio pareggio)
- ✅ **Validazione completa** con messaggi di errore chiari e specifici
- ✅ **Loading state** durante il salvataggio
- ✅ **Completamente riutilizzabile** (player e owner)
- ✅ **Responsive** con maxHeight e maxWidth
- ✅ **Supporto iOS e Android** con shadow/elevation

## 🏆 Sport Supportati

### 1. Set-Based (Punti)
- **Volley**: 25 punti per set, best of 3
- **Beach Volley**: 21 punti per set, best of 3

### 2. Set-Based (Giochi)
- **Tennis**: 6 giochi per set, best of 3
- **Padel**: 6 giochi per set, best of 3
- **Beach Tennis**: 7-9 giochi, single set

### 3. Point-Based
- **Calcio**: punteggio finale, pareggio consentito
- **Calcetto**: punteggio finale, pareggio consentito
- **Calciotto**: punteggio finale, pareggio consentito
- **Calcio a 7**: punteggio finale, pareggio consentito
- **Basket**: punteggio finale, pareggio NON consentito

## 📦 Utilizzo

```tsx
import ScoreModal from '../../../components/ScoreModal/ScoreModal';

// Nel componente
const [showScoreModal, setShowScoreModal] = useState(false);

const handleSaveScore = async (winner: 'A' | 'B', sets: Set[]) => {
  // Logica di salvataggio
  console.log('Winner:', winner);
  console.log('Sets:', sets);
};

// ESEMPIO 1: Beach Volley
<ScoreModal
  visible={showScoreModal}
  onClose={() => setShowScoreModal(false)}
  onSave={handleSaveScore}
  sportType="beach_volley"
  currentScore={currentScore} // Opzionale - per pre-compilare i campi
/>

// ESEMPIO 2: Tennis
<ScoreModal
  visible={showScoreModal}
  onClose={() => setShowScoreModal(false)}
  onSave={handleSaveScore}
  sportType="tennis"
/>

// ESEMPIO 3: Calcio (con pareggio)
<ScoreModal
  visible={showScoreModal}
  onClose={() => setShowScoreModal(false)}
  onSave={handleSaveScore}
  sportType="calcio"
/>

// ESEMPIO 4: Basket (senza pareggio)
<ScoreModal
  visible={showScoreModal}
  onClose={() => setShowScoreModal(false)}
  onSave={handleSaveScore}
  sportType="basket"
/>
```

## 📋 Props

| Prop | Tipo | Required | Default | Descrizione |
|------|------|----------|---------|-------------|
| `visible` | `boolean` | ✅ | - | Visibilità della modal |
| `onClose` | `() => void` | ✅ | - | Callback per chiudere la modal |
| `onSave` | `(winner: 'A' \| 'B', sets: Set[]) => Promise<void>` | ✅ | - | Callback per salvare il risultato |
| `sportType` | `string` | ❌ | `'beach_volley'` | Tipo di sport (vedi lista sotto) |
| `currentScore` | `{ winner?: 'A' \| 'B'; sets: Set[] }` | ❌ | - | Punteggio attuale per pre-compilare i campi |
| `matchStatus` | `string` | ❌ | - | Stato del match (per riferimento futuro) |

### Valori sportType supportati

```typescript
// Set-based (punti)
'volley' | 'volleyball' | 'beach_volley' | 'beach volley' | 'beachvolley'

// Set-based (giochi)
'tennis' | 'padel' | 'beach_tennis' | 'beach tennis'

// Point-based
'calcio' | 'calcetto' | 'calciotto' | 'calcio_a_7' | 'basket' | 'basketball'

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
        sportType="beach_volley" // o "volley", "tennis", "calcio", etc.
        currentScore={currentScore}
        matchStatus="in_progress"
      />
    </>
  );
};
```

## 🎯 Estensione Futura

Per aggiungere nuovi sport, è sufficiente aggiornare la funzione `getSportConfig()` nel componente:

```typescript
if (sportLower === 'nuovo_sport') {
  return {
    category: 'set-points', // o 'set-games' o 'point-based'
    maxPointsPerSet: 15,
    setsToWin: 3, // best of 5
    label: 'Nuovo Sport (max 15 punti/set, best of 5)',
  };
}
```

Il componente gestirà automaticamente UI e validazione in base alla categoria.

## 📂 Percorso nel Progetto

Il componente si trova in: `src/components/ScoreModal/ScoreModal.tsx`

Viene utilizzato sia lato player che lato owner direttamente o tramite re-export nelle specifiche schermate di dettaglio prenotazione.

## 📝 Note Implementative

- Il componente gestisce automaticamente il reset dei campi quando viene aperto/chiuso
- Durante il salvataggio, tutti i controlli sono disabilitati
- Gli errori vengono gestiti tramite `Alert.alert()` di React Native
- La validazione avviene in tempo reale mentre si inseriscono i punteggi
- Indicatori visivi mostrano il vincitore di ogni set e del match complessivo
- Per sport point-based con pareggio consentito, viene mostrata una card grigia "Pareggio"


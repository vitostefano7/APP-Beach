# Struttura Centralizzata DettaglioPrenotazione

Questa cartella contiene i componenti, hook e utilità condivise per la visualizzazione dei dettagli di una prenotazione, utilizzabili sia dai player che dagli owner.

## 📁 Struttura

```
src/components/booking/
├── components/          # Componenti UI riutilizzabili
│   ├── AnimatedComponents.tsx
│   ├── GradientComponents.tsx
│   ├── BookingHeader.tsx
│   ├── FieldInfoCard.tsx
│   └── BookingDetailsCard.tsx
├── hooks/              # Hook personalizzati per la logica
│   ├── useBookingData.ts
│   └── useMatchActions.ts
├── types/              # TypeScript types
│   └── booking.types.ts
├── utils/              # Funzioni di utilità
│   └── bookingUtils.ts
└── index.ts           # Export centrale
```

## 🎯 Come Usare

### Opzione 1: Usare la Schermata Condivisa (Consigliata)

La schermata `DettaglioPrenotazioneSharedScreen` può essere usata direttamente:

```tsx
import { DettaglioPrenotazioneSharedScreen } from '../../screens/shared/DettaglioPrenotazioneScreen';

// Per Player
export default function DettaglioPrenotazioneScreen() {
  const route = useRoute<any>();
  const { bookingId } = route.params;
  const navigation = useNavigation();

  return (
    <DettaglioPrenotazioneSharedScreen
      role="player"
      bookingId={bookingId}
      onNavigateBack={() => navigation.goBack()}
    />
  );
}

// Per Owner
export default function OwnerDettaglioPrenotazioneScreen() {
  const route = useRoute<any>();
  const { bookingId } = route.params;
  const navigation = useNavigation();

  return (
    <DettaglioPrenotazioneSharedScreen
      role="owner"
      bookingId={bookingId}
      onNavigateBack={() => navigation.goBack()}
    />
  );
}
```

### Opzione 2: Usare i Componenti e Hook Separatamente

Se hai bisogno di più controllo, puoi comporre i componenti manualmente:

```tsx
import {
  useBookingData,
  useMatchActions,
  BookingHeader,
  FieldInfoCard,
  BookingDetailsCard,
  AnimatedCard,
  calculateDuration,
  isMatchInProgress,
} from '../../components/booking';

export default function MyCustomBookingScreen() {
  const route = useRoute<any>();
  const { bookingId } = route.params;

  // Hook per i dati
  const { booking, loading, error, isCreator, isInMatch, loadBooking, updateBookingState } = 
    useBookingData({ bookingId, role: 'player' });

  // Hook per le azioni
  const { handleJoinMatch, handleLeaveMatch, handleSubmitScore } = 
    useMatchActions({ booking, token, userId, updateBookingState, loadBooking });

  return (
    <SafeAreaView>
      <BookingHeader
        onBack={() => navigation.goBack()}
        title="Dettagli Partita"
      />
      
      <ScrollView>
        <FieldInfoCard
          struttura={booking.campo.struttura}
          campo={booking.campo}
          showChatButton={true}
        />
        
        <BookingDetailsCard
          date={booking.date}
          startTime={booking.startTime}
          endTime={booking.endTime}
          duration={calculateDuration(booking.startTime, booking.endTime)}
          price={booking.price}
          createdAt={booking.createdAt}
        />
        
        {/* Il tuo codice custom qui */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

## 🧩 Componenti Disponibili

### BookingHeader
Header con bottone indietro e titolo

```tsx
<BookingHeader
  onBack={() => navigation.goBack()}
  title="Dettagli Partita"
  showCancelButton={true}
  onCancel={handleCancelBooking}
/>
```

### FieldInfoCard
Card con informazioni sul campo e struttura

```tsx
<FieldInfoCard
  struttura={booking.campo.struttura}
  campo={booking.campo}
  onStrutturaPress={handleOpenStrutturaDetails}
  onChatPress={handleOpenStrutturaChat}
  onMapPress={handleOpenMaps}
  showChatButton={role === 'player'}
/>
```

### BookingDetailsCard
Card con dettagli della prenotazione

```tsx
<BookingDetailsCard
  date={booking.date}
  startTime={booking.startTime}
  endTime={booking.endTime}
  duration={calculateDuration(booking.startTime, booking.endTime)}
  price={booking.price}
  createdAt={booking.createdAt}
  isPublic={booking.match?.isPublic}
/>
```

### Componenti Animati

```tsx
import { AnimatedCard, AnimatedButton, FadeInView, SlideInView, ScaleInView } from '../../components/booking';

<AnimatedCard delay={100}>
  {/* contenuto */}
</AnimatedCard>

<AnimatedButton onPress={handlePress}>
  {/* contenuto */}
</AnimatedButton>

<FadeInView delay={200}>
  {/* contenuto */}
</FadeInView>
```

### Componenti Gradient

```tsx
import { TeamAGradient, TeamBGradient, WinnerGradient, SuccessGradient } from '../../components/booking';

<TeamAGradient style={styles.teamButton}>
  <Text>Team A</Text>
</TeamAGradient>
```

## 🎣 Hook Disponibili

### useBookingData
Gestisce il caricamento e lo stato dei dati del booking

```tsx
const {
  booking,        // Dati del booking
  loading,        // Loading state
  error,          // Errore
  user,           // Utente corrente
  userId,         // ID utente
  token,          // Token auth
  isCreator,      // Se l'utente è il creatore
  currentUserPlayer, // Player corrente nel match
  isPendingInvite,   // Se ha un invito pendente
  isInMatch,      // Se è nel match
  loadBooking,    // Funzione per ricaricare
  updateBookingState, // Funzione per aggiornare lo state
} = useBookingData({ bookingId, role, onNavigateBack });
```

### useMatchActions
Gestisce tutte le azioni sul match

```tsx
const {
  acceptingInvite,      // Loading state
  leavingMatch,         // Loading state
  handleJoinMatch,      // Unisciti al match
  handleLeaveMatch,     // Abbandona il match
  handleRespondToInvite, // Rispondi a invito
  handleInvitePlayer,   // Invita giocatore
  handleRemovePlayer,   // Rimuovi giocatore
  handleAssignTeam,     // Assegna team
  handleSubmitScore,    // Inserisci risultato
  handleCancelBooking,  // Annulla prenotazione (owner)
} = useMatchActions({ booking, token, userId, updateBookingState, loadBooking });
```

## 🛠️ Utilità Disponibili

```tsx
import {
  formatDate,
  formatDateTime,
  calculateDuration,
  isMatchInProgress,
  isMatchPassed,
  isRegistrationOpen,
  isWithin24Hours,
  getTimeUntilMatchStart,
  getTimeUntilRegistrationDeadline,
  getMatchStatus,
  getMatchStatusInfo,
  getTeamColors,
  getTeamIcon,
  getUserId,
  isSameUser,
  submitMatchScore,
} from '../../components/booking';
```

## 📝 Types Disponibili

```tsx
import type {
  Player,
  Set,
  MatchDetails,
  BookingDetails,
  UserRole,
  BookingScreenProps,
} from '../../components/booking';
```

## 🎨 Vantaggi di questa Struttura

1. **DRY (Don't Repeat Yourself)**: Codice condiviso invece di duplicato
2. **Manutenibilità**: Modifiche in un solo posto
3. **Type Safety**: TypeScript types condivisi
4. **Testabilità**: Componenti e hook isolati e testabili
5. **Scalabilità**: Facile aggiungere nuove funzionalità
6. **Consistenza**: UI e comportamento uniformi tra player e owner

## 🔄 Migrazione Graduale

Puoi migrare gradualmente dalle schermate esistenti:

1. ✅ **Step 1**: Usa i componenti base (Header, Cards)
2. ✅ **Step 2**: Integra gli hook (useBookingData, useMatchActions)
3. ✅ **Step 3**: Sostituisci completamente con DettaglioPrenotazioneSharedScreen

## 🚀 Prossimi Passi

- [ ] Implementare MatchSection component
- [ ] Implementare PlayersSection component
- [ ] Implementare InviteModal component
- [ ] Implementare ScoreModal component
- [ ] Aggiungere tests

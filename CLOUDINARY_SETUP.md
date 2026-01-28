# Configurazione Cloudinary per Upload Immagini

## Sistema Implementato

L'applicazione usa **due approcci differenti** per l'upload delle immagini su Cloudinary:

### 1. Avatar Utenti (Upload tramite Backend) ✅
### 2. Immagini Strutture (Upload tramite Backend) ✅

Entrambi passano tramite il backend per massimo controllo e sicurezza.

---

## Avatar Utenti

### Flusso:
```
Frontend → Backend (Multer) → Cloudinary → Database
```

### Configurazione:
- **Preset**: `userImage` (configurato nel .env backend)
- **Folder**: `avatars/{userId}`
- **Public ID**: Unico per utente con overwrite
- **Trasformazioni**: Gestite automaticamente da Cloudinary
- **Max Size**: 5MB

### Endpoint:
```
POST /api/users/me/avatar
DELETE /api/users/me/avatar
```

---

## Immagini Strutture

### Flusso:
```
Frontend → Backend (Multer) → Cloudinary → Database
```

### Configurazione:
- **Folder**: `images/struttura-images`
- **Public ID**: `strutture/{strutturaId}/{timestamp}`
- **Trasformazioni**: 
  - Max dimensioni: 1920x1080
  - Qualità: auto:good
  - Formato: auto
- **Max Size**: 10MB per immagine
- **Limite**: 10 immagini per struttura

### Endpoint:
```
POST /api/strutture/:id/images        # Upload nuova immagine
DELETE /api/strutture/:id/images      # Elimina immagine
PUT /api/strutture/:id/images/main    # Imposta immagine principale
```

---

## Vantaggi di questo Approccio

### ✅ Controllo Totale
- Validazione tipo e dimensione file
- Resize automatico prima dell'upload
- Compressione ottimale per web
- Log centralizzati

### ✅ Sicurezza
- Autenticazione richiesta
- Verifica ownership
- Nessuna esposizione di credenziali
- Moderazione contenuti possibile

### ✅ Gestione Completa
- **Eliminazione automatica**: Quando elimini una struttura, tutte le sue immagini vengono rimosse da Cloudinary
- **Cleanup**: Nessun file orfano rimane su Cloudinary
- **Riordinamento**: Prima immagine = immagine principale
- **Update**: Sostituisci immagini facilmente

### ✅ Performance
- Trasformazioni server-side
- Formato ottimale (WebP quando supportato)
- CDN globale Cloudinary
- Caching automatico

---

## Variabili d'Ambiente

Nel file `.env` del backend:

```env
CLOUDINARY_CLOUD_NAME=ddkt2wunn
CLOUDINARY_API_KEY=937751727299346
CLOUDINARY_API_SECRET=mzafdQqWqHGKKDGUejUABwfr9R4
CLOUDINARY_UPLOAD_PRESET=userImage
```

---

## File Modificati

### Backend
- ✅ `controllers/strutturaImagesController.ts` - Upload/Delete con Cloudinary
- ✅ `controllers/struttureController.ts` - Cleanup alla cancellazione
- ✅ `controllers/profileController.ts` - Upload avatar
- ✅ `routes/struttureImagesRoutes.ts` - Route immagini

### Frontend
- ✅ `screens/owner/struttura/CreaStruttura/` - Upload via backend
- ✅ `screens/owner/struttura/GestisciImmaginiStruttura.tsx` - Gestione completa
- ✅ `screens/player/profilo/ProfileScreen.tsx` - Upload avatar

---

## Testing

### Test Upload Struttura:
1. Avvia backend: `npm run dev` in `beach/`
2. Avvia app: `npx expo start` in `beach-booking-app/`
3. Crea struttura come owner
4. Carica 5-10 immagini
5. Verifica su Cloudinary in `images/struttura-images/`

### Test Eliminazione:
1. Elimina una singola immagine → deve sparire da Cloudinary
2. Elimina la struttura → tutte le immagini devono sparire

### Test Avatar:
1. Carica avatar profilo
2. Verifica in `avatars/{userId}` su Cloudinary
3. Carica nuovo avatar → deve sovrascrivere il precedente

---

## Differenze rispetto al setup precedente

**Prima**: Upload diretto frontend → Cloudinary (unsigned preset)
**Ora**: Upload frontend → Backend → Cloudinary (signed, con trasformazioni)

**Vantaggi del nuovo sistema:**
- ✅ Puoi eliminare immagini
- ✅ Cleanup automatico
- ✅ Trasformazioni server-side
- ✅ Validazione completa
- ✅ Log e monitoring
- ✅ Massima sicurezza

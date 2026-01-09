# Debug Avatar Cloudinary

## Passi per verificare se l'avatar sta usando Cloudinary:

### 1. Controlla i log del frontend
Quando apri la schermata Profilo, cerca nei log del Metro:
```
📥 Risposta registrazione: {...}
🖼️ Avatar nella risposta: [URL dell'avatar]
```

Oppure:
```
Dati profilo ricevuti: {...}
avatarUrl dal backend: [URL dell'avatar]
```

### 2. Verifica il valore di avatarUrl
L'URL dell'avatar dovrebbe essere nel formato:
```
https://res.cloudinary.com/[cloud-name]/image/upload/v[version]/avatars/[userId]
```

Se invece vedi:
- `null` → Non hai ancora caricato un avatar
- `/images/profilo/...` → Hai un vecchio avatar locale (pre-Cloudinary)
- Altro → Potrebbe esserci un problema

### 3. Test rapido
1. Vai su Profilo (sia Player che Owner)
2. Clicca su "Cambia foto" o sull'avatar
3. Seleziona una nuova immagine
4. Controlla i log per vedere:
   ```
   [uploadAvatar] cloudinary result {
     public_id: "avatars/[userId]",
     secure_url: "https://res.cloudinary.com/...",
   }
   ```

### 4. Soluzione
Se l'utente non ha ancora un avatar su Cloudinary:
- Basta caricare una nuova immagine profilo
- Il sistema caricherà automaticamente su Cloudinary
- L'URL verrà salvato nel database e nell'AsyncStorage

### 5. Verifica Backend
Connettiti al database MongoDB e controlla:
```javascript
db.users.findOne({ email: "[tua-email]" })
```

Guarda il campo `avatarUrl`:
- Se inizia con `https://res.cloudinary.com/` → ✅ OK
- Se è `null` o un percorso locale → ❌ Devi caricare un nuovo avatar

## Conclusione
Il sistema è configurato correttamente per Cloudinary.
Se vedi ancora le iniziali, è perché:
1. L'utente non ha mai caricato un avatar, oppure
2. L'utente era registrato prima dell'integrazione Cloudinary

**Soluzione**: Carica una nuova foto profilo dalla app!

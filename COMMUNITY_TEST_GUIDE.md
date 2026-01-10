# Community API - Guida Test

Guida rapida per testare gli endpoint della Community con esempi pratici.

---

## 🚀 Avvio Backend

```bash
cd beach
npm run dev
```

Il server dovrebbe essere disponibile su `http://localhost:3000` (o la porta configurata).

---

## 🔑 Autenticazione

Tutti gli endpoint richiedono autenticazione. Includi l'header:

```
Authorization: Bearer <your_jwt_token>
```

Per ottenere un token, effettua login:

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## 📝 Test Posts

### 1. Crea Post (solo testo)

```bash
POST http://localhost:3000/community/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Che bella partita oggi! Chi viene domani?"
}
```

### 2. Crea Post (con immagine)

```bash
POST http://localhost:3000/community/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

content: "Grande vittoria! 💪"
image: [select file]
```

**Con cURL:**
```bash
curl -X POST http://localhost:3000/community/posts \
  -H "Authorization: Bearer <token>" \
  -F "content=Grande vittoria oggi!" \
  -F "image=@/path/to/photo.jpg"
```

### 3. Recupera Post

```bash
GET http://localhost:3000/community/posts?limit=20&offset=0&sort=recent
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit`: numero post da recuperare (default: 20)
- `offset`: offset per paginazione (default: 0)
- `sort`: `recent` o `popular` (default: recent)

### 4. Like Post

```bash
POST http://localhost:3000/community/posts/POST_ID/like
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Post liked",
  "liked": true,
  "likesCount": 5
}
```

### 5. Aggiungi Commento

```bash
POST http://localhost:3000/community/posts/POST_ID/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Bellissimo! Anche noi ci siamo divertiti"
}
```

### 6. Elimina Post

```bash
DELETE http://localhost:3000/community/posts/POST_ID
Authorization: Bearer <token>
```

---

## 📅 Test Events

### 1. Crea Evento

```bash
POST http://localhost:3000/community/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Torneo Beach Volley 2026",
  "description": "Torneo amatoriale aperto a tutti. Premi per i primi 3 classificati!",
  "date": "2026-02-15T14:00:00Z",
  "location": "Lido di Ostia - Campo Centrale",
  "maxParticipants": 20
}
```

### 2. Crea Evento (con immagine)

```bash
POST http://localhost:3000/community/events
Authorization: Bearer <token>
Content-Type: multipart/form-data

title: "Torneo Beach Volley 2026"
description: "Torneo amatoriale..."
date: "2026-02-15T14:00:00Z"
location: "Lido di Ostia"
maxParticipants: 20
image: [select file]
```

### 3. Recupera Eventi

```bash
GET http://localhost:3000/community/events?status=upcoming&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: `upcoming`, `past`, `all` (default: upcoming)
- `limit`: numero eventi (default: 20)

### 4. Iscriviti a Evento

```bash
POST http://localhost:3000/community/events/EVENT_ID/join
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Successfully joined event",
  "joined": true,
  "participantsCount": 5
}
```

---

## 🏆 Test Rankings

### 1. Recupera Classifiche

```bash
GET http://localhost:3000/community/rankings?type=matches&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `type`: `matches`, `winRate` (default: matches)
- `limit`: numero utenti (default: 50)
- `period`: `week`, `month`, `all` (default: all) *(non ancora implementato)*

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "user": {
        "_id": "...",
        "name": "Mario Rossi",
        "avatarUrl": "..."
      },
      "stats": {
        "matchesPlayed": 45,
        "wins": 30,
        "winRate": 66.67
      }
    }
  ],
  "myRank": {
    "rank": 15,
    "stats": {...}
  }
}
```

---

## 🧪 Test con Postman/Insomnia

### Setup Collection

1. **Crea Environment Variables:**
   - `baseUrl`: `http://localhost:3000`
   - `token`: `<your_jwt_token>`

2. **Headers Globali:**
   ```
   Authorization: Bearer {{token}}
   ```

3. **Importa Collection:**

```json
{
  "name": "Beach Community API",
  "requests": [
    {
      "name": "Create Post",
      "method": "POST",
      "url": "{{baseUrl}}/community/posts",
      "body": {
        "content": "Test post"
      }
    },
    {
      "name": "Get Posts",
      "method": "GET",
      "url": "{{baseUrl}}/community/posts"
    },
    {
      "name": "Like Post",
      "method": "POST",
      "url": "{{baseUrl}}/community/posts/:postId/like"
    }
  ]
}
```

---

## 🐛 Debugging

### Logs da controllare

Il server logga automaticamente:
```
🌐 2026-01-09T10:00:00.000Z POST /community/posts
   🔐 Auth: Presente
```

### Errori Comuni

**1. "Only image files are allowed"**
- Assicurati di inviare un file immagine (jpg, png, gif)

**2. "Content or image is required"**
- Devi inviare almeno `content` O `image`

**3. "Event date must be in the future"**
- La data dell'evento deve essere futura

**4. "Event is full"**
- L'evento ha raggiunto il numero massimo di partecipanti

**5. "You can only delete your own posts"**
- Puoi eliminare solo i post che hai creato tu

---

## 📊 Database Check

### Verifica Post nel Database

```javascript
// MongoDB Shell
use beach_booking
db.posts.find().pretty()
```

### Verifica Eventi

```javascript
db.communityevents.find().pretty()
```

### Conta Post

```javascript
db.posts.countDocuments()
```

---

## ✅ Checklist Test Completo

- [ ] Login e recupero token
- [ ] Crea post solo testo
- [ ] Crea post con immagine
- [ ] Recupera lista post
- [ ] Like/Unlike post
- [ ] Aggiungi commento
- [ ] Elimina proprio post
- [ ] Tenta eliminare post altrui (dovrebbe fallire)
- [ ] Crea evento
- [ ] Recupera lista eventi
- [ ] Iscriviti a evento
- [ ] Tenta iscriversi a evento pieno (dovrebbe fallire)
- [ ] Recupera classifiche

---

## 🔧 Troubleshooting

### Cloudinary non funziona

Verifica le variabili d'ambiente in `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Multer Error

Se ricevi errori relativi a multer, verifica:
```bash
npm list multer
npm list streamifier
```

Se mancano:
```bash
npm install multer streamifier @types/multer @types/streamifier
```

---

## 📱 Test dall'App React Native

Una volta verificato che il backend funziona, puoi testare dall'app:

1. **Avvia il backend**
2. **Configura l'API URL nell'app** (assicurati che punti al server locale o remoto)
3. **Naviga alla Community**
4. **Prova a creare un post**

Se l'app è su emulatore/dispositivo fisico, usa:
- **Android Emulator**: `http://10.0.2.2:3000`
- **iOS Simulator**: `http://localhost:3000`
- **Dispositivo Fisico**: `http://YOUR_LOCAL_IP:3000`

---

## 🎯 Next Steps

Dopo aver testato con successo:

1. **Performance**: Aggiungi paginazione infinita nell'app
2. **Cache**: Implementa caching lato client
3. **Notifiche**: Sistema notifiche push per like/commenti
4. **Moderazione**: Aggiungi sistema di report
5. **Analytics**: Traccia engagement (views, shares, etc.)

---

## 📞 Support

Per problemi o domande:
- Controlla i logs del server
- Verifica le variabili d'ambiente
- Controlla la connessione MongoDB
- Verifica token JWT valido

Buon testing! 🚀

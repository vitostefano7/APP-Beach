# Community API Endpoints

Documentazione degli endpoint API necessari per il sistema Community.

---

## 📝 Posts (Feed)

### `GET /api/community/posts`
Recupera tutti i post della community.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): numero massimo di post da restituire (default: 20)
- `offset` (optional): offset per paginazione (default: 0)
- `sort` (optional): criterio di ordinamento - `recent`, `popular` (default: `recent`)

**Response (200 OK):**
```json
{
  "posts": [
    {
      "_id": "post_id_123",
      "user": {
        "_id": "user_id_123",
        "name": "Mario Rossi",
        "avatarUrl": "https://cloudinary.com/..."
      },
      "content": "Che bella partita oggi!",
      "image": "https://cloudinary.com/post_image.jpg",
      "likes": ["user_id_456", "user_id_789"],
      "comments": [
        {
          "_id": "comment_id_1",
          "user": {
            "_id": "user_id_456",
            "name": "Luigi Verdi"
          },
          "text": "Grande! Anche noi ci siamo divertiti",
          "createdAt": "2026-01-09T10:30:00Z"
        }
      ],
      "createdAt": "2026-01-09T10:00:00Z",
      "updatedAt": "2026-01-09T10:30:00Z"
    }
  ],
  "total": 50,
  "hasMore": true
}
```

---

### `POST /api/community/posts`
Crea un nuovo post.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `content` (string, required): testo del post (max 1000 caratteri)
- `image` (file, optional): immagine allegata (jpg, png, max 5MB)

**Response (201 Created):**
```json
{
  "message": "Post created successfully",
  "post": {
    "_id": "post_id_123",
    "user": {
      "_id": "user_id_123",
      "name": "Mario Rossi",
      "avatarUrl": "https://cloudinary.com/..."
    },
    "content": "Che bella partita oggi!",
    "image": "https://cloudinary.com/post_image.jpg",
    "likes": [],
    "comments": [],
    "createdAt": "2026-01-09T10:00:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Content is required or too long"
}
```

---

### `POST /api/community/posts/:postId/like`
Mette like a un post (toggle: se già presente, rimuove il like).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Post liked",
  "liked": true,
  "likesCount": 5
}
```

---

### `POST /api/community/posts/:postId/comments`
Aggiunge un commento a un post.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "text": "Bellissimo!"
}
```

**Response (201 Created):**
```json
{
  "message": "Comment added",
  "comment": {
    "_id": "comment_id_1",
    "user": {
      "_id": "user_id_456",
      "name": "Luigi Verdi",
      "avatarUrl": "https://cloudinary.com/..."
    },
    "text": "Bellissimo!",
    "createdAt": "2026-01-09T10:30:00Z"
  }
}
```

---

### `DELETE /api/community/posts/:postId`
Elimina un post (solo se creato dall'utente).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Post deleted successfully"
}
```

**Error Response (403 Forbidden):**
```json
{
  "message": "You can only delete your own posts"
}
```

---

## 📅 Events (Eventi)

### `GET /api/community/events`
Recupera tutti gli eventi della community.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): `upcoming`, `past`, `all` (default: `upcoming`)
- `limit` (optional): numero massimo di eventi (default: 20)

**Response (200 OK):**
```json
{
  "events": [
    {
      "_id": "event_id_123",
      "title": "Torneo Beach Volley 2026",
      "description": "Torneo amatoriale aperto a tutti",
      "date": "2026-02-15T14:00:00Z",
      "location": "Lido di Ostia",
      "image": "https://cloudinary.com/event_image.jpg",
      "organizer": {
        "_id": "user_id_123",
        "name": "Mario Rossi"
      },
      "participants": ["user_id_456", "user_id_789"],
      "maxParticipants": 20,
      "createdAt": "2026-01-09T10:00:00Z"
    }
  ],
  "total": 10
}
```

---

### `POST /api/community/events`
Crea un nuovo evento.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `title` (string, required): titolo evento
- `description` (string, required): descrizione
- `date` (string, required): data/ora evento (ISO 8601)
- `location` (string, required): luogo
- `maxParticipants` (number, required): numero massimo partecipanti
- `image` (file, optional): immagine evento

**Response (201 Created):**
```json
{
  "message": "Event created successfully",
  "event": {
    "_id": "event_id_123",
    "title": "Torneo Beach Volley 2026",
    "date": "2026-02-15T14:00:00Z",
    "location": "Lido di Ostia",
    "participants": [],
    "maxParticipants": 20
  }
}
```

---

### `POST /api/community/events/:eventId/join`
Iscriviti a un evento (toggle).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Successfully joined event",
  "joined": true,
  "participantsCount": 5
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Event is full"
}
```

---

## 🏆 Rankings (Classifiche)

### `GET /api/community/rankings`
Recupera le classifiche della community.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): `matches`, `winRate`, `popularity` (default: `matches`)
- `limit` (optional): numero massimo utenti (default: 50)
- `period` (optional): `week`, `month`, `all` (default: `all`)

**Response (200 OK):**
```json
{
  "rankings": [
    {
      "rank": 1,
      "user": {
        "_id": "user_id_123",
        "name": "Mario Rossi",
        "avatarUrl": "https://cloudinary.com/..."
      },
      "stats": {
        "matchesPlayed": 45,
        "wins": 30,
        "winRate": 66.67
      }
    },
    {
      "rank": 2,
      "user": {
        "_id": "user_id_456",
        "name": "Luigi Verdi",
        "avatarUrl": "https://cloudinary.com/..."
      },
      "stats": {
        "matchesPlayed": 40,
        "wins": 28,
        "winRate": 70.00
      }
    }
  ],
  "myRank": {
    "rank": 15,
    "stats": {
      "matchesPlayed": 20,
      "wins": 12,
      "winRate": 60.00
    }
  }
}
```

---

## 📊 Models

### Post Model
```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User' },
  content: { type: String, required: true, maxLength: 1000 },
  image: { type: String }, // Cloudinary URL
  likes: [{ type: ObjectId, ref: 'User' }],
  comments: [{
    _id: ObjectId,
    user: { type: ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### Event Model
```javascript
{
  _id: ObjectId,
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  image: { type: String }, // Cloudinary URL
  organizer: { type: ObjectId, ref: 'User' },
  participants: [{ type: ObjectId, ref: 'User' }],
  maxParticipants: { type: Number, required: true },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 🔒 Autorizzazioni

- **POST /community/posts**: Autenticazione richiesta
- **DELETE /community/posts/:postId**: Solo il creatore può eliminare
- **POST /community/events**: Autenticazione richiesta
- **POST /community/events/:eventId/join**: Autenticazione richiesta

---

## 📸 Upload Immagini

Utilizzare **Cloudinary** per l'upload delle immagini:
- Dimensione massima: **5MB**
- Formati supportati: **JPG, PNG**
- Compressione automatica con `quality: auto`
- Folder structure: `community/posts/` o `community/events/`

---

## ✅ Validazioni

### Post
- `content`: minimo 1 carattere, massimo 1000 caratteri (o immagine presente)
- `image`: opzionale, max 5MB

### Event
- `title`: minimo 3 caratteri, massimo 100 caratteri
- `description`: minimo 10 caratteri, massimo 1000 caratteri
- `date`: deve essere futura
- `maxParticipants`: minimo 2, massimo 100
- `location`: minimo 3 caratteri

### Comment
- `text`: minimo 1 carattere, massimo 500 caratteri

---

## 🔔 Notifiche (Opzionale - Fase 2)

Quando implementate, inviare notifiche push per:
- Qualcuno mette like al tuo post
- Qualcuno commenta il tuo post
- Qualqualcuno si iscrive a un tuo evento
- Reminder evento 1 giorno prima

---

## 📝 Note Implementazione

1. **Paginazione**: Implementare sempre paginazione per performance
2. **Caching**: Considerare caching per rankings e post popolari
3. **Rate Limiting**: Limitare creazione post/eventi per prevenire spam
4. **Moderazione**: Considerare sistema di report per contenuti inappropriati
5. **Performance**: Utilizzare populate con select per ottimizzare query

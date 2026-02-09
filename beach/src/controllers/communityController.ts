import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Post from "../models/Post";
import CommunityEvent from "../models/CommunityEvent";
import Match from "../models/Match";
import Booking from "../models/Booking";
import Struttura from "../models/Strutture";
import Campo from "../models/Campo";
import StrutturaFollower from "../models/StrutturaFollower";
import UserFollower from "../models/UserFollower";
import Friendship from "../models/Friendship";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import mongoose from "mongoose";

// Configurazione Cloudinary (assicurati che sia nel tuo .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =========================
   HELPER: Upload to Cloudinary
========================= */
const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        quality: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/* =========================
   POSTS CONTROLLERS
========================= */

/**
 * GET /community/posts
 * Recupera tutti i post della community con paginazione
 * Se l'utente è autenticato, filtra per post di utenti e strutture seguiti
 */
export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    console.log('========================================');
    console.log('📥 GET /community/posts');
    console.log('========================================');
    console.log('User ID:', req.user?.id);
    console.log('User role:', req.user?.role);

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const sort = (req.query.sort as string) || "recent";
    const filter = (req.query.filter as string) || "all"; // all, following, users, strutture
    const strutturaId = req.query.strutturaId as string; // ID della struttura selezionata

    console.log('Parametri query:');
    console.log('  limit:', limit);
    console.log('  offset:', offset);
    console.log('  sort:', sort);
    console.log('  filter:', filter);
    console.log('  strutturaId:', strutturaId);

    let sortQuery: any = { createdAt: -1 }; // Default: più recenti

    if (sort === "popular") {
      sortQuery = { createdAt: -1 };
    }

    let queryFilter: any = {};

    // Se è specificato strutturaId, filtra per quella struttura e i suoi following
    if (strutturaId) {
      console.log('?Y?N Filtro per struttura:', strutturaId);
      
      // Trova le strutture seguite da questa struttura
      const followedStrutture = await StrutturaFollower.find({
        user: strutturaId, // La struttura che sta guardando
        status: "active",
      }).select("struttura");

      const followedStrutturaIds = followedStrutture.map((f) => f.struttura.toString());
      console.log('  Strutture seguite:', followedStrutturaIds.length);

      // Includi anche la struttura stessa
      const allStrutturaIds = [strutturaId, ...followedStrutturaIds];
      console.log('  Totale strutture da mostrare:', allStrutturaIds.length);

      // Trova gli utenti seguiti da questa struttura
      const followedUsers = await UserFollower.find({
        struttura: strutturaId,
        status: "active",
      }).select("user");

      const followedUserIds = followedUsers.map((f) => f.user.toString());
      console.log('  Utenti seguiti:', followedUserIds.length);

      // Mostra post di strutture seguite + struttura stessa + utenti seguiti
      queryFilter = {
        $or: [
          { struttura: { $in: allStrutturaIds }, isStrutturaPost: true },
          { user: { $in: followedUserIds }, isStrutturaPost: false },
        ],
      };
    }
    else if (filter === "following" && req.user?.id) {
      // Trova utenti seguiti
      const followedUsers = await Friendship.find({
        requester: req.user.id,
        status: "accepted",
      }).select("recipient");

      // Trova strutture seguite
      const followedStrutture = await StrutturaFollower.find({
        user: req.user.id,
        status: "active",
      }).select("struttura");

      const userIds = followedUsers.map((f) => f.recipient);
      const strutturaIds = followedStrutture.map((f) => f.struttura);

      // Includi anche i propri post
      userIds.push(new mongoose.Types.ObjectId(req.user.id));

      // Post degli utenti seguiti (incluso se stesso) O post delle strutture seguite
      queryFilter = {
        $or: [
          { user: { $in: userIds }, isStrutturaPost: false },
          { struttura: { $in: strutturaIds }, isStrutturaPost: true },
        ],
      };
    } else if (filter === "users") {
      // Solo post di utenti (non strutture)
      queryFilter = { isStrutturaPost: false };
    } else if (filter === "strutture") {
      // Solo post di strutture
      queryFilter = { isStrutturaPost: true };
    }

    console.log('Query filter:', JSON.stringify(queryFilter, null, 2));
    console.log('Eseguo query Post.find()...');
    
    const posts = await Post.find(queryFilter)
      .sort(sortQuery)
      .skip(offset)
      .limit(limit)
      .populate("user", "name surname username avatarUrl")
      .populate("struttura", "name images location")
      .populate("comments.user", "name surname username avatarUrl")
      .populate("comments.struttura", "name images location")
      .lean();

    console.log('Posts trovati:', posts.length);

    const total = await Post.countDocuments(queryFilter);
    console.log('Total posts nel DB:', total);

    const hasMore = offset + limit < total;
    console.log('HasMore:', hasMore);

    if (posts.length > 0) {
      console.log('\nPrimo post:');
      console.log('  ID:', posts[0]._id);
      console.log('  User:', posts[0].user);
      console.log('  Struttura:', posts[0].struttura);
      console.log('  isStrutturaPost:', posts[0].isStrutturaPost);
      console.log('  Content length:', posts[0].content?.length);
      console.log('  Likes:', posts[0].likes?.length);
      console.log('  Comments:', posts[0].comments?.length);
    }

    console.log('\n✅ Invio risposta con', posts.length, 'posts');
    console.log('========================================\n');

    res.json({
      posts,
      total,
      hasMore,
    });
  } catch (error: any) {
    console.error('========================================');
    console.error("❌ ERRORE recupero posts:");
    console.error('Nome:', error.name);
    console.error('Messaggio:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================\n');
    res.status(500).json({ message: "Errore nel recupero dei post" });
  }
};

/**
 * GET /community/posts/:postId
 * Recupera un singolo post con commenti popolati
 */
export const getPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;

    console.log('========================================');
    console.log('📄 GET /community/posts/:postId');
    console.log('Post ID:', postId);
    console.log('========================================');

    const post = await Post.findById(postId)
      .populate("user", "name surname username avatarUrl")
      .populate("struttura", "name images location")
      .populate("comments.user", "name surname username avatarUrl")
      .populate("comments.struttura", "name images location");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    console.log('✅ Post trovato:', post._id);
    console.log('User:', post.user);
    console.log('Struttura:', post.struttura);
    console.log('isStrutturaPost:', post.isStrutturaPost);
    console.log('Comments:', post.comments?.length || 0);

    res.json({ post });
  } catch (error: any) {
    console.error('========================================');
    console.error("❌ ERRORE recupero post singolo:");
    console.error('Nome:', error.name);
    console.error('Messaggio:', error.message);
    console.error('========================================\n');
    res.status(500).json({ message: "Errore nel recupero del post" });
  }
};

/**
 * POST /community/posts
 * Crea un nuovo post (utente normale o struttura se owner)
 */
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    console.log('========================================');
    console.log('📝 POST /community/posts - CREAZIONE POST');
    console.log('========================================');
    console.log('User ID:', req.user?.id);
    console.log('User role:', req.user?.role);

    const { content, strutturaId } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    console.log('\n📋 BODY REQUEST:');
    console.log('  content:', content);
    console.log('  content length:', content?.length);
    console.log('  strutturaId:', strutturaId);
    console.log('  has file:', !!req.file);
    if (req.file) {
      console.log('  file mimetype:', req.file.mimetype);
      console.log('  file size:', req.file.size);
      console.log('  file originalname:', req.file.originalname);
    }

    // Validazione
    console.log('\n🔍 VALIDAZIONE:');
    if (!content || content.trim().length === 0) {
      console.log('  ⚠️  Content vuoto');
      if (!req.file) {
        console.log('  ❌ Nessun file presente - ERRORE');
        return res.status(400).json({ message: "Content or image is required" });
      }
      console.log('  ✅ File presente, procedo');
    } else {
      console.log('  ✅ Content presente:', content.substring(0, 50) + '...');
    }

    if (content && content.length > 1000) {
      console.log('  ❌ Content troppo lungo:', content.length, 'caratteri');
      return res.status(400).json({ message: "Content too long (max 1000 characters)" });
    }

    // Verifica se è un post per una struttura
    let isStrutturaPost = false;
    let validatedStrutturaId = null;

    if (strutturaId) {
      console.log('\n🏢 POST PER STRUTTURA:');
      
      // Solo gli owner possono postare per strutture
      if (userRole !== "owner") {
        console.log('  ❌ Utente non è owner');
        return res.status(403).json({ message: "Only owners can post for strutture" });
      }

      // Verifica che la struttura esista e appartenga all'owner
      const struttura = await Struttura.findOne({
        _id: strutturaId,
        owner: userId,
        isDeleted: false,
      });

      if (!struttura) {
        console.log('  ❌ Struttura non trovata o non appartiene all\'owner');
        return res.status(404).json({ message: "Struttura not found or not owned by you" });
      }

      console.log('  ✅ Struttura validata:', struttura.name);
      isStrutturaPost = true;
      validatedStrutturaId = strutturaId;
    }

    // Upload immagine se presente
    let imageUrl: string | undefined;
    if (req.file) {
      console.log('\n📤 UPLOAD IMMAGINE A CLOUDINARY:');
      console.log('  Inizio upload...');
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer, "community/posts");
        console.log('  ✅ Upload completato!');
        console.log('  URL immagine:', imageUrl);
      } catch (uploadError) {
        console.error("  ❌ Errore upload immagine:", uploadError);
        return res.status(500).json({ message: "Errore nell'upload dell'immagine" });
      }
    } else {
      console.log('\n📤 Nessuna immagine da uploadare');
    }

    // Crea post
    console.log('\n💾 CREAZIONE POST NEL DATABASE:');
    const postData = {
      user: userId,
      content: content?.trim() || "",
      image: imageUrl,
      likes: [],
      comments: [],
      isStrutturaPost,
      struttura: validatedStrutturaId,
    };
    console.log('  Dati post:', JSON.stringify(postData, null, 2));

    const post = new Post(postData);

    console.log('  Salvataggio in corso...');
    await post.save();
    console.log('  ✅ Post salvato con ID:', post._id);

    // Popola user e struttura per response
    console.log('\n👤 POPOLO USER E STRUTTURA:');
    await post.populate("user", "name surname username avatarUrl");
    if (isStrutturaPost) {
      await post.populate("struttura", "name images location");
    }
    console.log('  User popolato:', {
      id: (post.user as any)._id,
      name: (post.user as any).name,
      surname: (post.user as any).surname,
      username: (post.user as any).username,
      avatarUrl: (post.user as any).avatarUrl
    });
    if (isStrutturaPost) {
      console.log('  Struttura popolata:', {
        id: (post.struttura as any)?._id,
        name: (post.struttura as any)?.name,
      });
    }

    console.log('\n📤 INVIO RISPOSTA:');
    console.log('  Status: 201');
    console.log('  Post ID:', post._id);
    console.log('  Post content:', post.content?.substring(0, 50));
    console.log('  Post image:', post.image);
    console.log('  Post isStrutturaPost:', post.isStrutturaPost);
    console.log('  Post user:', (post.user as any).name);
    console.log('========================================\n');

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error: any) {
    console.error('========================================');
    console.error("❌ ERRORE CREAZIONE POST:");
    console.error('Nome:', error.name);
    console.error('Messaggio:', error.message);
    console.error('Stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    console.error('========================================\n');
    res.status(500).json({ message: "Errore nella creazione del post" });
  }
};

/**
 * GET /community/my-posts
 * Recupera tutti i post dell'utente loggato
 */
export const getMyPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    console.log('========================================');
    console.log('📥 GET /community/my-posts');
    console.log('User ID:', userId);
    console.log('========================================');

    const posts = await Post.find({ user: userId })
      .populate("user", "name surname username avatarUrl")
      .populate("struttura", "name images location")
      .populate("comments.user", "name surname username avatarUrl")
      .sort({ createdAt: -1 });

    console.log('✅ Post trovati:', posts.length);

    res.json({ posts });
  } catch (error: any) {
    console.error('========================================');
    console.error("❌ ERRORE recupero post utente:");
    console.error('Nome:', error.name);
    console.error('Messaggio:', error.message);
    console.error('========================================\n');
    res.status(500).json({ message: "Errore nel recupero dei post" });
  }
};

/**
 * POST /community/posts/:postId/like
 * Like/Unlike un post (toggle)
 */
export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    console.log('👍 [likePost] Inizio like/unlike post:', { postId, userId });

    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post non trovato:', postId);
      return res.status(404).json({ message: "Post not found" });
    }

    console.log('✅ Post trovato, controllo like esistente...');
    const likeIndex = post.likes.findIndex(
      (id) => id.toString() === userId
    );

    let liked = false;
    if (likeIndex > -1) {
      // Rimuovi like
      post.likes.splice(likeIndex, 1);
      liked = false;
      console.log('👎 Like rimosso');
    } else {
      // Aggiungi like
      post.likes.push(userId as any);
      liked = true;
      console.log('👍 Like aggiunto');
    }

    console.log('💾 Salvataggio post...');
    await post.save();
    console.log('✅ Post salvato, likes totali:', post.likes.length);

    res.json({
      message: liked ? "Post liked" : "Post unliked",
      liked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("❌ Errore like post:", error);
    res.status(500).json({ message: "Errore nell'aggiornamento del like" });
  }
};

/**
 * POST /community/posts/:postId/comments
 * Aggiungi un commento a un post
 */
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { text, strutturaId } = req.body;
    const userId = req.user?.id;

    console.log('💬 [addComment] Request:', {
      postId,
      userId,
      strutturaId,
      text: text?.substring(0, 50)
    });

    // Validazione
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (text.length > 500) {
      return res.status(400).json({ message: "Comment too long (max 500 characters)" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Aggiungi commento
    const commentData: any = {
      _id: new (require("mongoose").Types.ObjectId)(),
      user: userId as any,
      text: text.trim(),
      createdAt: new Date(),
    };

    // Se è specificato strutturaId, aggiungi la struttura al commento
    if (strutturaId) {
      commentData.struttura = strutturaId;
      console.log('🏢 Adding struttura to comment:', strutturaId);
    }

    post.comments.push(commentData);
    await post.save();

    // Popola l'ultimo commento per response
    await post.populate("comments.user", "name surname username avatarUrl");
    await post.populate("comments.struttura", "name images location");
    const newComment = post.comments[post.comments.length - 1];

    console.log('✅ Comment added:', {
      commentId: newComment._id,
      hasUser: !!newComment.user,
      hasStruttura: !!newComment.struttura,
      createdAt: newComment.createdAt
    });

    // Restituisci direttamente il commento (non wrapped in object)
    res.status(201).json(newComment);
  } catch (error) {
    console.error("❌ Errore aggiunta commento:", error);
    res.status(500).json({ message: "Errore nell'aggiunta del commento" });
  }
};

/**
 * DELETE /community/posts/:postId
 * Elimina un post (solo se creato dall'utente)
 */
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    console.log('🗑️ [deletePost] Inizio eliminazione post:', { postId, userId });

    const post = await Post.findById(postId);
    if (!post) {
      console.log('❌ Post non trovato:', postId);
      return res.status(404).json({ message: "Post not found" });
    }

    console.log('✅ Post trovato, verifica ownership...');
    // Verifica che l'utente sia il creatore
    if (post.user.toString() !== userId) {
      console.log('❌ Utente non autorizzato a eliminare questo post');
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    console.log('✅ Ownership verificato, controllo immagine...');
    // Elimina immagine da Cloudinary se presente
    if (post.image) {
      console.log('🖼️ Eliminazione immagine da Cloudinary...');
      try {
        const publicId = post.image.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(`community/posts/${publicId}`);
        console.log('✅ Immagine eliminata da Cloudinary');
      } catch (cloudinaryError) {
        console.error("❌ Errore eliminazione immagine Cloudinary:", cloudinaryError);
        // Continua comunque con l'eliminazione del post
      }
    } else {
      console.log('📝 Nessuna immagine da eliminare');
    }

    console.log('💾 Eliminazione post dal DB...');
    await Post.findByIdAndDelete(postId);
    console.log('✅ Post eliminato con successo');

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("❌ Errore eliminazione post:", error);
    res.status(500).json({ message: "Errore nell'eliminazione del post" });
  }
};

/* =========================
   EVENTS CONTROLLERS
========================= */

/**
 * GET /community/events
 * Recupera eventi della community
 */
export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const status = (req.query.status as string) || "upcoming";
    const limit = parseInt(req.query.limit as string) || 20;

    console.log('📅 [getEvents] Recupero eventi:', { status, limit });

    let query: any = {};

    if (status !== "all") {
      query.status = status;
    }

    // Filtra eventi futuri per "upcoming"
    if (status === "upcoming") {
      query.date = { $gte: new Date() };
      console.log('📅 Filtro eventi futuri');
    }

    console.log('🔍 Query eventi:', JSON.stringify(query));
    const events = await CommunityEvent.find(query)
      .sort({ date: 1 }) // Prossimi eventi per primi
      .limit(limit)
      .populate("organizer", "name avatarUrl")
      .populate("participants", "name avatarUrl")
      .lean();

    const total = await CommunityEvent.countDocuments(query);
    console.log('✅ Eventi trovati:', events.length, 'su', total);

    res.json({
      events,
      total,
    });
  } catch (error) {
    console.error("❌ Errore recupero eventi:", error);
    res.status(500).json({ message: "Errore nel recupero degli eventi" });
  }
};

/**
 * POST /community/events
 * Crea un nuovo evento
 */
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, date, location, maxParticipants } = req.body;
    const userId = req.user?.id;

    console.log('🎉 [createEvent] Creazione evento:', { title, date, location, maxParticipants, userId });

    // Validazione
    if (!title || !description || !date || !location || !maxParticipants) {
      console.log('❌ Campi obbligatori mancanti');
      return res.status(400).json({ message: "All fields are required" });
    }

    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      console.log('❌ Data evento nel passato:', eventDate);
      return res.status(400).json({ message: "Event date must be in the future" });
    }

    console.log('✅ Validazione superata, controllo immagine...');
    // Upload immagine se presente
    let imageUrl: string | undefined;
    if (req.file) {
      console.log('📤 Upload immagine evento...');
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer, "community/events");
        console.log('✅ Immagine caricata:', imageUrl);
      } catch (uploadError) {
        console.error("❌ Errore upload immagine:", uploadError);
        return res.status(500).json({ message: "Errore nell'upload dell'immagine" });
      }
    } else {
      console.log('📝 Nessuna immagine');
    }

    console.log('💾 Creazione evento nel DB...');
    // Crea evento
    const event = new CommunityEvent({
      title,
      description,
      date: eventDate,
      location,
      image: imageUrl,
      organizer: userId,
      participants: [],
      maxParticipants: parseInt(maxParticipants),
      status: "upcoming",
    });

    await event.save();
    await event.populate("organizer", "name avatarUrl");
    console.log('✅ Evento creato:', event._id);

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("❌ Errore creazione evento:", error);
    res.status(500).json({ message: "Errore nella creazione dell'evento" });
  }
};

/**
 * POST /community/events/:eventId/join
 * Iscriviti/Disiscriviti da un evento (toggle)
 */
export const joinEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    console.log('🤝 [joinEvent] Join/unjoin evento:', { eventId, userId });

    const event = await CommunityEvent.findById(eventId);
    if (!event) {
      console.log('❌ Evento non trovato:', eventId);
      return res.status(404).json({ message: "Event not found" });
    }

    console.log('✅ Evento trovato, controllo partecipazione...');
    const participantIndex = event.participants.findIndex(
      (id) => id.toString() === userId
    );

    let joined = false;
    if (participantIndex > -1) {
      // Disiscrivi
      event.participants.splice(participantIndex, 1);
      joined = false;
      console.log('👋 Disiscritto dall\'evento');
    } else {
      // Iscriviti
      if (event.participants.length >= event.maxParticipants) {
        console.log('❌ Evento pieno:', event.participants.length, '/', event.maxParticipants);
        return res.status(400).json({ message: "Event is full" });
      }
      event.participants.push(userId as any);
      joined = true;
      console.log('✅ Iscritto all\'evento');
    }

    console.log('💾 Salvataggio evento...');
    await event.save();
    console.log('✅ Evento salvato, partecipanti:', event.participants.length);

    res.json({
      message: joined ? "Successfully joined event" : "Successfully left event",
      joined,
      participantsCount: event.participants.length,
    });
  } catch (error) {
    console.error("❌ Errore join evento:", error);
    res.status(500).json({ message: "Errore nell'iscrizione all'evento" });
  }
};

/* =========================
   RANKINGS CONTROLLER
========================= */

/**
 * GET /community/rankings
 * Recupera classifiche della community
 */
export const getRankings = async (req: AuthRequest, res: Response) => {
  try {
    const type = (req.query.type as string) || "matches";
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.user?.id;

    console.log('🏆 [getRankings] Recupero classifiche:', { type, limit, userId });

    // Aggrega dati dai match completati
    console.log('🔍 Aggregazione match completati...');
    const rankings = await Match.aggregate([
      {
        $match: {
          status: "completed",
        },
      },
      {
        $unwind: "$players",
      },
      {
        $match: {
          "players.status": "confirmed",
        },
      },
      {
        $group: {
          _id: "$players.user",
          matchesPlayed: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [
                { $eq: ["$players.team", "$winner"] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $addFields: {
          winRate: {
            $cond: [
              { $eq: ["$matchesPlayed", 0] },
              0,
              { $multiply: [{ $divide: ["$wins", "$matchesPlayed"] }, 100] },
            ],
          },
        },
      },
      {
        $sort:
          type === "winRate"
            ? { winRate: -1, matchesPlayed: -1 }
            : { matchesPlayed: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: "$user._id",
            name: "$user.name",
            avatarUrl: "$user.avatarUrl",
          },
          stats: {
            matchesPlayed: "$matchesPlayed",
            wins: "$wins",
            winRate: { $round: ["$winRate", 2] },
          },
        },
      },
    ]);

    console.log('✅ Rankings calcolati:', rankings.length);

    // Aggiungi rank
    const rankedData = rankings.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    // Trova posizione utente corrente
    const myRank = rankedData.find(
      (item) => item.user._id.toString() === userId
    );

    console.log('🏅 Mia posizione:', myRank ? myRank.rank : 'Non in classifica');

    res.json({
      rankings: rankedData,
      myRank: myRank || null,
    });
  } catch (error) {
    console.error("❌ Errore recupero rankings:", error);
    res.status(500).json({ message: "Errore nel recupero delle classifiche" });
  }
};

/* =========================
   STRUTTURA FOLLOW CONTROLLERS
========================= */

/**
 * POST /community/strutture/:strutturaId/follow
 * Segui una struttura
 */
export const followStruttura = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId } = req.params;
    const userId = req.user?.id;

    console.log("➕ Follow struttura:", { userId, strutturaId });

    // Verifica che la struttura esista
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ message: "Struttura not found" });
    }

    // Verifica se già segue
    const existing = await StrutturaFollower.findOne({
      user: userId,
      struttura: strutturaId,
    });

    if (existing) {
      if (existing.status === "blocked") {
        return res.status(403).json({ message: "You are blocked from following this struttura" });
      }
      return res.status(400).json({ message: "Already following this struttura" });
    }

    // Crea follow
    const follower = await StrutturaFollower.create({
      user: userId,
      struttura: strutturaId,
      status: "active",
    });

    await follower.populate("struttura", "name images location");

    console.log("✅ Struttura seguita:", follower._id);

    res.status(201).json({
      message: "Struttura followed successfully",
      follower,
    });
  } catch (error) {
    console.error("Errore follow struttura:", error);
    res.status(500).json({ message: "Errore nel seguire la struttura" });
  }
};

/**
 * DELETE /community/strutture/:strutturaId/follow
 * Smetti di seguire una struttura
 */
export const unfollowStruttura = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId } = req.params;
    const userId = req.user?.id;

    console.log("➖ Unfollow struttura:", { userId, strutturaId });

    const follower = await StrutturaFollower.findOneAndDelete({
      user: userId,
      struttura: strutturaId,
    });

    if (!follower) {
      return res.status(404).json({ message: "Not following this struttura" });
    }

    console.log("✅ Unfollow completato");

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Errore unfollow struttura:", error);
    res.status(500).json({ message: "Errore nel smettere di seguire la struttura" });
  }
};

/**
 * GET /community/strutture/:strutturaId/followers
 * Ottieni i follower di una struttura
 */
export const getStrutturaFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log("👥 Caricamento follower struttura:", strutturaId);

    const followers = await StrutturaFollower.find({
      struttura: strutturaId,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("user", "name username avatarUrl")
      .lean();

    const total = await StrutturaFollower.countDocuments({
      struttura: strutturaId,
      status: "active",
    });

    console.log("✅ Follower trovati:", followers.length);

    res.json({
      followers: followers.map((f: any) => f.user),
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Errore recupero followers:", error);
    res.status(500).json({ message: "Errore nel recupero dei follower" });
  }
};

/**
 * GET /community/strutture/:strutturaId/follow-status
 * Verifica se l'utente segue una struttura
 */
export const getStrutturaFollowStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId } = req.params;
    const userId = req.user?.id;

    console.log('🔍 [getStrutturaFollowStatus] Verifica follow status:', { strutturaId, userId });

    const follower = await StrutturaFollower.findOne({
      user: userId,
      struttura: strutturaId,
    });

    const isFollowing = follower?.status === "active";
    console.log('✅ Follow status:', isFollowing ? 'Seguendo' : 'Non seguendo');

    res.json({
      isFollowing,
      status: follower?.status || null,
    });
  } catch (error) {
    console.error("❌ Errore verifica follow status:", error);
    res.status(500).json({ message: "Errore nel verificare lo status" });
  }
};

/**
 * GET /community/strutture/:strutturaId/following
 * Ottieni gli utenti che la struttura segue
 */
export const getStrutturaFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log("👥 Caricamento following struttura:", strutturaId);

    const following = await UserFollower.find({
      struttura: strutturaId,
      status: "active",
    })
      .populate("user", "name username avatarUrl")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const total = await UserFollower.countDocuments({
      struttura: strutturaId,
      status: "active",
    });

    console.log("✅ Following trovati:", following.length);

    res.json({
      following: following.map((f: any) => f.user),
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Errore recupero following:", error);
    res.status(500).json({ message: "Errore nel recupero del following" });
  }
};

/**
 * GET /community/strutture/:strutturaId
 * Ottieni dettagli di una struttura
 */
export const getStrutturaDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId } = req.params;
    const userId = req.user?.id;

    console.log("🏢 Caricamento dettagli struttura:", strutturaId);

    const struttura = await Struttura.findOne({
      _id: strutturaId,
      isDeleted: false,
    })
      .populate("owner", "name email")
      .lean();

    if (!struttura) {
      return res.status(404).json({ message: "Struttura non trovata" });
    }

    // Verifica se l'utente segue la struttura
    const follower = await StrutturaFollower.findOne({
      struttura: strutturaId,
      user: userId,
      status: "active",
    });

    // Conta i follower
    const followersCount = await StrutturaFollower.countDocuments({
      struttura: strutturaId,
      status: "active",
    });

    // Conta i campi
    const fieldsCount = await Campo.countDocuments({
      struttura: strutturaId,
    });

    console.log("📊 Stats per struttura", strutturaId, "- Follower:", followersCount, "- Campi:", fieldsCount);

    res.json({
      ...struttura,
      isFollowing: !!follower,
      followersCount,
      fieldsCount,
    });
  } catch (error) {
    console.error("Errore caricamento dettagli struttura:", error);
    res.status(500).json({ message: "Errore nel caricamento della struttura" });
  }
};

/**
 * GET /community/strutture/:strutturaId/posts
 * Ottieni post di una struttura
 */
export const getStrutturaPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { strutturaId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log("📝 Caricamento post struttura:", strutturaId);

    // Verifica che la struttura esista
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ message: "Struttura non trovata" });
    }

    const posts = await Post.find({
      struttura: strutturaId,
      isStrutturaPost: true,
    })
      .populate("struttura", "name images location")
      .populate("comments.user", "name surname username avatarUrl")
      .populate("comments.struttura", "name images location")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments({
      struttura: strutturaId,
      isStrutturaPost: true,
    });

    console.log("✅ Post trovati:", posts.length);

    res.json({
      posts,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Errore caricamento post struttura:", error);
    res.status(500).json({ message: "Errore nel caricamento dei post" });
  }
};

/**
 * GET /community/strutture/search
 * Cerca strutture per nome
 */
export const searchStrutture = async (req: AuthRequest, res: Response) => {
  try {
    const query = (req.query.q as string) || "";
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log("🔍 Ricerca strutture:", query);

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    const strutture = await Struttura.find({
      name: { $regex: query, $options: "i" },
      isDeleted: false,
    })
      .select("name images location rating")
      .sort({ "rating.average": -1, name: 1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const total = await Struttura.countDocuments({
      name: { $regex: query, $options: "i" },
      isDeleted: false,
    });

    console.log("✅ Strutture trovate:", strutture.length);

    res.json({
      strutture,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Errore ricerca strutture:", error);
    res.status(500).json({ message: "Errore nella ricerca delle strutture" });
  }
};

/**
 * GET /community/strutture/suggestions
 * Suggerisce strutture all'utente basate su strutture seguite da amici o strutture popolari
 */
export const getStrutturaSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;

    console.log("🔍 Suggerimenti strutture per utente:", userId);
    console.log("🔍 Limit:", limit);

    // Trova strutture dove l'utente ha giocato (prenotato)
    console.log("🔍 Recupero strutture dove l'utente ha giocato...");
    const playedBookings = await Booking.find({ user: userId }).select('struttura').distinct('struttura');
    console.log("🔍 Prenotazioni trovate:", playedBookings.length);
    const playedStrutturaIds = playedBookings.map(id => id.toString());
    console.log("🔍 ID strutture giocate:", playedStrutturaIds);

    // Trova amici dell'utente
    console.log("🔍 Recupero amici...");
    const friendships = await Friendship.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    }).select('_id requester recipient');

    console.log("🔍 Amicizie trovate:", friendships.length);

    const friendIds = friendships.map(f => 
      f.requester.toString() === userId ? f.recipient : f.requester
    );

    console.log("🔍 ID amici:", friendIds);

    // Trova strutture seguite dagli amici
    console.log("🔍 Recupero strutture seguite dagli amici...");
    const friendFollowedStrutture = await StrutturaFollower.find({
      follower: { $in: friendIds }
    }).select('struttura follower').limit(50);

    console.log("🔍 Strutture seguite dagli amici trovate:", friendFollowedStrutture.length);

    const friendStrutturaIds = friendFollowedStrutture.map(f => f.struttura.toString());
    console.log("🔍 ID strutture amici (string):", friendStrutturaIds);

    // Trova strutture popolari (con più follower)
    console.log("🔍 Recupero strutture popolari...");
    const popularStrutture = await StrutturaFollower.aggregate([
      {
        $group: {
          _id: '$struttura',
          followerCount: { $sum: 1 }
        }
      },
      {
        $sort: { followerCount: -1 }
      },
      {
        $limit: 20
      }
    ]);

    console.log("🔍 Strutture popolari trovate:", popularStrutture.length);
    const popularStrutturaIds = popularStrutture.map(p => p._id.toString());
    console.log("🔍 ID strutture popolari (string):", popularStrutturaIds);

    // Trova strutture già seguite dall'utente
    console.log("🔍 Recupero strutture seguite dall'utente...");
    const userFollowedStrutture = await StrutturaFollower.find({
      follower: userId
    }).select('struttura');

    console.log("🔍 Strutture seguite dall'utente:", userFollowedStrutture.length);
    const userFollowedIds = userFollowedStrutture.map(f => f.struttura.toString());
    console.log("🔍 ID strutture utente seguite:", userFollowedIds);

    // Combina e rimuovi duplicati, escludendo strutture già seguite dall'utente
    const combinedIds = [...playedStrutturaIds, ...friendStrutturaIds, ...popularStrutturaIds];
    console.log("🔍 ID combinati prima del set:", combinedIds.length);

    const uniqueIds = [...new Set(combinedIds)];
    console.log("🔍 ID unici dopo set:", uniqueIds.length);

    const suggestedIds = uniqueIds
      .filter(id => !userFollowedIds.includes(id))
      .slice(0, limit);

    console.log("🔍 ID suggeriti finali:", suggestedIds);

    if (suggestedIds.length === 0) {
      console.log("🔍 Nessun suggerimento disponibile");
      return res.json({ suggestions: [] });
    }

    // Converti a ObjectId per la query
    const objectIds = suggestedIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (error) {
        console.error("🔍 Errore conversione ObjectId per:", id, error);
        return null;
      }
    }).filter(id => id !== null);

    console.log("🔍 ObjectId validi:", objectIds.length);

    // Recupera i dettagli delle strutture suggerite
    console.log("🔍 Query strutture suggerite...");
    const suggestedStrutture = await Struttura.find({
      _id: { $in: objectIds },
      isDeleted: false
    })
      .select('name description images location')
      .lean();

    console.log("🔍 Strutture trovate nel DB:", suggestedStrutture.length);

    // Aggiungi informazioni sul follow status per ogni struttura
    console.log("🔍 Aggiunta follow status...");
    const struttureWithFollowStatus = await Promise.all(
      suggestedStrutture.map(async (struttura) => {
        try {
          const followStatus = await StrutturaFollower.findOne({
            struttura: struttura._id,
            follower: userId
          });

          const strutturaIdStr = struttura._id.toString();
          const isFollowedByFriends = friendStrutturaIds.includes(strutturaIdStr);
          const isPlayed = playedStrutturaIds.includes(strutturaIdStr);

          // Determina la ragione del suggerimento
          let reasonType: string;
          let reasonScore: number;
          if (isPlayed) {
            reasonType = 'played';
            reasonScore = 3;
          } else if (isFollowedByFriends) {
            reasonType = 'followed_by_friends';
            reasonScore = 2;
          } else {
            reasonType = 'popular';
            reasonScore = 1;
          }

          console.log(`🔍 Struttura ${struttura.name} (${strutturaIdStr}): ragione=${reasonType}, score=${reasonScore}`);

          return {
            ...struttura,
            isFollowing: !!followStatus,
            reason: { type: reasonType, details: {} },
            score: reasonScore
          };
        } catch (error) {
          console.error("🔍 Errore nel mapping struttura:", struttura._id, error);
          return null;
        }
      })
    );

    const validStrutture = struttureWithFollowStatus.filter(s => s !== null);
    console.log("🔍 Strutture valide dopo mapping:", validStrutture.length);

    // Ordina per score (amici prima) e limita
    const sortedSuggestions = validStrutture
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    console.log("✅ Suggerimenti strutture completati:", sortedSuggestions.length);

    res.json({
      suggestions: sortedSuggestions
    });
  } catch (error) {
    console.error("❌ Errore suggerimenti strutture:", error);
    res.status(500).json({ message: "Errore nel recupero dei suggerimenti strutture" });
  }
};

/* =========================
   USER FOLLOW CONTROLLERS (Struttura -> User)
========================= */

/**
 * POST /community/users/:userId/follow
 * Una struttura segue un utente
 */
export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { strutturaId } = req.body;
    const ownerId = req.user?.id;

    console.log("➕ Struttura segue utente:", { ownerId, strutturaId, userId });

    if (!strutturaId) {
      return res.status(400).json({ message: "strutturaId is required" });
    }

    // Verifica che la struttura esista e appartenga all'owner
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      owner: ownerId,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ message: "Struttura not found or not owned by you" });
    }

    // Verifica se già segue
    const existing = await UserFollower.findOne({
      struttura: strutturaId,
      user: userId,
    });

    if (existing) {
      if (existing.status === "blocked") {
        return res.status(403).json({ message: "Cannot follow this user" });
      }
      return res.status(400).json({ message: "Already following this user" });
    }

    // Crea follow
    const follower = await UserFollower.create({
      struttura: strutturaId,
      user: userId,
      status: "active",
    });

    await follower.populate("user", "name surname username avatarUrl");

    console.log("✅ Utente seguito:", follower._id);

    res.status(201).json({
      message: "User followed successfully",
      follower,
    });
  } catch (error) {
    console.error("Errore follow utente:", error);
    res.status(500).json({ message: "Errore nel seguire l'utente" });
  }
};

/**
 * DELETE /community/users/:userId/follow
 * Una struttura smette di seguire un utente
 */
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { strutturaId } = req.body;
    const ownerId = req.user?.id;

    console.log("➖ Struttura unfollow utente:", { ownerId, strutturaId, userId });

    if (!strutturaId) {
      return res.status(400).json({ message: "strutturaId is required" });
    }

    // Verifica che la struttura appartenga all'owner
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      owner: ownerId,
      isDeleted: false,
    });

    if (!struttura) {
      return res.status(404).json({ message: "Struttura not found or not owned by you" });
    }

    const follower = await UserFollower.findOneAndDelete({
      struttura: strutturaId,
      user: userId,
    });

    if (!follower) {
      return res.status(404).json({ message: "Not following this user" });
    }

    console.log("✅ Unfollow completato");

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Errore unfollow utente:", error);
    res.status(500).json({ message: "Errore nel smettere di seguire l'utente" });
  }
};

/**
 * GET /community/users/:userId/follow-status
 * Verifica se una struttura segue un utente
 */
export const getUserFollowStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { strutturaId } = req.query;
    const ownerId = req.user?.id;

    console.log('🔍 [getUserFollowStatus] Verifica follow struttura->utente:', { userId, strutturaId, ownerId });

    if (!strutturaId) {
      console.log('❌ strutturaId mancante');
      return res.status(400).json({ message: "strutturaId is required" });
    }

    // Verifica che la struttura appartenga all'owner
    const struttura = await Struttura.findOne({
      _id: strutturaId,
      owner: ownerId,
      isDeleted: false,
    });

    if (!struttura) {
      console.log('❌ Struttura non trovata o non di proprietà');
      return res.status(404).json({ message: "Struttura not found" });
    }

    console.log('✅ Struttura verificata, controllo follow...');
    const follower = await UserFollower.findOne({
      struttura: strutturaId,
      user: userId,
    });

    const isFollowing = follower?.status === "active";
    console.log('✅ Follow status:', isFollowing ? 'Seguendo' : 'Non seguendo');

    res.json({
      isFollowing,
      status: follower?.status || null,
    });
  } catch (error) {
    console.error("❌ Errore verifica follow status:", error);
    res.status(500).json({ message: "Errore nel verificare lo status" });
  }
};


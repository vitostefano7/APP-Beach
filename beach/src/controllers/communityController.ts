import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Post from "../models/Post";
import CommunityEvent from "../models/CommunityEvent";
import Match from "../models/Match";
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
      console.log('🏢 Filtro per struttura:', strutturaId);
      
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

      // Mostra solo post delle strutture seguite + la struttura stessa
      queryFilter = {
        isStrutturaPost: true,
        struttura: { $in: allStrutturaIds },
      };
    }
    // Se l'utente vuole vedere solo i post degli utenti/strutture seguiti
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

      // Post degli utenti seguiti O post delle strutture seguite
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
 * POST /community/posts/:postId/like
 * Like/Unlike un post (toggle)
 */
export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likeIndex = post.likes.findIndex(
      (id) => id.toString() === userId
    );

    let liked = false;
    if (likeIndex > -1) {
      // Rimuovi like
      post.likes.splice(likeIndex, 1);
      liked = false;
    } else {
      // Aggiungi like
      post.likes.push(userId as any);
      liked = true;
    }

    await post.save();

    res.json({
      message: liked ? "Post liked" : "Post unliked",
      liked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Errore like post:", error);
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

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Verifica che l'utente sia il creatore
    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    // Elimina immagine da Cloudinary se presente
    if (post.image) {
      try {
        const publicId = post.image.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(`community/posts/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Errore eliminazione immagine Cloudinary:", cloudinaryError);
        // Continua comunque con l'eliminazione del post
      }
    }

    await Post.findByIdAndDelete(postId);

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Errore eliminazione post:", error);
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

    let query: any = {};

    if (status !== "all") {
      query.status = status;
    }

    // Filtra eventi futuri per "upcoming"
    if (status === "upcoming") {
      query.date = { $gte: new Date() };
    }

    const events = await CommunityEvent.find(query)
      .sort({ date: 1 }) // Prossimi eventi per primi
      .limit(limit)
      .populate("organizer", "name avatarUrl")
      .populate("participants", "name avatarUrl")
      .lean();

    const total = await CommunityEvent.countDocuments(query);

    res.json({
      events,
      total,
    });
  } catch (error) {
    console.error("Errore recupero eventi:", error);
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

    // Validazione
    if (!title || !description || !date || !location || !maxParticipants) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return res.status(400).json({ message: "Event date must be in the future" });
    }

    // Upload immagine se presente
    let imageUrl: string | undefined;
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer, "community/events");
      } catch (uploadError) {
        console.error("Errore upload immagine:", uploadError);
        return res.status(500).json({ message: "Errore nell'upload dell'immagine" });
      }
    }

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

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Errore creazione evento:", error);
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

    const event = await CommunityEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const participantIndex = event.participants.findIndex(
      (id) => id.toString() === userId
    );

    let joined = false;
    if (participantIndex > -1) {
      // Disiscrivi
      event.participants.splice(participantIndex, 1);
      joined = false;
    } else {
      // Iscriviti
      if (event.participants.length >= event.maxParticipants) {
        return res.status(400).json({ message: "Event is full" });
      }
      event.participants.push(userId as any);
      joined = true;
    }

    await event.save();

    res.json({
      message: joined ? "Successfully joined event" : "Successfully left event",
      joined,
      participantsCount: event.participants.length,
    });
  } catch (error) {
    console.error("Errore join evento:", error);
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

    // Aggrega dati dai match completati
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

    // Aggiungi rank
    const rankedData = rankings.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    // Trova posizione utente corrente
    const myRank = rankedData.find(
      (item) => item.user._id.toString() === userId
    );

    res.json({
      rankings: rankedData,
      myRank: myRank || null,
    });
  } catch (error) {
    console.error("Errore recupero rankings:", error);
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

    const followers = await StrutturaFollower.find({
      struttura: strutturaId,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate("user", "name surname username avatarUrl")
      .lean();

    const total = await StrutturaFollower.countDocuments({
      struttura: strutturaId,
      status: "active",
    });

    res.json({
      followers,
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

    const follower = await StrutturaFollower.findOne({
      user: userId,
      struttura: strutturaId,
    });

    res.json({
      isFollowing: follower?.status === "active",
      status: follower?.status || null,
    });
  } catch (error) {
    console.error("Errore verifica follow status:", error);
    res.status(500).json({ message: "Errore nel verificare lo status" });
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
      isDeleted: false,
    });

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
      return res.status(404).json({ message: "Struttura not found" });
    }

    const follower = await UserFollower.findOne({
      struttura: strutturaId,
      user: userId,
    });

    res.json({
      isFollowing: follower?.status === "active",
      status: follower?.status || null,
    });
  } catch (error) {
    console.error("Errore verifica follow status:", error);
    res.status(500).json({ message: "Errore nel verificare lo status" });
  }
};


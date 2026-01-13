import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Post from "../models/Post";
import CommunityEvent from "../models/CommunityEvent";
import Match from "../models/Match";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

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

    console.log('Parametri query:');
    console.log('  limit:', limit);
    console.log('  offset:', offset);
    console.log('  sort:', sort);

    let sortQuery: any = { createdAt: -1 }; // Default: più recenti

    if (sort === "popular") {
      sortQuery = { createdAt: -1 };
    }

    console.log('Eseguo query Post.find()...');
    const posts = await Post.find()
      .sort(sortQuery)
      .skip(offset)
      .limit(limit)
      .populate("user", "name surname username avatarUrl")
      .populate("comments.user", "name surname username avatarUrl")
      .lean();

    console.log('Posts trovati:', posts.length);

    const total = await Post.countDocuments();
    console.log('Total posts nel DB:', total);

    const hasMore = offset + limit < total;
    console.log('HasMore:', hasMore);

    if (posts.length > 0) {
      console.log('\nPrimo post:');
      console.log('  ID:', posts[0]._id);
      console.log('  User:', posts[0].user);
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
 * POST /community/posts
 * Crea un nuovo post
 */
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    console.log('========================================');
    console.log('📝 POST /community/posts - CREAZIONE POST');
    console.log('========================================');
    console.log('User ID:', req.user?.id);
    console.log('User role:', req.user?.role);

    const { content } = req.body;
    const userId = req.user?.id;

    console.log('\n📋 BODY REQUEST:');
    console.log('  content:', content);
    console.log('  content length:', content?.length);
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
    };
    console.log('  Dati post:', JSON.stringify(postData, null, 2));

    const post = new Post(postData);

    console.log('  Salvataggio in corso...');
    await post.save();
    console.log('  ✅ Post salvato con ID:', post._id);

    // Popola user per response
    console.log('\n👤 POPOLO USER:');
    await post.populate("user", "name surname username avatarUrl");
    console.log('  User popolato:', {
      id: (post.user as any)._id,
      name: (post.user as any).name,
      surname: (post.user as any).surname,
      username: (post.user as any).username,
      avatarUrl: (post.user as any).avatarUrl
    });

    console.log('\n📤 INVIO RISPOSTA:');
    console.log('  Status: 201');
    console.log('  Post ID:', post._id);
    console.log('  Post content:', post.content?.substring(0, 50));
    console.log('  Post image:', post.image);
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
    const { text } = req.body;
    const userId = req.user?.id;

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
    post.comments.push({
      _id: new (require("mongoose").Types.ObjectId)(),
      user: userId as any,
      text: text.trim(),
      createdAt: new Date(),
    });

    await post.save();

    // Popola l'ultimo commento per response
    await post.populate("comments.user", "name surname username avatarUrl");
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      message: "Comment added",
      comment: newComment,
    });
  } catch (error) {
    console.error("Errore aggiunta commento:", error);
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

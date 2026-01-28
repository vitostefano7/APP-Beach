// seeds/generatePosts.ts
import Post from "../models/Post";
import { generatePostContent, generateComment } from "./postUtils";
import { NUM_USER_POSTS, NUM_STRUTTURA_POSTS, randomInt, randomElement } from "./config";

export async function generatePosts(users: any[], strutture: any[]) {
  console.log(`📰 Creazione ${NUM_USER_POSTS} post utenti...`);

  const postsData = [];

  // USER POSTS
  for (let i = 0; i < NUM_USER_POSTS; i++) {
    const author = randomElement(users);
    const content = generatePostContent();
    const likesCount = randomInt(0, 50);
    const commentsCount = randomInt(0, 20);

    // Random users for likes
    const shuffled = [...users].sort(() => 0.5 - Math.random());
    const likes = shuffled.slice(0, likesCount).map((u: any) => u._id);

    // Comments
    const comments = [];
    for (let c = 0; c < commentsCount; c++) {
      const commenter = randomElement(users);
      comments.push({
        user: commenter._id,
        text: generateComment(),
        createdAt: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000),
      });
    }

    postsData.push({
      user: author._id,
      content,
      likes,
      comments,
      isStrutturaPost: false,
      createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
    });
  }

  // STRUTTURA POSTS
  console.log(`📰 Creazione ${NUM_STRUTTURA_POSTS} post strutture...`);
  for (let i = 0; i < NUM_STRUTTURA_POSTS; i++) {
    const struttura = randomElement(strutture);
    const content = generatePostContent();
    const likesCount = randomInt(5, 100);
    const commentsCount = randomInt(0, 30);

    const shuffled = [...users].sort(() => 0.5 - Math.random());
    const likes = shuffled.slice(0, likesCount).map((u: any) => u._id);

    const comments = [];
    for (let c = 0; c < commentsCount; c++) {
      const commenter = randomElement(users);
      comments.push({
        user: commenter._id,
        text: generateComment(),
        createdAt: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000),
      });
    }

    // Per i post delle strutture, l'owner della struttura è il 'user' che posta
    postsData.push({
      user: struttura.owner,
      content,
      likes,
      comments,
      struttura: struttura._id,
      isStrutturaPost: true,
      createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000),
    });
  }

  const posts = await Post.insertMany(postsData);
  console.log(`✅ ${posts.length} post creati`);

  return posts;
}

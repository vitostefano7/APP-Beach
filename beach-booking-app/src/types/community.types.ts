/**
 * Shared types for Community features
 */

export interface User {
  _id: string;
  name: string;
  surname?: string;
  username?: string;
  avatarUrl?: string;
  friendshipStatus?: 'none' | 'pending' | 'accepted';
  followStatus?: 'none' | 'following';
}

export interface Struttura {
  _id: string;
  name: string;
  images: string[];
  location: {
    city: string;
    address?: string;
  };
}

export interface Comment {
  _id: string;
  text: string;
  user: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  struttura?: {
    _id: string;
    name: string;
    images: string[];
  };
  createdAt: string;
}

export interface Post {
  _id: string;
  content: string;
  image?: string;
  user?: User;
  struttura?: {
    _id: string;
    name: string;
    images: string[];
    location?: {
      city: string;
    };
  };
  isStrutturaPost: boolean;
  likes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt?: string;
}

export interface Event {
  _id: string;
  title: string;
  date: string;
  location: string;
  participants: number;
  maxParticipants: number;
  image?: string;
}

export type CommunityTab = 'tutti' | 'post' | 'tornei' | 'search';

export interface PostInteraction {
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

import { useState, useCallback } from 'react';
import { Post } from '../../../types/community.types';
import API_URL from '../../../config/api';

interface UsePostsOptions {
  token: string;
  userId?: string;
  strutturaId?: string;
  filter?: 'following' | 'all';
}

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadPosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
}

export const usePosts = ({
  token,
  userId,
  strutturaId,
  filter = 'all',
}: UsePostsOptions): UsePostsReturn => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      let url = `${API_URL}/community/posts?limit=50&offset=0`;
      
      if (strutturaId) {
        url += `&strutturaId=${strutturaId}`;
      }
      
      if (filter === 'following') {
        url += `&filter=following`;
      }

      console.log('📡 Fetching posts from:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both array and {posts: []} response formats
      const postsData = Array.isArray(data) ? data : (data.posts || []);
      
      console.log('✅ Loaded posts:', postsData.length);
      setPosts(postsData);
    } catch (err: any) {
      console.error('❌ Error loading posts:', err);
      setError(err.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, strutturaId, filter]);

  const refreshPosts = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
  }, [loadPosts]);

  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prev =>
      prev.map(post => (post._id === postId ? { ...post, ...updates } : post))
    );
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  }, []);

  return {
    posts,
    loading,
    refreshing,
    error,
    loadPosts,
    refreshPosts,
    addPost,
    updatePost,
    removePost,
  };
};

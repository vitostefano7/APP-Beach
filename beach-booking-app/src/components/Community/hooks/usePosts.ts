import { useState, useCallback } from 'react';
import { Post } from '../../../types/community.types';
import API_URL from '../../../config/api';

interface UsePostsOptions {
  token: string;
  userId?: string;
  strutturaId?: string;
  filter?: 'following' | 'all';
  pageSize?: number;
}

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  refreshing: boolean;
  error: string | null;
  loadPosts: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
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
  pageSize = 50,
}: UsePostsOptions): UsePostsReturn => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildPostsUrl = useCallback((nextOffset: number) => {
    let url = `${API_URL}/community/posts?limit=${pageSize}&offset=${nextOffset}`;

    if (strutturaId) {
      url += `&strutturaId=${strutturaId}`;
    }

    if (filter === 'following') {
      url += `&filter=following`;
    }

    return url;
  }, [pageSize, strutturaId, filter]);

  const getPostsFromResponse = (data: any): Post[] => {
    if (Array.isArray(data)) {
      return data;
    }

    return data.posts || [];
  };

  const getHasMoreFromResponse = (data: any, postsData: Post[]) => {
    if (Array.isArray(data)) {
      return postsData.length >= pageSize;
    }

    if (typeof data.hasMore === 'boolean') {
      return data.hasMore;
    }

    return postsData.length >= pageSize;
  };

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const nextOffset = 0;
      const url = buildPostsUrl(nextOffset);

      console.log('🧭 [usePosts] loadPosts:start', {
        filter,
        strutturaId: strutturaId || null,
        pageSize,
        nextOffset,
        currentPostsLength: posts.length,
      });
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
      const postsData = getPostsFromResponse(data);
      const nextHasMore = getHasMoreFromResponse(data, postsData);
      
      console.log('✅ [usePosts] loadPosts:success', {
        received: postsData.length,
        nextOffset: postsData.length,
        hasMore: nextHasMore,
        total: typeof data?.total === 'number' ? data.total : null,
      });
      setPosts(postsData);
      setOffset(postsData.length);
      setHasMore(nextHasMore);
    } catch (err: any) {
      console.error('❌ Error loading posts:', err);
      setError(err.message || 'Failed to load posts');
      setPosts([]);
      setOffset(0);
      setHasMore(false);
    } finally {
      console.log('🏁 [usePosts] loadPosts:end');
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildPostsUrl, filter, strutturaId, pageSize, posts.length]);

  const loadMorePosts = useCallback(async () => {
    if (loading || loadingMore || refreshing || !hasMore) {
      console.log('⏭️ [usePosts] loadMorePosts:skipped', {
        loading,
        loadingMore,
        refreshing,
        hasMore,
        offset,
        postsLength: posts.length,
      });
      return;
    }

    try {
      setLoadingMore(true);

      const url = buildPostsUrl(offset);

      console.log('🧭 [usePosts] loadMorePosts:start', {
        filter,
        strutturaId: strutturaId || null,
        pageSize,
        offset,
        postsLength: posts.length,
      });
      console.log('📡 Loading more posts from:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch more posts: ${response.status}`);
      }

      const data = await response.json();
      const postsData = getPostsFromResponse(data);
      const nextHasMore = getHasMoreFromResponse(data, postsData);

      console.log('✅ [usePosts] loadMorePosts:success', {
        received: postsData.length,
        currentOffset: offset,
        nextOffset: offset + postsData.length,
        hasMore: nextHasMore,
        total: typeof data?.total === 'number' ? data.total : null,
      });

      setPosts(prev => {
        const existingPostIds = new Set(prev.map(post => post._id));
        const uniqueNewPosts = postsData.filter(post => !existingPostIds.has(post._id));
        console.log('🧮 [usePosts] loadMorePosts:merge', {
          previousLength: prev.length,
          incomingLength: postsData.length,
          uniqueIncomingLength: uniqueNewPosts.length,
          nextLength: prev.length + uniqueNewPosts.length,
        });
        return [...prev, ...uniqueNewPosts];
      });
      setOffset(prev => prev + postsData.length);
      setHasMore(nextHasMore);
    } catch (err: any) {
      console.error('❌ Error loading more posts:', err);
      setError(err.message || 'Failed to load more posts');
    } finally {
      console.log('🏁 [usePosts] loadMorePosts:end');
      setLoadingMore(false);
    }
  }, [loading, loadingMore, refreshing, hasMore, buildPostsUrl, offset, token, posts.length, filter, strutturaId, pageSize]);

  const refreshPosts = useCallback(async () => {
    console.log('🔄 [usePosts] refreshPosts:start');
    setRefreshing(true);
    await loadPosts();
    console.log('✅ [usePosts] refreshPosts:end');
  }, [loadPosts]);

  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev]);
    setOffset(prev => prev + 1);
  }, []);

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prev =>
      prev.map(post => (post._id === postId ? { ...post, ...updates } : post))
    );
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
    setOffset(prev => Math.max(0, prev - 1));
  }, []);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    refreshing,
    error,
    loadPosts,
    loadMorePosts,
    refreshPosts,
    addPost,
    updatePost,
    removePost,
  };
};

import { useState, useCallback, useEffect } from 'react';
import { Post } from '../../../types/community.types';
import API_URL from '../../../config/api';

const FEED_CACHE_TTL_MS = 60 * 1000;

type FeedCacheEntry = {
  posts: Post[];
  offset: number;
  hasMore: boolean;
  updatedAt: number;
};

const postsFeedCache = new Map<string, FeedCacheEntry>();

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
  const cacheKey = `${userId || 'anon'}:${strutturaId || 'none'}:${filter}:${pageSize}`;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyCacheEntry = useCallback((entry: FeedCacheEntry) => {
    setPosts(entry.posts);
    setOffset(entry.offset);
    setHasMore(entry.hasMore);
  }, []);

  const writeCacheEntry = useCallback((nextPosts: Post[], nextOffset: number, nextHasMore: boolean) => {
    postsFeedCache.set(cacheKey, {
      posts: nextPosts,
      offset: nextOffset,
      hasMore: nextHasMore,
      updatedAt: Date.now(),
    });
  }, [cacheKey]);

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

  useEffect(() => {
    const cachedEntry = postsFeedCache.get(cacheKey);

    if (cachedEntry) {
      console.log('⚡ [usePosts] cache hydrate', {
        cacheKey,
        postsLength: cachedEntry.posts.length,
        ageMs: Date.now() - cachedEntry.updatedAt,
      });
      applyCacheEntry(cachedEntry);
      return;
    }

    setPosts([]);
    setOffset(0);
    setHasMore(true);
  }, [cacheKey, applyCacheEntry]);

  const loadPostsInternal = useCallback(async (forceNetwork = false) => {
    const cachedEntry = postsFeedCache.get(cacheKey);
    const cacheAgeMs = cachedEntry ? Date.now() - cachedEntry.updatedAt : Number.POSITIVE_INFINITY;
    const isCacheFresh = !!cachedEntry && cacheAgeMs < FEED_CACHE_TTL_MS;

    if (cachedEntry) {
      applyCacheEntry(cachedEntry);
    }

    if (!forceNetwork && isCacheFresh) {
      console.log('✅ [usePosts] loadPosts:served-from-cache', {
        cacheKey,
        postsLength: cachedEntry?.posts.length || 0,
        ageMs: cacheAgeMs,
      });
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(!cachedEntry);
      setError(null);

      const nextOffset = 0;
      const url = buildPostsUrl(nextOffset);

      console.log('🧭 [usePosts] loadPosts:start', {
        filter,
        strutturaId: strutturaId || null,
        pageSize,
        nextOffset,
        cacheKey,
        cacheHit: !!cachedEntry,
        forceNetwork,
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
      writeCacheEntry(postsData, postsData.length, nextHasMore);
    } catch (err: any) {
      console.error('❌ Error loading posts:', err);
      setError(err.message || 'Failed to load posts');

      if (!cachedEntry) {
        setPosts([]);
        setOffset(0);
        setHasMore(false);
      }
    } finally {
      console.log('🏁 [usePosts] loadPosts:end');
      setLoading(false);
      setRefreshing(false);
    }
  }, [cacheKey, buildPostsUrl, token, filter, strutturaId, pageSize, applyCacheEntry, writeCacheEntry]);

  const loadPosts = useCallback(async () => {
    await loadPostsInternal(false);
  }, [loadPostsInternal]);

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
        const mergedPosts = [...prev, ...uniqueNewPosts];
        writeCacheEntry(mergedPosts, offset + postsData.length, nextHasMore);
        console.log('🧮 [usePosts] loadMorePosts:merge', {
          previousLength: prev.length,
          incomingLength: postsData.length,
          uniqueIncomingLength: uniqueNewPosts.length,
          nextLength: mergedPosts.length,
        });
        return mergedPosts;
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
  }, [loading, loadingMore, refreshing, hasMore, buildPostsUrl, offset, token, posts.length, filter, strutturaId, pageSize, writeCacheEntry]);

  const refreshPosts = useCallback(async () => {
    console.log('🔄 [usePosts] refreshPosts:start');
    setRefreshing(true);
    await loadPostsInternal(true);
    console.log('✅ [usePosts] refreshPosts:end');
  }, [loadPostsInternal]);

  const addPost = useCallback((post: Post) => {
    setPosts(prev => {
      const existingPostIds = new Set(prev.map(item => item._id));
      const nextPosts = existingPostIds.has(post._id)
        ? prev
        : [post, ...prev];
      const nextOffset = nextPosts.length;
      setOffset(nextOffset);
      writeCacheEntry(nextPosts, nextOffset, hasMore);
      return nextPosts;
    });
  }, [hasMore, writeCacheEntry]);

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prev => {
      const nextPosts = prev.map(post => (post._id === postId ? { ...post, ...updates } : post));
      writeCacheEntry(nextPosts, nextPosts.length, hasMore);
      return nextPosts;
    });
  }, [hasMore, writeCacheEntry]);

  const removePost = useCallback((postId: string) => {
    setPosts(prev => {
      const nextPosts = prev.filter(post => post._id !== postId);
      const nextOffset = nextPosts.length;
      setOffset(nextOffset);
      writeCacheEntry(nextPosts, nextOffset, hasMore);
      return nextPosts;
    });
  }, [hasMore, writeCacheEntry]);

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

import { useCallback } from 'react';
import API_URL from '../../../config/api';

interface UsePostInteractionsOptions {
  token: string;
  userId?: string;
  onLikeToggled?: (postId: string, isLiked: boolean) => void;
}

interface UsePostInteractionsReturn {
  likePost: (postId: string) => Promise<boolean>;
  sharePost: (postId: string) => Promise<void>;
}

export const usePostInteractions = ({
  token,
  userId,
  onLikeToggled,
}: UsePostInteractionsOptions): UsePostInteractionsReturn => {
  const likePost = useCallback(
    async (postId: string): Promise<boolean> => {
      try {
        console.log('❤️ Toggling like for post:', postId);

        const response = await fetch(`${API_URL}/community/posts/${postId}/like`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to like post: ${response.status}`);
        }

        const data = await response.json();
        const isLiked = data.liked ?? false;
        
        console.log('✅ Like toggled:', isLiked);
        onLikeToggled?.(postId, isLiked);
        
        return isLiked;
      } catch (err: any) {
        console.error('❌ Error liking post:', err);
        return false;
      }
    },
    [token, onLikeToggled]
  );

  const sharePost = useCallback(
    async (postId: string): Promise<void> => {
      try {
        console.log('🔗 Sharing post:', postId);
        // TODO: Implement share functionality
        // Could open share sheet, copy link, etc.
      } catch (err: any) {
        console.error('❌ Error sharing post:', err);
      }
    },
    []
  );

  return {
    likePost,
    sharePost,
  };
};

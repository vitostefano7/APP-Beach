import { useState, useCallback } from 'react';
import { Comment } from '../../../types/community.types';
import API_URL from '../../../config/api';

interface UseCommentsOptions {
  token: string;
  postId: string;
  strutturaId?: string;
  onCommentAdded?: (comment: Comment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

interface UseCommentsReturn {
  posting: boolean;
  deleting: Set<string>;
  postComment: (text: string) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<boolean>;
}

export const useComments = ({
  token,
  postId,
  strutturaId,
  onCommentAdded,
  onCommentDeleted,
}: UseCommentsOptions): UseCommentsReturn => {
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  const postComment = useCallback(
    async (text: string): Promise<Comment | null> => {
      if (!text.trim()) return null;

      setPosting(true);
      try {
        const body: any = { text: text.trim() };
        
        // Include strutturaId if posting as a structure (owner mode)
        if (strutturaId) {
          body.strutturaId = strutturaId;
        }

        console.log('💬 Posting comment:', { postId, body });

        const response = await fetch(`${API_URL}/community/posts/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Failed to post comment: ${response.status}`);
        }

        const newComment = await response.json();
        console.log('✅ Comment posted:', newComment._id);
        
        onCommentAdded?.(newComment);
        return newComment;
      } catch (err: any) {
        console.error('❌ Error posting comment:', err);
        return null;
      } finally {
        setPosting(false);
      }
    },
    [token, postId, strutturaId, onCommentAdded]
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      setDeleting(prev => new Set(prev).add(commentId));
      try {
        console.log('🗑️ Deleting comment:', commentId);

        const response = await fetch(
          `${API_URL}/community/posts/${postId}/comments/${commentId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete comment: ${response.status}`);
        }

        console.log('✅ Comment deleted');
        onCommentDeleted?.(commentId);
        return true;
      } catch (err: any) {
        console.error('❌ Error deleting comment:', err);
        return false;
      } finally {
        setDeleting(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
      }
    },
    [token, postId, onCommentDeleted]
  );

  return {
    posting,
    deleting,
    postComment,
    deleteComment,
  };
};

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  replies?: Comment[];
}

interface CommentsSectionProps {
  targetType: 'tool' | 'risk' | 'incident';
  targetId: string;
  currentUserId?: string;
}

export function CommentsSection({ targetType, targetId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [targetType, targetId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const result = await api.get<Comment[]>(`/api/comments/${targetType}/${targetId}`);
      if (result.success && result.data) {
        setComments(result.data);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const result = await api.post(`/api/comments/${targetType}/${targetId}`, {
        content: newComment.trim(),
      });

      if (result.success) {
        setNewComment('');
        loadComments();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const result = await api.post(`/api/comments/${targetType}/${targetId}`, {
        content: replyContent.trim(),
        parentId,
      });

      if (result.success) {
        setReplyContent('');
        setReplyingTo(null);
        loadComments();
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading comments...</div>;
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments & Discussion</h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            Post Comment
          </button>
        </div>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{comment.author.name}</p>
                  <p className="text-xs text-gray-500">{formatTime(comment.createdAt)}</p>
                </div>
                <span className="text-xs text-gray-500">{comment.author.role}</span>
              </div>
              <p className="text-gray-700 mb-3">{comment.content}</p>

              {/* Reply Button */}
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-sm text-blue-600 hover:text-blue-900"
              >
                {replyingTo === comment.id ? 'Cancel' : 'Reply'}
              </button>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyContent.trim()}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="border border-gray-100 rounded p-3 bg-gray-50">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900">{reply.author.name}</p>
                        <p className="text-xs text-gray-500">{formatTime(reply.createdAt)}</p>
                      </div>
                      <p className="text-sm text-gray-700">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


import React, { useState } from 'react';
import { Comment, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface TicketCommentsProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
  currentUser?: User;
}

const TicketComments: React.FC<TicketCommentsProps> = ({ 
  comments, 
  onAddComment,
  currentUser
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Comments</h3>
      
      {comments.length > 0 ? (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="h-8 w-8 mt-0.5">
                <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                <AvatarFallback>{comment.author.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium text-sm">{comment.author.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <div className="mt-1 text-sm">
                  {comment.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          No comments yet
        </div>
      )}
      
      {currentUser && (
        <form onSubmit={handleSubmitComment} className="mt-4">
          <div className="flex space-x-3">
            <Avatar className="h-8 w-8 mt-0.5">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="mt-2 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default TicketComments;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare } from 'lucide-react';
import { Ticket } from '@/lib/types';

interface TicketCommentsProps {
  ticket: Ticket;
  newComment: string;
  setNewComment: (comment: string) => void;
  handleCommentSubmit: () => void;
}

const TicketComments: React.FC<TicketCommentsProps> = ({
  ticket,
  newComment,
  setNewComment,
  handleCommentSubmit,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          Comments ({ticket.comments.length})
        </h3>
      </div>
      
      <div className="space-y-4">
        {ticket.comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
              <AvatarFallback>{comment.author.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{comment.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                  }).format(comment.createdAt)}
                </span>
              </div>
              <div className="text-sm mt-1">{comment.content}</div>
            </div>
          </div>
        ))}
        
        {ticket.comments.length === 0 && (
          <div className="text-sm text-muted-foreground">No comments yet.</div>
        )}
      </div>
      
      <div className="mt-4">
        <Textarea
          placeholder="Add a comment..."
          className="w-full resize-none"
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="flex justify-end mt-2">
          <Button 
            size="sm" 
            onClick={handleCommentSubmit}
            disabled={!newComment.trim()}
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketComments;

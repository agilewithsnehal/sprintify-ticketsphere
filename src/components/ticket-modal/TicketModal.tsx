
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Ticket, User } from '@/lib/types';
import TicketHeader from './TicketHeader';
import TicketDetails from './TicketDetails';
import TicketDescription from './TicketDescription';
import TicketComments from './TicketComments';
import { supabaseService } from '@/lib/supabase-service';
import { toast } from 'sonner';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onTicketUpdate: (ticket: Ticket) => void;
  currentUser?: User;
}

const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onTicketUpdate,
  currentUser
}) => {
  const [activeTicket, setActiveTicket] = useState<Ticket>(ticket);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local state when ticket prop changes
  React.useEffect(() => {
    setActiveTicket(ticket);
  }, [ticket]);

  const handleChange = (updates: Partial<Ticket>) => {
    setActiveTicket(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onTicketUpdate(activeTicket);
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (content: string) => {
    if (!content.trim() || !currentUser) return;
    
    try {
      const comment = await supabaseService.addComment(
        ticket.id,
        content,
        currentUser.id
      );
      
      if (comment) {
        setActiveTicket(prev => ({
          ...prev,
          comments: [...prev.comments, comment],
          updatedAt: new Date()
        }));
        
        // Also update the parent's state
        onTicketUpdate({
          ...activeTicket,
          comments: [...activeTicket.comments, comment],
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const modalWidth = 'max-w-4xl';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${modalWidth} max-h-[90vh] overflow-hidden flex flex-col p-0`}>
        <DialogHeader className="px-6 py-4 border-b">
          <TicketHeader 
            ticket={activeTicket} 
            onChange={handleChange} 
            onSave={handleSave}
            isSubmitting={isSubmitting}
          />
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="md:w-2/3 p-6 overflow-y-auto">
            <TicketDescription 
              description={activeTicket.description} 
              onChange={(description) => handleChange({ description })} 
            />
            
            <div className="mt-6">
              <TicketComments 
                comments={activeTicket.comments} 
                onAddComment={handleAddComment}
                currentUser={currentUser}
              />
            </div>
          </div>
          
          <div className="md:w-1/3 p-6 bg-muted/30 border-l overflow-y-auto">
            <TicketDetails 
              ticket={activeTicket} 
              onChange={handleChange} 
              projectMembers={activeTicket.project.members}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal;

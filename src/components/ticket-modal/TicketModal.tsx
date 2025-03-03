
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTicket, setEditedTicket] = useState<Ticket>(ticket);

  // Update local state when ticket prop changes
  React.useEffect(() => {
    setActiveTicket(ticket);
    setEditedTicket(ticket);
  }, [ticket]);

  const handleChange = (updates: Partial<Ticket>) => {
    setActiveTicket(prev => ({ ...prev, ...updates }));
  };

  const handleInputChange = (field: keyof Ticket, value: any) => {
    setEditedTicket(prev => ({ ...prev, [field]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset edited ticket to active ticket when canceling edit
      setEditedTicket(activeTicket);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    try {
      await onTicketUpdate(editedTicket);
      setActiveTicket(editedTicket);
      setIsEditing(false);
      toast.success('Ticket updated successfully');
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(activeTicket.createdAt));

  const handleStatusChange = (status: any) => {
    handleInputChange('status', status);
  };

  const handlePriorityChange = (priority: any) => {
    handleInputChange('priority', priority);
  };

  const handleAssigneeChange = (userId: string) => {
    const assignee = userId ? activeTicket.project.members.find(m => m.id === userId) : undefined;
    handleInputChange('assignee', assignee);
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
        
        toast.success('Comment added');
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
        <TicketHeader 
          ticket={activeTicket}
          isEditing={isEditing}
          editedTicket={editedTicket}
          onClose={onClose}
          handleInputChange={handleInputChange}
        />
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="md:w-2/3 p-6 overflow-y-auto">
            <TicketDescription 
              ticket={activeTicket}
              isEditing={isEditing}
              editedTicket={editedTicket}
              isSubmitting={isSubmitting}
              handleEditToggle={handleEditToggle}
              handleSaveChanges={handleSaveChanges}
              handleInputChange={handleInputChange}
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
              formattedDate={formattedDate}
              isEditing={isEditing}
              handleEditToggle={handleEditToggle}
              handleStatusChange={handleStatusChange}
              handlePriorityChange={handlePriorityChange}
              handleAssigneeChange={handleAssigneeChange}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal;

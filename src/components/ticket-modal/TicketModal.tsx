
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Ticket, Priority, Status, User, IssueType } from '@/lib/types';
import { format } from 'date-fns';
import TicketHeader from './TicketHeader';
import TicketDescription from './TicketDescription';
import TicketDetails from './TicketDetails';
import TicketComments from './TicketComments';
import { supabaseService } from '@/lib/supabase-service';
import { toast } from 'sonner';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onTicketUpdate: (ticket: Ticket) => void;
  currentUser: User | null;
  isStandalone?: boolean;
  onTicketDelete?: (ticketId: string) => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ 
  isOpen, 
  onClose, 
  ticket, 
  onTicketUpdate,
  currentUser,
  isStandalone = false,
  onTicketDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTicket, setEditedTicket] = useState<Ticket>(ticket);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    setEditedTicket(ticket);
  }, [ticket]);

  const formattedDate = format(new Date(ticket.createdAt), 'MMM d, yyyy');

  const handleInputChange = (field: keyof Ticket, value: any) => {
    setEditedTicket(prev => ({ ...prev, [field]: value }));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedTicket(ticket);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);
      await onTicketUpdate(editedTicket);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (status: Status) => {
    const updated = { ...editedTicket, status };
    setEditedTicket(updated);
    onTicketUpdate(updated);
  };

  const handlePriorityChange = (priority: Priority) => {
    const updated = { ...editedTicket, priority };
    setEditedTicket(updated);
    onTicketUpdate(updated);
  };

  const handleIssueTypeChange = (issueType: IssueType) => {
    const updated = { ...editedTicket, issueType };
    setEditedTicket(updated);
    onTicketUpdate(updated);
  };

  const handleAssigneeChange = (userId: string) => {
    const assignee = userId 
      ? ticket.project.members.find(member => member.id === userId)
      : undefined;
    
    const updated = { ...editedTicket, assignee };
    setEditedTicket(updated);
    onTicketUpdate(updated);
  };

  const handleAddComment = async (content: string) => {
    if (!currentUser) {
      toast.error('You need to be logged in to add comments');
      return;
    }
    
    try {
      // Add comment to the database using supabaseService
      const newComment = await supabaseService.addComment(ticket.id, content, currentUser.id);
      
      if (!newComment) {
        toast.error('Failed to add comment');
        return;
      }
      
      // Update local state with the new comment
      const updatedTicket = {
        ...ticket,
        comments: [...ticket.comments, newComment]
      };
      
      // Call onTicketUpdate to update the ticket in the parent component
      onTicketUpdate(updatedTicket);
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteTicket = () => {
    if (onTicketDelete) {
      onTicketDelete(ticket.id);
    }
  };

  const renderContent = () => (
    <>
      <TicketHeader 
        ticket={ticket}
        isEditing={isEditing}
        editedTicket={editedTicket}
        onClose={onClose}
        handleInputChange={handleInputChange}
      />
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <TicketDescription 
            ticket={ticket}
            isEditing={isEditing}
            editedTicket={editedTicket}
            isSubmitting={isSubmitting}
            handleEditToggle={handleEditToggle}
            handleSaveChanges={handleSaveChanges}
            handleInputChange={handleInputChange}
          />
          
          <Separator />
          
          {currentUser && (
            <TicketComments 
              comments={ticket.comments}
              onAddComment={handleAddComment}
              currentUser={currentUser}
            />
          )}
        </div>
        
        <TicketDetails 
          ticket={editedTicket}
          formattedDate={formattedDate}
          isEditing={isEditing}
          handleEditToggle={handleEditToggle}
          handleStatusChange={handleStatusChange}
          handlePriorityChange={handlePriorityChange}
          handleIssueTypeChange={handleIssueTypeChange}
          handleAssigneeChange={handleAssigneeChange}
          onTicketDelete={handleDeleteTicket}
        />
      </div>
    </>
  );

  if (isStandalone) {
    return renderContent();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal;

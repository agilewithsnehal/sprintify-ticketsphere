
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { Ticket, Priority, Status, User } from '@/lib/types';
import { toast } from 'sonner';
import TicketHeader from './TicketHeader';
import TicketDescription from './TicketDescription';
import TicketComments from './TicketComments';
import TicketDetails from './TicketDetails';
import { supabaseService } from '@/lib/supabase-service';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onTicketUpdate: (updatedTicket: Ticket) => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, ticket, onTicketUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTicket, setEditedTicket] = useState<Ticket>(ticket);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Update local state when ticket prop changes
  useEffect(() => {
    setEditedTicket(ticket);
  }, [ticket]);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(ticket.createdAt);

  const handleEditToggle = () => {
    if (isEditing) {
      // Discard changes and exit edit mode
      setEditedTicket(ticket);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!editedTicket.summary.trim()) {
      toast.error('Ticket summary cannot be empty');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Update the ticket in the database
      const result = await supabaseService.updateTicket(ticket.id, editedTicket);
      
      if (result) {
        onTicketUpdate(result);
        setIsEditing(false);
        toast.success('Ticket updated successfully');
      } else {
        toast.error('Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('An error occurred while updating the ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof Ticket, value: any) => {
    setEditedTicket(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    try {
      const comment = await supabaseService.addComment(ticket.id, newComment.trim(), currentUser.id);
      
      if (comment) {
        const updatedTicket = {
          ...ticket,
          comments: [...ticket.comments, comment],
          updatedAt: new Date()
        };

        onTicketUpdate(updatedTicket);
        setNewComment('');
        toast.success('Comment added');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('An error occurred while adding the comment');
    }
  };

  const handleStatusChange = async (status: Status) => {
    try {
      const updatedTicket = {
        ...ticket,
        status,
        updatedAt: new Date()
      };
      
      const result = await supabaseService.updateTicket(ticket.id, { status });
      
      if (result) {
        onTicketUpdate(updatedTicket);
        toast.success(`Ticket moved to ${status.replace(/-/g, ' ')}`);
      } else {
        toast.error('Failed to update ticket status');
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('An error occurred while updating the ticket');
    }
  };

  const handlePriorityChange = async (priority: Priority) => {
    try {
      const updatedTicket = {
        ...ticket,
        priority,
        updatedAt: new Date()
      };
      
      const result = await supabaseService.updateTicket(ticket.id, { priority });
      
      if (result) {
        onTicketUpdate(updatedTicket);
        toast.success(`Priority changed to ${priority}`);
      } else {
        toast.error('Failed to update ticket priority');
      }
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      toast.error('An error occurred while updating the ticket');
    }
  };

  const handleAssigneeChange = async (userId: string) => {
    try {
      const assignee = userId 
        ? ticket.project.members.find(member => member.id === userId) 
        : undefined;
        
      const updatedTicket = {
        ...ticket,
        assignee,
        updatedAt: new Date()
      };
      
      const result = await supabaseService.updateTicket(ticket.id, { assignee });
      
      if (result) {
        onTicketUpdate(updatedTicket);
        toast.success(assignee ? `Assigned to ${assignee.name}` : 'Unassigned');
      } else {
        toast.error('Failed to update ticket assignee');
      }
    } catch (error) {
      console.error('Error updating ticket assignee:', error);
      toast.error('An error occurred while updating the ticket');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogDescription className="sr-only">Ticket details</DialogDescription>
        <div className="flex flex-col h-full">
          <TicketHeader 
            ticket={ticket}
            isEditing={isEditing}
            editedTicket={editedTicket}
            onClose={onClose}
            handleInputChange={handleInputChange}
          />
          
          <div className="grid grid-cols-4 gap-6 p-6 overflow-y-auto max-h-[70vh]">
            <div className="col-span-3 space-y-6">
              <TicketDescription 
                ticket={ticket}
                isEditing={isEditing}
                editedTicket={editedTicket}
                isSubmitting={isSubmitting}
                handleEditToggle={handleEditToggle}
                handleSaveChanges={handleSaveChanges}
                handleInputChange={handleInputChange}
              />
              
              <TicketComments 
                ticket={ticket}
                newComment={newComment}
                setNewComment={setNewComment}
                handleCommentSubmit={handleCommentSubmit}
              />
            </div>
            
            <TicketDetails 
              ticket={ticket}
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

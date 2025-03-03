
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { Ticket, Priority, Status } from '@/lib/types';
import { toast } from 'sonner';
import TicketHeader from './TicketHeader';
import TicketDescription from './TicketDescription';
import TicketComments from './TicketComments';
import TicketDetails from './TicketDetails';

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

  const handleSaveChanges = () => {
    if (!editedTicket.summary.trim()) {
      toast.error('Ticket summary cannot be empty');
      return;
    }
    
    setIsSubmitting(true);

    // Update the ticket with a fresh timestamp
    const updatedTicket = {
      ...editedTicket,
      updatedAt: new Date()
    };

    // In a real app, you would make an API call here
    setTimeout(() => {
      onTicketUpdate(updatedTicket);
      setIsEditing(false);
      setIsSubmitting(false);
      toast.success('Ticket updated successfully');
    }, 500); // Simulate API delay
  };

  const handleInputChange = (field: keyof Ticket, value: any) => {
    setEditedTicket(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: `comment-${Date.now()}`,
      author: ticket.project.members[0], // Current user
      content: newComment.trim(),
      createdAt: new Date()
    };

    const updatedTicket = {
      ...ticket,
      comments: [...ticket.comments, comment],
      updatedAt: new Date()
    };

    onTicketUpdate(updatedTicket);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleStatusChange = (status: Status) => {
    const updatedTicket = {
      ...ticket,
      status,
      updatedAt: new Date()
    };
    
    onTicketUpdate(updatedTicket);
    toast.success(`Ticket moved to ${status.replace(/-/g, ' ')}`);
  };

  const handlePriorityChange = (priority: Priority) => {
    const updatedTicket = {
      ...ticket,
      priority,
      updatedAt: new Date()
    };
    
    onTicketUpdate(updatedTicket);
    toast.success(`Priority changed to ${priority}`);
  };

  const handleAssigneeChange = (userId: string) => {
    const assignee = userId 
      ? ticket.project.members.find(member => member.id === userId) 
      : undefined;
      
    const updatedTicket = {
      ...ticket,
      assignee,
      updatedAt: new Date()
    };
    
    onTicketUpdate(updatedTicket);
    toast.success(assignee ? `Assigned to ${assignee.name}` : 'Unassigned');
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

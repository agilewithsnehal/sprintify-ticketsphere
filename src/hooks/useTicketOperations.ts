
import { useState } from 'react';
import { Ticket, Status } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';

// Status progression order for validation
const statusOrder: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];

export const useTicketOperations = (refetch: () => void) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    try {
      console.log(`Moving ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}`);
      
      // First get the ticket we're moving to verify if it has a parent
      const ticketToMove = await supabaseService.ticket.getTicketById(ticketId);
      if (!ticketToMove) {
        toast.error('Failed to find ticket to move');
        return;
      }
      
      // Check if we're moving forward in the workflow
      const sourceStatusIndex = statusOrder.indexOf(sourceColumn);
      const destStatusIndex = statusOrder.indexOf(destinationColumn);
      const isMovingForward = destStatusIndex > sourceStatusIndex;
      
      // Only validate if we're moving a parent ticket (no parentId) forward
      if (isMovingForward && !ticketToMove.parentId) {
        try {
          // Get any child tickets of this ticket
          const childTickets = await supabaseService.ticket.getChildTickets(ticketId);
          
          if (childTickets && childTickets.length > 0) {
            // Check if any child tickets are in an earlier status than our destination
            // This prevents a parent from moving ahead of any of its children
            const childrenBehind = childTickets.filter(child => {
              const childStatusIndex = statusOrder.indexOf(child.status as Status);
              return childStatusIndex < destStatusIndex;
            });
            
            if (childrenBehind.length > 0) {
              const childKeys = childrenBehind.map(t => t.key).join(', ');
              console.error(`Cannot move parent ahead of children: ${childKeys}`);
              toast.error(`Cannot move parent ticket ahead of its children: ${childKeys}`);
              return; // Exit without updating
            }
          }
        } catch (error) {
          console.error('Error validating hierarchy:', error);
          toast.error('Failed to validate ticket hierarchy');
          return;
        }
      }
      
      // Update the ticket status in the database
      const updatedTicket = await supabaseService.updateTicket(ticketId, { 
        status: destinationColumn 
      });
      
      if (!updatedTicket) {
        toast.error('Failed to update ticket status');
        return;
      }
      
      toast.success(`Ticket moved to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // Notify about the ticket movement
      document.dispatchEvent(new CustomEvent('ticket-notification', {
        detail: { 
          type: 'moved',
          ticketKey: ticketToMove.key,
          message: `Ticket ${ticketToMove.key} moved to ${destinationColumn.replace(/-/g, ' ')}`
        }
      }));
      
      // Do NOT trigger a refetch for normal ticket movements
      // This prevents the entire board from refreshing
    } catch (error) {
      console.error('Error moving ticket:', error);
      toast.error('Failed to move ticket');
      // Only refetch on errors to ensure UI is in sync with database
      refetch();
    }
  };

  const handleCreateTicket = async (ticket: Ticket): Promise<boolean> => {
    try {
      console.log('Creating new ticket:', ticket);
      
      if (!ticket.id) {
        console.error('Ticket has no ID:', ticket);
        toast.error('Cannot create ticket: Missing ID');
        return false;
      }
      
      // Create the ticket in the database
      const result = await supabaseService.createTicket(ticket);
      
      if (result) {
        console.log('Ticket created successfully:', result);
        toast.success('Ticket created successfully');
        
        // Notify about the ticket creation with a standard event name and format
        document.dispatchEvent(new CustomEvent('ticket-notification', {
          detail: { 
            type: 'created',
            ticketKey: ticket.key,
            ticketId: result.id,
            message: `Ticket ${ticket.key} created by ${ticket.reporter.name}`
          }
        }));
        
        // Force a refetch to update the board with the new ticket
        setTimeout(() => {
          console.log('Triggering refetch after ticket creation');
          refetch();
        }, 100); // Small delay to ensure database has time to update
        
        return true;
      } else {
        console.error('Failed to create ticket');
        toast.error('Failed to create ticket');
        return false;
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
      return false;
    } finally {
      setIsCreateModalOpen(false);
    }
  };

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleTicketMove,
    handleCreateTicket
  };
};

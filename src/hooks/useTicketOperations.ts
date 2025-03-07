
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
      
      // Special validation for parent tickets moving forward in workflow
      if (isMovingForward && !ticketToMove.parentId) {
        // Check if this ticket has children
        const childTickets = await supabaseService.ticket.getChildTickets(ticketId);
        
        if (childTickets && childTickets.length > 0) {
          // For "done" status
          if (destinationColumn === 'done') {
            // Check if all children are in "done" status
            const pendingChildren = childTickets.filter(child => child.status !== 'done');
            
            if (pendingChildren.length > 0) {
              console.log('Cannot move parent to done, some children are not done:', pendingChildren.map(t => t.key));
              toast.error('All child tickets must be done before moving parent to done');
              refetch();
              return;
            }
            
            console.log('All children are done, parent can be moved to done');
          } else {
            // For other forward moves, no child can be behind
            const destStatusIndexNum = statusOrder.indexOf(destinationColumn);
            
            // Check if any children are in earlier statuses
            const childrenBehind = childTickets.filter(child => {
              const childStatusIndex = statusOrder.indexOf(child.status as Status);
              return childStatusIndex < destStatusIndexNum;
            });
            
            if (childrenBehind.length > 0) {
              console.log('Cannot move parent ahead of children:', childrenBehind.map(t => t.key));
              toast.error('Cannot move parent ticket ahead of its children');
              refetch();
              return;
            }
          }
        }
      }
      
      // Update the ticket status in the database
      // The parent updates will be handled automatically in the ticket-update.ts
      const updatedTicket = await supabaseService.updateTicket(ticketId, { 
        status: destinationColumn 
      });
      
      if (!updatedTicket) {
        toast.error('Failed to update ticket status');
        refetch();
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
      
      // Trigger a refetch to update the UI
      setTimeout(() => {
        refetch();
      }, 500);
    } catch (error) {
      console.error('Error moving ticket:', error);
      toast.error('Failed to move ticket');
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

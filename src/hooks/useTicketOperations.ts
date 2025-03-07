
import { useState } from 'react';
import { Ticket, Status } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';

export const useTicketOperations = (refetch: () => void) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent = true) => {
    try {
      console.log(`Moving ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}, updateParent: ${updateParent}`);
      
      // First get the ticket we're moving to verify if it has a parent
      const ticketToMove = await supabaseService.ticket.getTicketById(ticketId);
      if (!ticketToMove) {
        toast.error('Failed to find ticket to move');
        return;
      }
      
      // Special validation: if moving a parent ticket to "done"
      if (destinationColumn === 'done' && !ticketToMove.parentId) {
        // Check if this ticket has children
        const childTickets = await supabaseService.ticket.getChildTickets(ticketId);
        
        if (childTickets && childTickets.length > 0) {
          // Check if all children are in "done" status
          const pendingChildren = childTickets.filter(child => child.status !== 'done');
          
          if (pendingChildren.length > 0) {
            console.log('Cannot move parent to done, some children are not done:', pendingChildren.map(t => t.key));
            toast.error('All child tickets must be done before moving parent to done');
            refetch();
            return;
          }
          
          console.log('All children are done, parent can be moved to done');
        }
      }
      
      // Update the moved ticket status in the database
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
      
      // If this ticket has a parent ID and updateParent is true, update the parent ticket
      if (ticketToMove.parentId && updateParent) {
        console.log(`Ticket has parent ID: ${ticketToMove.parentId}, updating parent`);
        
        try {
          // Fetch the parent ticket details
          const parentTicket = await supabaseService.ticket.getTicketById(ticketToMove.parentId);
          
          if (!parentTicket) {
            console.error(`Parent ticket with ID ${ticketToMove.parentId} not found`);
            toast.error('Could not find parent ticket');
            refetch();
            return;
          }
          
          console.log(`Parent ticket found: ${parentTicket.id}, current status: ${parentTicket.status}`);
          
          // For parent tickets, we have special rules:
          // 1. They can only move to "done" when all children are done
          // 2. For all other statuses, they should follow their children
          if (destinationColumn === 'done') {
            // If moving to "done", we need to verify all children are also done
            const allChildTickets = await supabaseService.ticket.getChildTickets(parentTicket.id);
            const nonDoneChildren = allChildTickets.filter(child => child.status !== 'done');
            
            if (nonDoneChildren.length > 0) {
              console.log('Not updating parent to done yet as some children are still not done');
              refetch();
              return;
            }
          }
          
          // The critical fix: Always update parent status to match the child's status
          // Only skip if moving to "done" and not all children are done (handled above)
          console.log(`Updating parent ticket ${parentTicket.id} status from ${parentTicket.status} to ${destinationColumn}`);
          
          const updatedParent = await supabaseService.updateTicket(parentTicket.id, {
            status: destinationColumn
          });
          
          if (updatedParent) {
            console.log(`Successfully updated parent ticket status to ${destinationColumn}`);
            toast.success(`Parent ticket updated to ${destinationColumn.replace(/-/g, ' ')}`, {
              id: 'parent-update-success'
            });
            
            // Force an immediate local UI update for the parent ticket
            // This ensures the UI updates without needing a refetch
            document.dispatchEvent(new CustomEvent('ticket-parent-updated', {
              detail: { parentId: parentTicket.id, newStatus: destinationColumn }
            }));
            
            // Notify about the parent ticket movement
            document.dispatchEvent(new CustomEvent('ticket-notification', {
              detail: { 
                type: 'moved',
                ticketKey: parentTicket.key,
                message: `Parent ticket ${parentTicket.key} moved to ${destinationColumn.replace(/-/g, ' ')}`
              }
            }));
          } else {
            console.error('Failed to update parent ticket status');
            toast.error('Failed to update parent ticket', {
              id: 'parent-update-error'
            });
          }
        } catch (parentError) {
          console.error('Error handling parent ticket update:', parentError);
          toast.error('Error updating parent ticket');
        }
      } else if (ticketToMove.parentId) {
        console.log(`Ticket has parent but updateParent is false, skipping parent update`);
      }
    } catch (error) {
      console.error('Error moving ticket:', error);
      toast.error('Failed to move ticket');
    } finally {
      // Always refetch to ensure UI reflects current state
      refetch();
    }
  };

  const handleCreateTicket = async (ticket: Ticket) => {
    try {
      console.log('Creating new ticket:', ticket);
      
      if (!ticket.id) {
        console.error('Ticket has no ID:', ticket);
        toast.error('Cannot create ticket: Missing ID');
        return false;
      }
      
      const result = await supabaseService.createTicket(ticket);
      if (result) {
        console.log('Ticket created successfully:', result);
        toast.success('Ticket created successfully');
        
        // Notify about the ticket creation
        document.dispatchEvent(new CustomEvent('ticket-notification', {
          detail: { 
            type: 'created',
            ticketKey: ticket.key,
            message: `Ticket ${ticket.key} created by ${ticket.reporter.name}`
          }
        }));
        
        refetch();
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

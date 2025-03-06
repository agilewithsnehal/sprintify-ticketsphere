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
      
      // Always update parent regardless of updateParent parameter
      // This ensures parent tickets always move with their children
      if (ticketToMove.parentId) {
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
          
          // Update parent ticket status to match the child's new status
          console.log(`Updating parent ticket ${parentTicket.id} status from ${parentTicket.status} to ${destinationColumn}`);
          
          const updatedParent = await supabaseService.updateTicket(parentTicket.id, {
            status: destinationColumn
          });
          
          if (updatedParent) {
            console.log(`Successfully updated parent ticket status to ${destinationColumn}`);
            toast.success(`Parent ticket updated to ${destinationColumn.replace(/-/g, ' ')}`, {
              id: 'parent-update-success'
            });
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

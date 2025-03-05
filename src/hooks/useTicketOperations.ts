
import { useState } from 'react';
import { Ticket, Status } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';

export const useTicketOperations = (refetch: () => void) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent = true) => {
    try {
      console.log(`Moving ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}, updateParent: ${updateParent}`);
      
      // Find the ticket that's being moved
      let foundTicket = null;
      // This would typically need the board data, but we'll rely on the supabaseService
      // to fetch the ticket directly from the database
      
      // First, update the moved ticket status in the database
      const updatedTicket = await supabaseService.updateTicket(ticketId, { 
        status: destinationColumn 
      });
      
      if (!updatedTicket) {
        toast.error('Failed to update ticket status');
        refetch();
        return;
      }
      
      toast.success(`Ticket moved to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // Handle parent-child relationships if needed
      if (updateParent && updatedTicket.parentId) {
        // We'll need to fetch parent and child tickets from the database
        const parentTicket = await supabaseService.ticket.getTicketById(updatedTicket.parentId);
        
        if (parentTicket) {
          const childTickets = await supabaseService.getChildTickets(parentTicket.id);
          
          // Parent behavior depends on where the child was moved
          if (destinationColumn === 'done' && parentTicket.status !== 'done') {
            // When child moves to done, check if all siblings are done
            const allSiblingsDone = childTickets.every(t => 
              t.id === ticketId || t.status === 'done'
            );
            
            if (allSiblingsDone) {
              console.log(`All child tickets are done, moving parent ticket ${parentTicket.id} to done`);
              
              await supabaseService.updateTicket(parentTicket.id, {
                status: 'done'
              });
              
              toast.success('Parent ticket automatically moved to Done');
            } else {
              console.log('Not all sibling tickets are done, parent remains in current status');
            }
          } 
          // If parent is in a more advanced stage than child, move parent back
          else if (
            (parentTicket.status === 'done' && destinationColumn !== 'done') || 
            (parentTicket.status === 'review' && ['todo', 'backlog', 'in-progress'].includes(destinationColumn)) ||
            (parentTicket.status === 'in-progress' && ['todo', 'backlog'].includes(destinationColumn))
          ) {
            console.log(`Child ticket moved to earlier stage, updating parent ticket ${parentTicket.id} to ${destinationColumn}`);
            
            await supabaseService.updateTicket(parentTicket.id, {
              status: destinationColumn
            });
            
            toast.info(`Parent ticket moved to ${destinationColumn.replace(/-/g, ' ')} to match child status`);
          }
        }
      }
      
      // Refresh the board to reflect the changes
      refetch();
    } catch (error) {
      console.error('Error moving ticket:', error);
      toast.error('Failed to move ticket');
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

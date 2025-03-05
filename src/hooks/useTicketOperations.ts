
import { useState } from 'react';
import { Ticket, Status } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';

export const useTicketOperations = (refetch: () => void) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent = true) => {
    try {
      console.log(`Moving ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}, updateParent: ${updateParent}`);
      
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
        console.log(`Ticket has parent ID: ${updatedTicket.parentId}, attempting to update parent`);
        
        try {
          // Fetch the parent ticket details with appropriate error handling
          const parentTicket = await supabaseService.ticket.getTicketById(updatedTicket.parentId);
          
          if (!parentTicket) {
            console.error(`Parent ticket with ID ${updatedTicket.parentId} not found`);
            toast.error('Could not find parent ticket');
            refetch(); // Still refetch to update UI
            return;
          }
          
          console.log(`Parent ticket found: ${parentTicket.id}, current status: ${parentTicket.status}`);
          
          // We'll need to fetch all child tickets to make decisions
          const childTickets = await supabaseService.getChildTickets(parentTicket.id);
          console.log(`Found ${childTickets.length} child tickets for parent ${parentTicket.id}`);
          
          let shouldUpdateParent = false;
          let newParentStatus = parentTicket.status;
          
          // Parent behavior depends on where the child was moved
          if (destinationColumn === 'done' && parentTicket.status !== 'done') {
            // When child moves to done, check if all siblings are done
            const allSiblingsDone = childTickets.every(t => t.status === 'done');
            
            if (allSiblingsDone) {
              console.log(`All child tickets are done, moving parent ticket ${parentTicket.id} to done`);
              shouldUpdateParent = true;
              newParentStatus = 'done';
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
            shouldUpdateParent = true;
            newParentStatus = destinationColumn;
          }
          
          if (shouldUpdateParent) {
            console.log(`Updating parent ticket ${parentTicket.id} status from ${parentTicket.status} to ${newParentStatus}`);
            
            const updatedParent = await supabaseService.updateTicket(parentTicket.id, {
              status: newParentStatus
            });
            
            if (updatedParent) {
              if (newParentStatus === 'done') {
                toast.success('Parent ticket automatically moved to Done');
              } else {
                toast.info(`Parent ticket moved to ${newParentStatus.replace(/-/g, ' ')} to match child status`);
              }
            } else {
              console.error('Failed to update parent ticket status');
              toast.error('Failed to update parent ticket');
            }
            
            // Important! Refetch data to ensure UI is updated with parent ticket changes
            refetch();
          } else {
            console.log(`No need to update parent ticket status from ${parentTicket.status} to ${destinationColumn}`);
          }
        } catch (parentError) {
          console.error('Error handling parent ticket update:', parentError);
          toast.error('Error updating parent ticket');
          refetch(); // Still refetch to update UI
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

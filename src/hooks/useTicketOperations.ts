
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
      
      // Handle parent-child relationships if needed
      if (updateParent && ticketToMove.parentId) {
        console.log(`Ticket has parent ID: ${ticketToMove.parentId}, attempting to update parent`);
        
        try {
          // Fetch the parent ticket details with appropriate error handling
          const parentTicket = await supabaseService.ticket.getTicketById(ticketToMove.parentId);
          
          if (!parentTicket) {
            console.error(`Parent ticket with ID ${ticketToMove.parentId} not found`);
            toast.error('Could not find parent ticket');
            refetch(); // Still refetch to update UI
            return;
          }
          
          console.log(`Parent ticket found: ${parentTicket.id}, current status: ${parentTicket.status}`);
          
          // We'll need to fetch all child tickets to make decisions
          const childTickets = await supabaseService.getChildTickets(parentTicket.id);
          console.log(`Found ${childTickets.length} child tickets for parent ${parentTicket.id}`);
          
          // Determine if we should update the parent based on child ticket movement
          let shouldUpdateParent = false;
          let newParentStatus = destinationColumn; // Default to moving parent to same status as child
          
          // Status order for progression comparison
          const statusOrder = ['backlog', 'todo', 'in-progress', 'review', 'done'] as const;
          
          // Logic for determining parent status
          if (destinationColumn === 'done') {
            // Only move parent to done if ALL children are done
            const allChildrenDone = childTickets.every(t => t.status === 'done');
            shouldUpdateParent = allChildrenDone;
            
            if (allChildrenDone) {
              console.log('All children are done, will move parent to done as well');
              toast.success('All subtasks completed - parent ticket marked as Done');
            } else {
              console.log('Not all children are done, not moving parent to done');
              shouldUpdateParent = false;
            }
          } else if (destinationColumn === 'in-progress' || destinationColumn === 'review') {
            // For in-progress or review, move parent to match if parent is in an earlier stage
            const parentStatusIndex = statusOrder.indexOf(parentTicket.status as Status);
            const childStatusIndex = statusOrder.indexOf(destinationColumn);
            
            // If child moved forward and is now ahead of parent
            if (childStatusIndex > parentStatusIndex) {
              console.log(`Child moved to more advanced status than parent, updating parent from ${parentTicket.status} to ${destinationColumn}`);
              shouldUpdateParent = true;
              toast.info(`Parent ticket automatically moved to ${destinationColumn.replace(/-/g, ' ')}`);
            }
          } else if (destinationColumn === 'todo' || destinationColumn === 'backlog') {
            // If child moved back to todo or backlog and parent is in a later stage
            // Check if parent should move back based on all children's status
            
            // Don't move parent back if any child is still in a later stage
            const childStatusIndex = statusOrder.indexOf(destinationColumn);
            
            // Check if any child is in a later stage than the destination
            const anyChildInLaterStage = childTickets.some(child => {
              const childStageIndex = statusOrder.indexOf(child.status as Status);
              return childStageIndex > childStatusIndex && child.id !== ticketId;
            });
            
            if (!anyChildInLaterStage) {
              console.log(`No other children in later stages, moving parent back to ${destinationColumn}`);
              shouldUpdateParent = true;
              toast.info(`Parent ticket moved back to ${destinationColumn.replace(/-/g, ' ')}`);
            } else {
              console.log('Other children still in later stages, not moving parent back');
              shouldUpdateParent = false;
            }
          }
          
          if (shouldUpdateParent) {
            console.log(`Updating parent ticket ${parentTicket.id} status from ${parentTicket.status} to ${newParentStatus}`);
            
            const updatedParent = await supabaseService.updateTicket(parentTicket.id, {
              status: newParentStatus
            });
            
            if (updatedParent) {
              console.log(`Successfully updated parent ticket status to ${newParentStatus}`);
            } else {
              console.error('Failed to update parent ticket status');
              toast.error('Failed to update parent ticket');
            }
          } else {
            console.log(`No need to update parent ticket status from ${parentTicket.status} to ${destinationColumn}`);
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

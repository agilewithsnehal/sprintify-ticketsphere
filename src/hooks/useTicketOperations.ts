
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
      
      // Handle parent-child relationships if updateParent flag is true and ticket has a parent
      if (updateParent && ticketToMove.parentId) {
        console.log(`Ticket has parent ID: ${ticketToMove.parentId}, attempting to update parent`);
        
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
          
          // Fetch all child tickets to make decisions
          const childTickets = await supabaseService.getChildTickets(parentTicket.id);
          console.log(`Found ${childTickets.length} child tickets for parent ${parentTicket.id}`);
          
          // Determine if we should update the parent based on child ticket movement
          let shouldUpdateParent = false;
          let newParentStatus = destinationColumn;
          
          // Status order for progression comparison (left = earlier, right = later)
          const statusOrder = ['backlog', 'todo', 'in-progress', 'review', 'done'];
          
          // Logic for determining parent status
          if (destinationColumn === 'done') {
            // Only move parent to done if ALL children are done
            const allChildrenDone = childTickets.every(t => t.status === 'done');
            shouldUpdateParent = allChildrenDone;
            
            if (allChildrenDone) {
              console.log('All children are done, moving parent to done as well');
              toast.success('All subtasks completed - parent ticket marked as Done', {
                id: 'parent-update-done'
              });
            } else {
              console.log('Not all children are done, parent remains in current status');
              shouldUpdateParent = false;
            }
          } else if (destinationColumn === 'in-progress' || destinationColumn === 'review') {
            // For in-progress or review, always move parent to match if it's in an earlier stage
            const parentStatusIndex = statusOrder.indexOf(parentTicket.status);
            const childStatusIndex = statusOrder.indexOf(destinationColumn);
            
            // If child moved forward and is now ahead of parent, update parent
            if (childStatusIndex > parentStatusIndex) {
              console.log(`Child moved to more advanced status (${destinationColumn}) than parent (${parentTicket.status}), updating parent`);
              shouldUpdateParent = true;
              toast.info(`Parent ticket automatically moved to ${destinationColumn.replace(/-/g, ' ')}`, {
                id: 'parent-status-advance'
              });
            } else {
              console.log(`Child status (${destinationColumn}) not more advanced than parent (${parentTicket.status}), no parent update needed`);
            }
          } else if (destinationColumn === 'todo' || destinationColumn === 'backlog') {
            // If all children moved back, move parent back too
            const anyChildInLaterStage = childTickets.some(child => {
              if (child.id === ticketId) return false; // Exclude the current ticket we're moving
              const childStageIndex = statusOrder.indexOf(child.status);
              const destinationIndex = statusOrder.indexOf(destinationColumn);
              return childStageIndex > destinationIndex;
            });
            
            if (!anyChildInLaterStage) {
              console.log('No children in later stages, moving parent back too');
              shouldUpdateParent = true;
              newParentStatus = destinationColumn;
              toast.info(`Parent ticket moved back to ${destinationColumn.replace(/-/g, ' ')}`, {
                id: 'parent-status-regress'
              });
            } else {
              console.log('Some children still in later stages, not moving parent back');
            }
          }
          
          if (shouldUpdateParent) {
            console.log(`Updating parent ticket ${parentTicket.id} status from ${parentTicket.status} to ${newParentStatus}`);
            
            const updatedParent = await supabaseService.updateTicket(parentTicket.id, {
              status: newParentStatus
            });
            
            if (updatedParent) {
              console.log(`Successfully updated parent ticket status to ${newParentStatus}`);
              toast.success(`Parent ticket updated to ${newParentStatus.replace(/-/g, ' ')}`, {
                id: 'parent-update-success'
              });
            } else {
              console.error('Failed to update parent ticket status');
              toast.error('Failed to update parent ticket', {
                id: 'parent-update-error'
              });
            }
          } else {
            console.log(`No need to update parent ticket status from ${parentTicket.status}`);
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

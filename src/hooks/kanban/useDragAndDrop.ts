
import { useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { Status, Ticket as TicketType } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';

export function useDragAndDrop(
  columns: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>,
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent?: boolean) => void
) {
  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      console.log('No destination, dropping operation cancelled');
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      console.log('Dropped in same position, no action needed');
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      console.error('Source or destination column not found');
      toast.error('Error: Column not found');
      return;
    }

    const sourceTickets = [...sourceColumn.tickets];
    const destTickets = source.droppableId === destination.droppableId 
      ? sourceTickets 
      : [...destColumn.tickets];

    // Find the ticket we're moving
    const movedTicket = sourceTickets.find(t => t.id === draggableId);
    if (!movedTicket) {
      toast.error("Ticket not found");
      return;
    }

    // Special validation for parent tickets moving to "done"
    if (destination.droppableId === 'done' && !movedTicket.parentId) {
      try {
        const childTickets = await supabaseService.ticket.getChildTickets(draggableId);
        
        if (childTickets && childTickets.length > 0) {
          const pendingChildren = childTickets.filter(child => child.status !== 'done');
          
          if (pendingChildren.length > 0) {
            console.error('Cannot move parent to done: Some children are not done');
            toast.error('All child tickets must be done before moving parent to done');
            return; // Prevent the move entirely
          }
        }
      } catch (error) {
        console.error('Error checking child tickets:', error);
        toast.error('Error checking child tickets');
        return;
      }
    }

    // Remove from source column
    const newSourceTickets = sourceTickets.filter(t => t.id !== draggableId);

    // Create the updated ticket with new status
    const updatedTicket = { 
      ...movedTicket,
      status: destination.droppableId as Status,
      updatedAt: new Date()
    };

    // Add to destination column
    destTickets.splice(destination.index, 0, updatedTicket);

    // Update local state first for immediate UI response
    setColumns(prevColumns => prevColumns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, tickets: newSourceTickets };
      }
      if (col.id === destination.droppableId) {
        return { ...col, tickets: destTickets };
      }
      return col;
    }));

    // Only update the database if the column changed
    if (source.droppableId !== destination.droppableId) {
      try {
        console.log(`Drag ended: Moving ticket ${draggableId} from ${source.droppableId} to ${destination.droppableId}`);
        
        // Call the callback ensuring the updateParent flag is explicitly set to true
        if (onTicketMove) {
          // Always force updateParent to true to ensure parent tickets get updated
          onTicketMove(
            draggableId,
            source.droppableId as Status,
            destination.droppableId as Status,
            true // Always force parent update to true
          );
        } else {
          console.warn('onTicketMove callback is not provided');
          
          // Fallback to direct database update if no callback is provided
          const ticket = await supabaseService.ticket.getTicketById(draggableId);
          
          if (!ticket) {
            toast.error("Could not find ticket details");
            return;
          }
          
          // Special validation for "done" status if this is a parent ticket
          if (destination.droppableId === 'done' && !ticket.parentId) {
            // Check if this ticket has children
            const childTickets = await supabaseService.ticket.getChildTickets(ticket.id);
            
            if (childTickets && childTickets.length > 0) {
              // Check if all children are in "done" status
              const pendingChildren = childTickets.filter(child => child.status !== 'done');
              
              if (pendingChildren.length > 0) {
                console.log('Cannot move parent to done, some children are not done:', 
                  pendingChildren.map(t => t.key).join(', '));
                
                toast.error('All child tickets must be done before moving parent to done');
                
                // Revert the UI state since we're aborting the operation
                setColumns(prevColumns => [...prevColumns]);
                return;
              }
              
              console.log('All children are done, parent can be moved to done');
            }
          }
          
          // First update the moved ticket
          const updatedInDb = await supabaseService.updateTicket(draggableId, {
            status: destination.droppableId as Status
          });
          
          if (!updatedInDb) {
            toast.error("Failed to save ticket status change");
            // Revert the UI if the database update failed
            setColumns(prevColumns => [...prevColumns]);
            return;
          }
          
          // Check if this ticket has a parent and update the parent if it does
          if (ticket.parentId) {
            console.log(`Ticket has parent ID: ${ticket.parentId}, updating parent status`);
            const parentTicket = await supabaseService.ticket.getTicketById(ticket.parentId);
            
            if (parentTicket) {
              // Special case for "done" status - need to check all children
              if (destination.droppableId === 'done') {
                const allChildTickets = await supabaseService.ticket.getChildTickets(parentTicket.id);
                const nonDoneChildren = allChildTickets.filter(child => child.status !== 'done');
                
                if (nonDoneChildren.length > 0) {
                  console.log('Not updating parent to done yet as some children are still not done');
                  toast.success(`Ticket moved to ${destination.droppableId.replace(/-/g, ' ')}`);
                  return;
                }
              }
              
              // Only update if the parent status is different from destination
              if (parentTicket.status !== destination.droppableId) {
                const updatedParent = await supabaseService.updateTicket(parentTicket.id, {
                  status: destination.droppableId as Status
                });
                
                if (updatedParent) {
                  toast.success(`Parent ticket moved to ${destination.droppableId.replace(/-/g, ' ')}`);
                } else {
                  toast.error("Failed to update parent ticket");
                }
              } else {
                console.log(`Parent already in ${destination.droppableId} status, no update needed`);
              }
            }
          }
          
          toast.success(`Ticket moved to ${destination.droppableId.replace(/-/g, ' ')}`);
        }
      } catch (error) {
        console.error('Error updating ticket status:', error);
        toast.error("Failed to save ticket status change");
        // Revert the UI if the database update failed
        setColumns(prevColumns => [...prevColumns]);
      }
    }
  }, [columns, onTicketMove, setColumns]);

  return { onDragEnd };
}

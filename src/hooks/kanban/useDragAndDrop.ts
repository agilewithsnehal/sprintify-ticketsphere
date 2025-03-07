
import { useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { Status, Ticket as TicketType, IssueType } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';

// Status progression order
const statusOrder: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];

export function useDragAndDrop(
  columns: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>,
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void
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

    // Get the index of the source and destination status in our ordered array
    const sourceStatusIndex = statusOrder.indexOf(source.droppableId as Status);
    const destStatusIndex = statusOrder.indexOf(destination.droppableId as Status);
    
    // Check if we're moving forward in the workflow
    const isMovingForward = destStatusIndex > sourceStatusIndex;

    // Special validation for parent tickets
    if (isMovingForward && !movedTicket.parentId) {
      try {
        const childTickets = await supabaseService.ticket.getChildTickets(draggableId);
        
        if (childTickets && childTickets.length > 0) {
          // If moving to "done", all children must be done
          if (destination.droppableId === 'done') {
            const pendingChildren = childTickets.filter(child => child.status !== 'done');
            
            if (pendingChildren.length > 0) {
              console.error('Cannot move parent to done: Some children are not done');
              toast.error('All child tickets must be done before moving parent to done');
              return; // Prevent the move entirely
            }
          } else {
            // For other statuses, no child can be behind the parent
            const destStatusIndexNum = statusOrder.indexOf(destination.droppableId as Status);
            
            // Check if any children are in earlier statuses than the destination
            const childrenBehind = childTickets.filter(child => {
              const childStatusIndex = statusOrder.indexOf(child.status as Status);
              return childStatusIndex < destStatusIndexNum;
            });
            
            if (childrenBehind.length > 0) {
              console.error('Cannot move parent ahead of children');
              toast.error('Cannot move parent ticket ahead of its children. All children must be at least in the same status.');
              return; // Prevent the move
            }
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
        
        // Call the callback to update the database
        if (onTicketMove) {
          // Call onTicketMove with just the three needed parameters
          onTicketMove(
            draggableId,
            source.droppableId as Status,
            destination.droppableId as Status
          );
        } else {
          console.warn('onTicketMove callback is not provided');
          
          // Fallback to direct database update if no callback is provided
          const ticket = await supabaseService.ticket.getTicketById(draggableId);
          
          if (!ticket) {
            toast.error("Could not find ticket details");
            return;
          }
          
          // Special validation for moving forward in workflow
          if (isMovingForward && !ticket.parentId) {
            // Check if this ticket has children
            const childTickets = await supabaseService.ticket.getChildTickets(ticket.id);
            
            if (childTickets && childTickets.length > 0) {
              // For "done" status
              if (destination.droppableId === 'done') {
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
              } else {
                // For other forward moves, no child can be behind
                const destStatusIndexNum = statusOrder.indexOf(destination.droppableId as Status);
                
                // Check if any children are in earlier statuses
                const childrenBehind = childTickets.filter(child => {
                  const childStatusIndex = statusOrder.indexOf(child.status as Status);
                  return childStatusIndex < destStatusIndexNum;
                });
                
                if (childrenBehind.length > 0) {
                  console.error('Cannot move parent ahead of children');
                  toast.error('Cannot move parent ticket ahead of its children');
                  
                  // Revert the UI state
                  setColumns(prevColumns => [...prevColumns]);
                  return;
                }
              }
            }
          }
          
          // Update the moved ticket in the database
          // Parent updates will happen automatically in the updateTicket function
          const updatedInDb = await supabaseService.updateTicket(draggableId, {
            status: destination.droppableId as Status
          });
          
          if (!updatedInDb) {
            toast.error("Failed to save ticket status change");
            // Revert the UI if the database update failed
            setColumns(prevColumns => [...prevColumns]);
            return;
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

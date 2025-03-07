
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

    // If moving a parent ticket forward in the workflow, validate against child tickets
    if (isMovingForward && !movedTicket.parentId) {
      try {
        // Fetch child tickets to verify if move is allowed
        const childTickets = await supabaseService.ticket.getChildTickets(draggableId);
        
        if (childTickets && childTickets.length > 0) {
          // For "done" status, all children must be done
          if (destination.droppableId === 'done') {
            const pendingChildren = childTickets.filter(child => child.status !== 'done');
            
            if (pendingChildren.length > 0) {
              console.error('Cannot move parent to done: Children not done');
              toast.error('All child tickets must be done before moving parent to done');
              return; // Exit without updating
            }
          }
          
          // For any forward move, no child can be behind the new status
          const childrenBehind = childTickets.filter(child => {
            const childStatusIndex = statusOrder.indexOf(child.status as Status);
            return childStatusIndex < destStatusIndex;
          });
          
          if (childrenBehind.length > 0) {
            console.error('Cannot move parent ahead of children:', childrenBehind.map(t => `${t.key} (${t.status})`));
            toast.error('Cannot move parent ticket ahead of its children');
            return; // Exit without updating
          }
        } else {
          console.log('No child tickets found for parent ticket:', draggableId);
        }
      } catch (error) {
        console.error('Error validating child tickets:', error);
        toast.error('Failed to validate child tickets');
        return;
      }
    }

    // Remove from source column
    const newSourceTickets = sourceTickets.filter(t => t.id !== draggableId);

    // Create the updated ticket with new status
    const updatedTicket = { 
      ...movedTicket,
      status: destination.droppableId as Status,
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
        }
      } catch (error) {
        console.error('Error updating ticket status:', error);
        toast.error("Failed to save ticket status change");
        
        // Revert the UI if there was an error
        setColumns(prevColumns => [...prevColumns]);
      }
    }
  }, [columns, onTicketMove, setColumns]);

  return { onDragEnd };
}

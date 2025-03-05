
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
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
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

    // Remove from source column
    const newSourceTickets = sourceTickets.filter(t => t.id !== draggableId);

    // Check if we're moving to "done" status and this is a parent ticket (has children)
    if (destination.droppableId === 'done') {
      // Find all child tickets across all columns
      const childTickets: TicketType[] = [];
      columns.forEach(col => {
        col.tickets.forEach((ticket: TicketType) => {
          if (ticket.parentId === movedTicket.id) {
            childTickets.push(ticket);
          }
        });
      });

      // If there are children and any of them are not done, prevent the move
      if (childTickets.length > 0) {
        const allChildrenDone = childTickets.every((ticket: TicketType) => ticket.status === 'done');
        
        if (!allChildrenDone) {
          toast.error("Cannot move to Done: All child tickets must be completed first");
          return;
        }
      }
    }
    
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

    if (source.droppableId !== destination.droppableId) {
      try {
        // Persist the change to the database directly
        const updatedInDb = await supabaseService.updateTicket(draggableId, {
          status: destination.droppableId as Status
        });
        
        if (!updatedInDb) {
          toast.error("Failed to save ticket status change");
          // Revert the UI if the database update failed
          setColumns(prevColumns => [...prevColumns]);
          return;
        }
        
        // Now handle parent-child relationships via the callback
        if (onTicketMove) {
          onTicketMove(
            draggableId,
            source.droppableId as Status,
            destination.droppableId as Status,
            true // Always pass true to update parent ticket status
          );
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

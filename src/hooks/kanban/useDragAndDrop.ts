
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

    const [movedTicket] = sourceTickets.splice(source.index, 1);

    // Check if we're moving to "done" status and this is a parent ticket
    if (destination.droppableId === 'done' && movedTicket) {
      // Find child tickets across all columns
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

    destTickets.splice(destination.index, 0, updatedTicket);

    // Update local state first for immediate UI response
    setColumns(prevColumns => prevColumns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, tickets: sourceTickets };
      }
      if (col.id === destination.droppableId) {
        return { ...col, tickets: destTickets };
      }
      return col;
    }));

    if (source.droppableId !== destination.droppableId) {
      // If the status changed, call the onTicketMove callback
      if (onTicketMove) {
        onTicketMove(
          draggableId,
          source.droppableId as Status,
          destination.droppableId as Status,
          true // Always pass true to update parent ticket status
        );
      }
    }
  }, [columns, onTicketMove]);

  return { onDragEnd };
}


import React, { useEffect } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Board, Status } from '@/lib/types';
import { toast } from 'sonner';

interface KanbanBoardWrapperProps {
  board: Board;
  onTicketMove: (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent?: boolean) => void;
  onRefresh?: () => void;
}

const KanbanBoardWrapper: React.FC<KanbanBoardWrapperProps> = ({ board, onTicketMove, onRefresh }) => {
  useEffect(() => {
    if (board && board.columns) {
      console.log('KanbanBoardWrapper: Rendering board with columns:', 
        board.columns.map(c => `${c.title} (${c.tickets.length})`).join(', '));
      
      // Calculate total tickets for debugging
      const totalTickets = board.columns.reduce((sum, col) => sum + col.tickets.length, 0);
      console.log(`KanbanBoardWrapper: Total tickets on board: ${totalTickets}`);
    }
  }, [board]);

  // Add an effect to listen for ticket creation events
  useEffect(() => {
    const handleTicketEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('KanbanBoardWrapper: Detected ticket event:', customEvent.detail);
      
      // If we have a refresh callback, call it when a ticket is created or moved
      if ((customEvent.detail?.type === 'created' || customEvent.detail?.type === 'moved') && onRefresh) {
        console.log('KanbanBoardWrapper: Triggering refresh after ticket event');
        // Add a small delay to ensure database has updated
        setTimeout(() => onRefresh(), 100);
      }
    };
    
    document.addEventListener('ticket-notification', handleTicketEvent);
    
    return () => {
      document.removeEventListener('ticket-notification', handleTicketEvent);
    };
  }, [onRefresh]);

  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent = true) => {
    console.log(`KanbanBoardWrapper: Handling ticket move ${ticketId} from ${sourceColumn} to ${destinationColumn}, updateParent: ${updateParent}`);
    
    try {
      // Show immediate feedback to the user
      toast.info(`Moving ticket from ${sourceColumn.replace(/-/g, ' ')} to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // Always set updateParent to true to ensure parent tickets follow their children
      onTicketMove(ticketId, sourceColumn, destinationColumn, true);
      
      // If we have a refresh callback, call it after moving the ticket
      if (onRefresh) {
        console.log('KanbanBoardWrapper: Triggering refresh after ticket move');
        setTimeout(() => onRefresh(), 100);
      }
    } catch (error) {
      console.error('Error in handleTicketMove:', error);
      toast.error('Failed to move ticket');
    }
  };

  return <KanbanBoard board={board} onTicketMove={handleTicketMove} onRefresh={onRefresh} />;
};

export default KanbanBoardWrapper;

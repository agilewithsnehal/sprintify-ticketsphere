
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
    }
  }, [board]);

  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent = true) => {
    console.log(`KanbanBoardWrapper: Handling ticket move ${ticketId} from ${sourceColumn} to ${destinationColumn}, updateParent: ${updateParent}`);
    
    try {
      // Show immediate feedback to the user
      toast.info(`Moving ticket from ${sourceColumn.replace(/-/g, ' ')} to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // Always set updateParent to true to ensure parent tickets follow their children
      onTicketMove(ticketId, sourceColumn, destinationColumn, true);
    } catch (error) {
      console.error('Error in handleTicketMove:', error);
      toast.error('Failed to move ticket');
    }
  };

  return <KanbanBoard board={board} onTicketMove={handleTicketMove} onRefresh={onRefresh} />;
};

export default KanbanBoardWrapper;

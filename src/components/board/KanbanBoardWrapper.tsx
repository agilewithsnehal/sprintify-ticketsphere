
import React, { useEffect } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Board, Status } from '@/lib/types';
import { toast } from 'sonner';

interface KanbanBoardWrapperProps {
  board: Board;
  onTicketMove: (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent?: boolean) => void;
}

const KanbanBoardWrapper: React.FC<KanbanBoardWrapperProps> = ({ board, onTicketMove }) => {
  useEffect(() => {
    if (board && board.columns) {
      console.log('KanbanBoardWrapper: Rendering board with columns:', 
        board.columns.map(c => c.title).join(', '));
    }
  }, [board]);

  // Make sure to pass the onTicketMove prop with all required parameters, ensuring updateParent is true by default
  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent = true) => {
    console.log(`KanbanBoardWrapper: Handling ticket move ${ticketId} from ${sourceColumn} to ${destinationColumn}, updateParent: ${updateParent}`);
    
    try {
      // Show immediate feedback to the user
      toast.info(`Moving ticket from ${sourceColumn.replace(/-/g, ' ')} to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // Explicitly pass the updateParent parameter to ensure it's not lost in the component chain
      onTicketMove(ticketId, sourceColumn, destinationColumn, updateParent);
    } catch (error) {
      console.error('Error in handleTicketMove:', error);
      toast.error('Failed to move ticket');
    }
  };

  return <KanbanBoard board={board} onTicketMove={handleTicketMove} />;
};

export default KanbanBoardWrapper;


import React, { useEffect } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Board, Status } from '@/lib/types';

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

  // Make sure to pass the onTicketMove prop with all required parameters
  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent = true) => {
    console.log(`KanbanBoardWrapper: Handling ticket move ${ticketId} from ${sourceColumn} to ${destinationColumn}, updateParent: ${updateParent}`);
    onTicketMove(ticketId, sourceColumn, destinationColumn, updateParent);
  };

  return <KanbanBoard board={board} onTicketMove={handleTicketMove} />;
};

export default KanbanBoardWrapper;

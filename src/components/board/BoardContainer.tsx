
import React from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Board as BoardType, Status } from '@/lib/types';

interface BoardContainerProps {
  board: BoardType;
  onTicketMove: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void;
}

const BoardContainer: React.FC<BoardContainerProps> = ({ board, onTicketMove }) => {
  return (
    <div className="relative overflow-hidden h-[calc(100vh-240px)]">
      {board && (
        <KanbanBoard 
          board={board} 
          onTicketMove={onTicketMove} 
        />
      )}
    </div>
  );
};

export default BoardContainer;

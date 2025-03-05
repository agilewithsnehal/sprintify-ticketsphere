
import React from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Board, Status } from '@/lib/types';

interface KanbanBoardWrapperProps {
  board: Board;
  onTicketMove: (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent?: boolean) => void;
}

const KanbanBoardWrapper: React.FC<KanbanBoardWrapperProps> = ({ board, onTicketMove }) => {
  return <KanbanBoard board={board} onTicketMove={onTicketMove} />;
};

export default KanbanBoardWrapper;

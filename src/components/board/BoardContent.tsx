
import React from 'react';
import { Board } from '@/lib/types';
import BoardContainer from './BoardContainer';
import CreateTicketModal from '@/components/CreateTicketModal';

interface BoardContentProps {
  projectId: string;
  board: Board;
  onTicketMove: (ticketId: string, sourceColumn: string, destinationColumn: string, updateParent?: boolean) => void;
  onCreateTicket: (ticket: any) => Promise<boolean>;
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
}

const BoardContent: React.FC<BoardContentProps> = ({
  projectId,
  board,
  onTicketMove,
  onCreateTicket,
  isCreateModalOpen,
  onCloseCreateModal
}) => {
  return (
    <div className="container mx-auto p-4">
      <BoardContainer 
        projectId={projectId} 
        boardName={board.name}
        onCreateTicket={() => onCloseCreateModal()}
        onTicketMove={onTicketMove}
      />
      
      {isCreateModalOpen && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={onCloseCreateModal}
          project={board.project}
          column="todo"
          onTicketCreate={onCreateTicket}
        />
      )}
    </div>
  );
};

export default BoardContent;

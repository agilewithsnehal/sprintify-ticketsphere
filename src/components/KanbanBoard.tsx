
import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { Board as BoardType, Status } from '@/lib/types';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import KanbanColumn from './kanban/KanbanColumn';
import KanbanScrollButtons from './kanban/KanbanScrollButtons';
import TicketModal from './ticket-modal';
import CreateTicketModal from './CreateTicketModal';

interface KanbanBoardProps {
  board: BoardType;
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ board, onTicketMove }) => {
  const {
    columns,
    selectedTicket,
    isTicketModalOpen,
    createModalStatus,
    isCreateModalOpen,
    scrollContainerRef,
    handleOpenTicket,
    handleCloseTicketModal,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleTicketCreate,
    handleTicketUpdate,
    onDragEnd,
    scrollLeft,
    scrollRight
  } = useKanbanBoard(board, onTicketMove);

  return (
    <>
      <div className="relative">
        <KanbanScrollButtons 
          onScrollLeft={scrollLeft} 
          onScrollRight={scrollRight} 
        />
        
        <DragDropContext onDragEnd={onDragEnd}>
          <div 
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto pb-4 pt-2 px-10 scrollbar-hide" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tickets={column.tickets}
                onOpenTicket={handleOpenTicket}
                onAddTicket={handleOpenCreateModal}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
      
      {selectedTicket && (
        <TicketModal 
          isOpen={isTicketModalOpen} 
          onClose={handleCloseTicketModal} 
          ticket={selectedTicket}
          onTicketUpdate={handleTicketUpdate}
        />
      )}
      
      {isCreateModalOpen && createModalStatus && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          project={board.project}
          column={createModalStatus}
          onTicketCreate={handleTicketCreate}
        />
      )}
    </>
  );
};

export default KanbanBoard;

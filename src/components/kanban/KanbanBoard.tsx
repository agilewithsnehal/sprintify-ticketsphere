
import React, { useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { Board as BoardType, Status, Ticket as TicketType } from '@/lib/types';
import { useKanbanBoard } from '@/hooks/kanban/useKanbanBoard';
import KanbanColumn from './KanbanColumn';
import KanbanScrollButtons from './KanbanScrollButtons';
import TicketModal from '../ticket-modal';
import CreateTicketModal from '../CreateTicketModal';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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
    currentUser,
    handleOpenTicket,
    handleCloseTicketModal,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleTicketCreate,
    handleTicketUpdate,
    handleTicketDelete,
    onDragEnd,
    scrollLeft,
    scrollRight
  } = useKanbanBoard(board, onTicketMove);

  useEffect(() => {
    if (!board || !board.project) {
      toast.error('Invalid board data');
      console.error('Invalid board data:', board);
      return;
    }
    
    console.log("KanbanBoard: Board loaded:", board.name);
    console.log("KanbanBoard: selectedTicket:", selectedTicket?.id, "isTicketModalOpen:", isTicketModalOpen);
  }, [board, selectedTicket, isTicketModalOpen]);

  if (!board || !board.project || !board.columns) {
    return (
      <div className="p-8 text-center bg-background border rounded-md flex flex-col items-center gap-4">
        <h3 className="text-2xl font-semibold mb-2">Invalid Board Data</h3>
        <p className="text-muted-foreground">The board data is invalid or incomplete. This might be because the project ID is not in the correct format.</p>
        <Button asChild>
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

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
                projectId={board.project.id}
              />
            ))}
          </div>
        </DragDropContext>
      </div>
      
      {selectedTicket && isTicketModalOpen && (
        <TicketModal 
          isOpen={isTicketModalOpen} 
          onClose={handleCloseTicketModal} 
          ticket={selectedTicket}
          onTicketUpdate={handleTicketUpdate}
          onTicketDelete={handleTicketDelete}
          currentUser={currentUser}
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

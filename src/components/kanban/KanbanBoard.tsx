import React, { useEffect, useCallback, useState } from 'react';
import { DragDropContext, DropResult, DragStart, DragUpdate } from 'react-beautiful-dnd';
import { Board as BoardType, Status, Ticket as TicketType } from '@/lib/types';
import { useKanbanBoard } from '@/hooks/kanban/useKanbanBoard';
import KanbanColumn from './KanbanColumn';
import KanbanScrollButtons from './KanbanScrollButtons';
import TicketModal from '../ticket-modal';
import CreateTicketModal from '../CreateTicketModal';
import { toast } from 'sonner';

interface KanbanBoardProps {
  board: BoardType;
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent?: boolean) => void;
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

  // For auto-scrolling during drag
  const edgeScrollThreshold = 100; // px from edge to trigger scrolling
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  
  // Handle drag start
  const handleDragStart = useCallback((initial: DragStart) => {
    console.log('Drag started');
    setIsDragging(true);
  }, []);
  
  // Handle drag update to get current position
  const handleDragUpdate = useCallback((update: DragUpdate) => {
    if (update.clientX && update.clientY) {
      setDragPosition({ 
        x: update.clientX, 
        y: update.clientY 
      });
    }
  }, []);
  
  // Handle auto-scrolling during drag
  useEffect(() => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    const checkForScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const { x } = dragPosition;
      
      // Check if we're near the left or right edge
      const leftEdge = rect.left + edgeScrollThreshold;
      const rightEdge = rect.right - edgeScrollThreshold;
      
      if (x < leftEdge) {
        // Near left edge, scroll left
        const scrollAmount = Math.max(5, Math.ceil((leftEdge - x) / 10));
        container.scrollLeft -= scrollAmount;
      } else if (x > rightEdge) {
        // Near right edge, scroll right
        const scrollAmount = Math.max(5, Math.ceil((x - rightEdge) / 10));
        container.scrollLeft += scrollAmount;
      }
    };
    
    // Set up animation frame for smooth scrolling
    let animationFrameId: number;
    const scrollIfNeeded = () => {
      checkForScroll();
      animationFrameId = requestAnimationFrame(scrollIfNeeded);
    };
    
    // Start the animation
    animationFrameId = requestAnimationFrame(scrollIfNeeded);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDragging, dragPosition, scrollContainerRef, edgeScrollThreshold]);
  
  // Reset drag state when drag ends
  const handleDragEndWithReset = useCallback((result: DropResult) => {
    setIsDragging(false);
    onDragEnd(result);
  }, [onDragEnd]);

  useEffect(() => {
    if (!board || !board.project) {
      toast.error('Invalid board data');
      console.error('Invalid board data:', board);
      return;
    }
    
    console.log("KanbanBoard: Board loaded:", board.name);
    console.log("KanbanBoard: Columns:", columns.map(c => `${c.title} (${c.tickets.length} tickets)`));
  }, [board, columns]);

  if (!board || !board.project || !board.columns) {
    return (
      <div className="p-4 text-center bg-background border rounded-md">
        <h3 className="font-medium mb-2">Unable to load board</h3>
        <p className="text-muted-foreground text-sm">The board data is invalid or incomplete.</p>
      </div>
    );
  }

  const handleTicketCreateWrapper = async (ticket: TicketType): Promise<boolean> => {
    try {
      console.log('Calling handleTicketCreate with ticket:', ticket);
      
      if (!ticket.id) {
        console.error('New ticket is missing ID in handleTicketCreateWrapper');
        toast.error('Cannot create ticket: Missing ID');
        return false;
      }
      
      // Make sure we have valid dates
      if (!ticket.createdAt) ticket.createdAt = new Date();
      if (!ticket.updatedAt) ticket.updatedAt = new Date();
      
      const result = await handleTicketCreate(ticket);
      return result === false ? false : true;
    } catch (error) {
      console.error('Error creating ticket in wrapper:', error);
      return false;
    }
  };

  return (
    <>
      <div className="relative">
        <KanbanScrollButtons 
          onScrollLeft={scrollLeft} 
          onScrollRight={scrollRight} 
        />
        
        <DragDropContext 
          onDragEnd={handleDragEndWithReset}
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
        >
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
                tickets={column.tickets || []} 
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
          onTicketCreate={handleTicketCreateWrapper}
        />
      )}
    </>
  );
};

export default KanbanBoard;

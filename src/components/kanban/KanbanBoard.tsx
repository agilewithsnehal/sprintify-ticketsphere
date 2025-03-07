
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { DragDropContext, DropResult, DragStart, DragUpdate } from 'react-beautiful-dnd';
import { Board as BoardType, Status, Ticket as TicketType, IssueType } from '@/lib/types';
import { useKanbanBoard } from '@/hooks/kanban/useKanbanBoard';
import KanbanColumn from './KanbanColumn';
import KanbanScrollButtons from './KanbanScrollButtons';
import TicketModal from '../ticket-modal';
import CreateTicketModal from '../CreateTicketModal';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanBoardProps {
  board: BoardType;
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent?: boolean) => void;
  onRefresh?: () => void;
  selectedIssueType: string | null;
  onIssueTypeChange: (type: string | null) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  board, 
  onTicketMove, 
  onRefresh,
  selectedIssueType,
  onIssueTypeChange 
}) => {
  // Local state to track the selectedIssueType from props
  const [selectedIssueTypeState, setSelectedIssueTypeState] = useState<string | null>(selectedIssueType);
  
  const {
    columns,
    setFilteredColumns,
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

  // Update the local state when the prop changes
  useEffect(() => {
    setSelectedIssueTypeState(selectedIssueType);
  }, [selectedIssueType]);

  // Apply filter when selectedIssueType or columns change
  useEffect(() => {
    if (!selectedIssueTypeState) {
      setFilteredColumns(columns);
      return;
    }
    
    const filtered = columns.map(column => ({
      ...column,
      tickets: column.tickets.filter(ticket => ticket.issueType === selectedIssueTypeState)
    }));
    
    setFilteredColumns(filtered);
  }, [selectedIssueTypeState, columns, setFilteredColumns]);

  // Handle issue type changes locally and propagate to parent
  const handleIssueTypeChange = (type: string | null) => {
    setSelectedIssueTypeState(type);
    onIssueTypeChange(type);
  };

  useEffect(() => {
    if (!board || !board.project) {
      toast.error('Invalid board data');
      console.error('Invalid board data:', board);
      return;
    }
    
    console.log("KanbanBoard: Board loaded:", board.name);
    console.log("KanbanBoard: Columns:", columns.map(c => `${c.title} (${c.tickets.length} tickets)`));
  }, [board, columns]);

  useEffect(() => {
    const handleTicketEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('KanbanBoard: Detected ticket event:', customEvent.detail);
      
      // Only refresh for created tickets, not for moves
      if ((customEvent.detail?.type === 'created' || event.type === 'ticket-parent-updated') && onRefresh) {
        console.log('KanbanBoard: Triggering refresh after ticket event');
        onRefresh();
      }
    };
    
    document.addEventListener('ticket-notification', handleTicketEvent);
    document.addEventListener('ticket-parent-updated', handleTicketEvent);
    
    return () => {
      document.removeEventListener('ticket-notification', handleTicketEvent);
      document.removeEventListener('ticket-parent-updated', handleTicketEvent);
    };
  }, [onRefresh]);

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
      
      if (!ticket.createdAt) ticket.createdAt = new Date();
      if (!ticket.updatedAt) ticket.updatedAt = new Date();
      
      const result = await handleTicketCreate(ticket);
      
      if (result !== false && onRefresh) {
        console.log('Ticket created successfully, triggering board refresh');
        onRefresh();
      }
      
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
                tickets={selectedIssueTypeState 
                  ? column.tickets.filter(t => t.issueType === selectedIssueTypeState)
                  : column.tickets || []
                } 
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

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Board as BoardType, Status, Ticket as TicketType } from '@/lib/types';
import { useKanbanBoard } from '@/hooks/kanban/useKanbanBoard';
import KanbanColumn from './KanbanColumn';
import KanbanScrollButtons from './KanbanScrollButtons';
import TicketModal from '../ticket-modal';
import CreateTicketModal from '../CreateTicketModal';
import { toast } from 'sonner';

interface KanbanBoardProps {
  board: BoardType;
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void;
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
  // Keep a map of ticket IDs to ensure uniqueness
  const processedTickets = useRef(new Map<string, TicketType>());
  
  // Local state to track the selectedIssueType from props
  const [selectedIssueTypeState, setSelectedIssueTypeState] = useState<string | null>(selectedIssueType);
  
  // Ensure board data is processed to remove duplicate tickets
  const processedBoard = React.useMemo(() => {
    if (!board || !board.columns) return board;
    
    // Clear the map when board changes
    processedTickets.current.clear();
    
    // Create a deep copy to avoid modifying the original board
    const boardCopy = {
      ...board,
      columns: board.columns.map(column => ({
        ...column,
        tickets: [] // Will be filled with unique tickets
      }))
    };
    
    // Process each column to find unique tickets
    board.columns.forEach((column, colIndex) => {
      if (!column.tickets) return;
      
      column.tickets.forEach(ticket => {
        // Skip if we've already processed this ticket ID
        if (processedTickets.current.has(ticket.id)) {
          console.log(`KanbanBoard: Skipping duplicate ticket ${ticket.key} (${ticket.id}) in ${column.id}`);
          return;
        }
        
        // Add to processed map and to the column
        processedTickets.current.set(ticket.id, ticket);
        boardCopy.columns[colIndex].tickets.push({...ticket});
      });
    });
    
    console.log(`KanbanBoard: After deduplication: ${processedTickets.current.size} unique tickets`);
    
    return boardCopy;
  }, [board]);
  
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
  } = useKanbanBoard(processedBoard, onTicketMove);

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

  // Only listen for ticket creation events, not moves or status updates
  useEffect(() => {
    const handleTicketEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // Only refresh for created tickets, never for moves
      if (customEvent.detail?.type === 'created' && onRefresh) {
        console.log('KanbanBoard: Triggering refresh after ticket creation');
        onRefresh();
      }
    };
    
    document.addEventListener('ticket-notification', handleTicketEvent);
    
    return () => {
      document.removeEventListener('ticket-notification', handleTicketEvent);
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

  // Apply issue type filtering if a filter is selected
  const filteredColumns = columns.map(column => {
    const columnTickets = selectedIssueTypeState 
      ? column.tickets.filter(t => t.issueType === selectedIssueTypeState)
      : column.tickets;
    
    return {
      ...column,
      tickets: columnTickets
    };
  });

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
            {filteredColumns.map((column) => (
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
          onTicketCreate={handleTicketCreateWrapper}
        />
      )}
    </>
  );
};

export default KanbanBoard;

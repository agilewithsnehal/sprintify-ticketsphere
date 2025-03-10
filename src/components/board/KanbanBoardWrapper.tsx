
import React, { useEffect, useState } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Board, Status } from '@/lib/types';
import { toast } from 'sonner';

interface KanbanBoardWrapperProps {
  board: Board;
  onTicketMove: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void;
  onRefresh?: () => void;
  selectedIssueTypes: string[];
  onIssueTypesChange: (types: string[]) => void;
}

const KanbanBoardWrapper: React.FC<KanbanBoardWrapperProps> = ({ 
  board, 
  onTicketMove, 
  onRefresh,
  selectedIssueTypes,
  onIssueTypesChange
}) => {
  // Use a persistent Set to track seen ticket IDs
  const [seenTicketIds] = useState(() => new Set<string>());
  
  // Process the board to remove duplicate tickets before passing to KanbanBoard
  const deduplicatedBoard = React.useMemo(() => {
    if (!board || !board.columns) return board;
    
    // Clear the set when board changes to avoid stale data
    seenTicketIds.clear();
    
    // Create a deep copy of the board
    const boardCopy = {
      ...board,
      columns: board.columns.map(column => ({
        ...column,
        tickets: [] // Will be filled with unique tickets
      }))
    };
    
    // Process each column and add only unseen tickets
    board.columns.forEach((column, colIndex) => {
      if (!column.tickets) return;
      
      column.tickets.forEach(ticket => {
        // Skip if we've already seen this ticket ID
        if (seenTicketIds.has(ticket.id)) {
          console.log(`Deduplicating: Skipping duplicate ticket ${ticket.key} (${ticket.id}) in ${column.title}`);
          return;
        }
        
        // Add ticket ID to seen set and add ticket to deduplicated board
        seenTicketIds.add(ticket.id);
        boardCopy.columns[colIndex].tickets.push({...ticket});
      });
    });
    
    return boardCopy;
  }, [board, seenTicketIds]);

  useEffect(() => {
    if (board && board.columns) {
      console.log('KanbanBoardWrapper: Rendering board with columns:', 
        board.columns.map(c => `${c.title} (${c.tickets.length})`).join(', '));
      
      // Calculate total tickets for debugging
      const totalTickets = board.columns.reduce((sum, col) => sum + col.tickets.length, 0);
      console.log(`KanbanBoardWrapper: Total tickets on board: ${totalTickets}`);
      
      const deduplicatedTickets = deduplicatedBoard.columns.reduce((sum, col) => sum + col.tickets.length, 0);
      console.log(`KanbanBoardWrapper: After deduplication: ${deduplicatedTickets} tickets`);
      
      // If filtering is active, also log filtered tickets count
      if (selectedIssueTypes.length > 0) {
        const filteredTickets = board.columns.reduce((sum, col) => 
          sum + col.tickets.filter(t => selectedIssueTypes.includes(t.issueType)).length, 0);
        console.log(`KanbanBoardWrapper: Filtered tickets: ${filteredTickets} (types: ${selectedIssueTypes.join(', ')})`);
      }
    }
  }, [board, selectedIssueTypes, deduplicatedBoard]);

  // Listen for ticket events that should trigger a refresh
  useEffect(() => {
    const handleTicketEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // Only refresh for created tickets, not for moves or updates
      if (customEvent.detail?.type === 'created' && onRefresh) {
        console.log('KanbanBoardWrapper: Triggering refresh after ticket creation');
        setTimeout(() => onRefresh(), 100);
      }
    };
    
    document.addEventListener('ticket-notification', handleTicketEvent);
    
    return () => {
      document.removeEventListener('ticket-notification', handleTicketEvent);
    };
  }, [onRefresh]);

  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    console.log(`KanbanBoardWrapper: Handling ticket move ${ticketId} from ${sourceColumn} to ${destinationColumn}`);
    
    try {
      // Show immediate feedback to the user
      toast.info(`Moving ticket from ${sourceColumn.replace(/-/g, ' ')} to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // Call the parent handler to update the database
      onTicketMove(ticketId, sourceColumn, destinationColumn);
    } catch (error) {
      console.error('Error in handleTicketMove:', error);
      toast.error('Failed to move ticket');
      
      // Only refresh on errors to ensure UI is in sync with database
      if (onRefresh) {
        console.log('KanbanBoardWrapper: Triggering refresh after ticket move error');
        onRefresh();
      }
    }
  };

  return <KanbanBoard 
    board={deduplicatedBoard} 
    onTicketMove={handleTicketMove} 
    onRefresh={onRefresh}
    selectedIssueTypes={selectedIssueTypes}
    onIssueTypesChange={onIssueTypesChange}
  />;
};

export default KanbanBoardWrapper;

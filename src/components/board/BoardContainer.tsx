
import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabase';
import BoardSkeleton from './BoardSkeleton';
import BoardNotFound from './BoardNotFound';
import KanbanBoardWrapper from './KanbanBoardWrapper';
import { Board, Status, Column } from '@/lib/types';
import BoardToolbar from './BoardToolbar';
import { toast } from 'sonner';

interface BoardContainerProps {
  projectId: string;
  boardName: string;
  onCreateTicket: () => void;
  onTicketMove: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void;
  onRefresh?: () => void;
  selectedIssueTypes: string[];
  onIssueTypesChange: (types: string[]) => void;
}

const BoardContainer: React.FC<BoardContainerProps> = ({
  projectId,
  boardName,
  onCreateTicket,
  onTicketMove,
  onRefresh,
  selectedIssueTypes,
  onIssueTypesChange
}) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const fetchBoard = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('BoardContainer: Fetching board data for project:', projectId, 'Refresh #:', refreshTrigger);
      
      // Add a cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();
      const boardData = await supabaseService.createBoard(projectId);
      
      if (boardData) {
        console.log('Board fetched with columns:', 
          boardData.columns.map(c => `${c.title} (${c.tickets.length} tickets)`), 
          'Total tickets:', boardData.columns.reduce((acc, col) => acc + col.tickets.length, 0));
          
        // Process board data to deduplicate tickets before setting state
        const processedBoard = processBoardData(boardData);
        setBoard(processedBoard);
      } else {
        setError(new Error('Board not found'));
      }
    } catch (err: any) {
      console.error('Error fetching board:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, refreshTrigger]);
  
  // Helper function to deduplicate tickets in board data
  const processBoardData = (boardData: Board): Board => {
    if (!boardData || !boardData.columns) return boardData;
    
    // Use a Set to track seen ticket IDs
    const seenTicketIds = new Set<string>();
    
    // Create a deep copy of the board to avoid modifying the original
    const processedBoard = {
      ...boardData,
      columns: boardData.columns.map(column => ({
        ...column,
        tickets: [] // Will be filled with unique tickets
      }))
    };
    
    // Process each column to find unique tickets
    boardData.columns.forEach((column, colIndex) => {
      if (!column.tickets) return;
      
      column.tickets.forEach(ticket => {
        // Skip if we've already seen this ticket ID
        if (seenTicketIds.has(ticket.id)) {
          console.log(`BoardContainer: Skipping duplicate ticket ${ticket.key} (${ticket.id}) in ${column.title}`);
          return;
        }
        
        // Add ticket ID to seen set and add ticket to processed board
        seenTicketIds.add(ticket.id);
        processedBoard.columns[colIndex].tickets.push({...ticket});
      });
    });
    
    return processedBoard;
  };
  
  // Initial fetch
  useEffect(() => {
    console.log('BoardContainer: Fetching board for project:', projectId);
    fetchBoard();
  }, [fetchBoard]);

  // Listen for ticket creation events to trigger a refresh
  useEffect(() => {
    const handleTicketEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('BoardContainer: Detected ticket event:', customEvent.detail);
      
      // Only refresh board for specific events that require a refresh
      if (customEvent.detail?.type === 'created') {
        console.log('BoardContainer: Refreshing board data due to ticket creation event');
        // Use refreshTrigger to force a re-fetch
        setRefreshTrigger(prev => prev + 1);
        
        // Also call the parent refresh if available
        if (onRefresh) {
          console.log('BoardContainer: Calling parent refresh');
          onRefresh();
        }
      }
    };
    
    document.addEventListener('ticket-notification', handleTicketEvent);
    
    return () => {
      document.removeEventListener('ticket-notification', handleTicketEvent);
    };
  }, [onRefresh]);

  // Manual refresh method that can be called from child components
  const refreshBoard = useCallback(() => {
    console.log('BoardContainer: Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
    
    // Also call the parent refresh if available
    if (onRefresh) {
      console.log('BoardContainer: Calling parent refresh from manual refresh');
      onRefresh();
    }
  }, [onRefresh]);

  const handleColumnsUpdate = async (updatedColumns: Column[]) => {
    try {
      await supabaseService.updateBoardColumns(projectId, updatedColumns);
      
      // Refresh the board to show the updated columns
      refreshBoard();
      
      toast.success('Board columns updated');
    } catch (error) {
      console.error('Error updating columns:', error);
      toast.error('Failed to update board columns');
    }
  };
  
  const handleFilterClick = () => {
    console.log('Filter clicked');
    // Implement filter functionality
  };
  
  const handleGroupClick = () => {
    console.log('Group clicked');
    // Implement group functionality
  };
  
  if (isLoading) {
    return <BoardSkeleton />;
  }
  
  if (error || !board) {
    return <BoardNotFound projectId={projectId} />;
  }

  return (
    <div className="flex flex-col">
      <BoardToolbar 
        boardName={boardName}
        projectId={projectId}
        columns={board.columns}
        onColumnsUpdate={handleColumnsUpdate}
        onCreateTicket={onCreateTicket}
        onFilterClick={handleFilterClick}
        onGroupClick={handleGroupClick}
        onIssueTypesChange={onIssueTypesChange}
        selectedIssueTypes={selectedIssueTypes}
      />
      
      <KanbanBoardWrapper 
        board={board} 
        onTicketMove={onTicketMove}
        onRefresh={refreshBoard}
        selectedIssueTypes={selectedIssueTypes}
        onIssueTypesChange={onIssueTypesChange}
      />
    </div>
  );
};

export default BoardContainer;

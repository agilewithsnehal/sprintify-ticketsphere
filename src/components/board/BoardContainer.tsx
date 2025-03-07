
import React, { useState, useEffect } from 'react';
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
}

const BoardContainer: React.FC<BoardContainerProps> = ({
  projectId,
  boardName,
  onCreateTicket,
  onTicketMove
}) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchBoard = async () => {
    try {
      setIsLoading(true);
      
      console.log('BoardContainer: Fetching board data for project:', projectId);
      const boardData = await supabaseService.createBoard(projectId);
      
      if (boardData) {
        console.log('Board fetched with columns:', boardData.columns.map(c => c.title));
        setBoard(boardData);
      } else {
        setError(new Error('Board not found'));
      }
    } catch (err: any) {
      console.error('Error fetching board:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    console.log('BoardContainer: Fetching board for project:', projectId);
    fetchBoard();
  }, [projectId]);

  // Listen for ticket creation events to trigger a refresh
  useEffect(() => {
    const handleTicketCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === 'created') {
        console.log('BoardContainer: Detected ticket creation, refreshing board data');
        fetchBoard();
      }
    };
    
    document.addEventListener('ticket-notification', handleTicketCreated);
    
    return () => {
      document.removeEventListener('ticket-notification', handleTicketCreated);
    };
  }, []);

  const handleColumnsUpdate = async (updatedColumns: Column[]) => {
    try {
      await supabaseService.updateBoardColumns(projectId, updatedColumns);
      
      fetchBoard();
      
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
      />
      
      <KanbanBoardWrapper 
        board={board} 
        onTicketMove={onTicketMove} 
      />
    </div>
  );
};

export default BoardContainer;

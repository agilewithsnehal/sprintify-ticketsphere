
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '@/lib/supabase-service';
import { Board as BoardType, Status, Ticket } from '@/lib/types';
import { toast } from 'sonner';
import BoardNotFound from './BoardNotFound';
import BoardSkeleton from './BoardSkeleton';
import BoardToolbar from './BoardToolbar';
import KanbanBoardWrapper from './KanbanBoardWrapper';

interface BoardContainerProps {
  projectId: string;
}

const BoardContainer: React.FC<BoardContainerProps> = ({ projectId }) => {
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  
  const { data: board, isLoading, error } = useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => {
      console.log('Fetching board for project:', projectId);
      return await supabaseService.createBoard(projectId); // Using createBoard instead of getBoardByProjectId
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching board:', error);
      toast.error('Failed to load board data');
    }
  }, [error]);

  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    try {
      // Using updateTicket instead of updateTicketStatus
      await supabaseService.updateTicket(ticketId, { status: destinationColumn });
    } catch (error) {
      console.error('Error moving ticket:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handleCreateTicket = () => {
    setIsCreateTicketOpen(true);
  };

  const handleFilterClick = () => {
    // To be implemented
    toast('Filtering will be available soon!');
  };

  const handleGroupClick = () => {
    // To be implemented
    toast('Grouping will be available soon!');
  };

  if (isLoading) {
    return <BoardSkeleton />;
  }

  if (!board || error) {
    return <BoardNotFound projectId={projectId} />;
  }

  return (
    <div className="relative overflow-hidden h-[calc(100vh-240px)]">
      <BoardToolbar
        boardName={board.name}
        onCreateTicket={handleCreateTicket}
        onFilterClick={handleFilterClick}
        onGroupClick={handleGroupClick}
      />
      
      {board && (
        <KanbanBoardWrapper
          board={board} 
          onTicketMove={handleTicketMove} 
        />
      )}
    </div>
  );
};

export default BoardContainer;

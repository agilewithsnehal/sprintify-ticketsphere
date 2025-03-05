
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '@/lib/supabase'; 
import { Board as BoardType, Status, Ticket } from '@/lib/types';
import { toast } from 'sonner';
import BoardNotFound from './BoardNotFound';
import BoardSkeleton from './BoardSkeleton';
import BoardToolbar from './BoardToolbar';
import KanbanBoardWrapper from './KanbanBoardWrapper';

interface BoardContainerProps {
  projectId: string;
  boardName: string;
  onCreateTicket: () => void;
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent?: boolean) => void;
}

const BoardContainer: React.FC<BoardContainerProps> = ({ 
  projectId, 
  boardName, 
  onCreateTicket, 
  onTicketMove 
}) => {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  
  const { data: board, isLoading, error } = useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => {
      console.log('Fetching board for project:', projectId);
      return await supabaseService.createBoard(projectId);
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

  const handleFilterClick = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
    toast.info('Filtering will be available soon!');
  };

  const handleGroupClick = () => {
    setIsGroupMenuOpen(!isGroupMenuOpen);
    toast.info('Grouping will be available soon!');
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
        boardName={boardName}
        projectId={projectId} // Pass projectId to BoardToolbar
        onCreateTicket={onCreateTicket}
        onFilterClick={handleFilterClick}
        onGroupClick={handleGroupClick}
      />
      
      {board && (
        <KanbanBoardWrapper
          board={board} 
          onTicketMove={onTicketMove} 
        />
      )}
    </div>
  );
};

export default BoardContainer;

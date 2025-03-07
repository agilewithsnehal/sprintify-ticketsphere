
import React, { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import BoardNotFound from '@/components/board/BoardNotFound';
import BoardSkeleton from '@/components/board/BoardSkeleton';
import InvalidProjectId from '@/components/board/InvalidProjectId';
import BoardContent from '@/components/board/BoardContent';
import { useBoard } from '@/hooks/useBoard';
import { useTicketOperations } from '@/hooks/useTicketOperations';

const Board = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  const {
    board,
    isLoading,
    isError,
    refetch,
    isValidUuid
  } = useBoard(projectId);
  
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    handleTicketMove,
    handleCreateTicket
  } = useTicketOperations(refetch);

  // Add a debounced refetch to avoid too many refreshes
  const debouncedRefetch = useCallback(() => {
    console.log('Board: Debounced refetch triggered');
    refetch();
  }, [refetch]);

  // Add an effect to refetch board data when returning to the board
  // and only for ticket creation events, not move events
  useEffect(() => {
    if (projectId) {
      console.log('Board: Initial data fetch for project:', projectId);
      refetch();
    }
    
    // Listen for ticket creation events to trigger a refresh
    const handleTicketEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Board: Detected ticket event:', customEvent.detail);
      
      // Only refresh for ticket creation, not for moves
      if (customEvent.detail?.type === 'created') {
        console.log('Board: Refreshing after ticket creation event');
        debouncedRefetch();
      }
    };
    
    document.addEventListener('ticket-notification', handleTicketEvent);
    
    return () => {
      document.removeEventListener('ticket-notification', handleTicketEvent);
    };
  }, [projectId, refetch, debouncedRefetch]);

  if (!projectId || !isValidUuid(projectId)) {
    return (
      <Layout>
        <InvalidProjectId projectId={projectId} />
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <BoardSkeleton />
      </Layout>
    );
  }

  if (isError || !board) {
    return (
      <Layout>
        <BoardNotFound projectId={projectId} />
      </Layout>
    );
  }

  return (
    <Layout>
      <BoardContent
        projectId={projectId}
        board={board}
        onTicketMove={handleTicketMove}
        onCreateTicket={handleCreateTicket}
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={() => setIsCreateModalOpen(false)}
      />
    </Layout>
  );
};

export default Board;

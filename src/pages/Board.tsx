
import React from 'react';
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

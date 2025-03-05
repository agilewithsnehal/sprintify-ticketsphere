
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';
import { Board } from '@/lib/types';

export const useBoard = (projectId: string | undefined) => {
  const navigate = useNavigate();
  
  const isValidUuid = (id?: string) => {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };
  
  useEffect(() => {
    console.log('Board component mounted with projectId:', projectId);
    
    if (projectId && !isValidUuid(projectId)) {
      toast.error('Invalid project ID format');
      navigate('/');
    }
  }, [projectId, navigate]);

  const { 
    data: board, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      if (!isValidUuid(projectId)) {
        toast.error('Invalid project ID format');
        throw new Error('Invalid project ID format');
      }
      
      const boardData = await supabaseService.createBoard(projectId);
      console.log('Board data loaded:', boardData);
      return boardData;
    },
    enabled: !!projectId && isValidUuid(projectId),
  });
  
  return {
    board,
    isLoading,
    isError,
    refetch,
    isValidUuid,
  };
};

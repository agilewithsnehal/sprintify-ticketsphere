
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '@/lib/supabase'; // Updated import
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import {
  ProjectLayout,
  ProjectLoadingState,
  ProjectNotFound
} from '@/components/project';
import ProjectConfiguration from '@/components/board/ProjectConfiguration';

const Project = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [configOpen, setConfigOpen] = useState(false);
  
  const { data: project, isLoading: isLoadingProject, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      return await supabaseService.getProjectById(projectId);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['project-tickets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await supabaseService.getTicketsByProjectId(projectId);
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (error) {
    toast.error('Error loading project data');
    navigate('/');
    return null;
  }

  if (isLoadingProject) {
    return (
      <Layout>
        <ProjectLoadingState />
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <ProjectNotFound />
      </Layout>
    );
  }

  return (
    <Layout>
      <ProjectLayout 
        project={project} 
        tickets={tickets} 
        onConfigureClick={() => setConfigOpen(true)}
      />
      
      {project && (
        <ProjectConfiguration 
          project={project}
          isOpen={configOpen}
          onOpenChange={setConfigOpen}
        />
      )}
    </Layout>
  );
};

export default Project;

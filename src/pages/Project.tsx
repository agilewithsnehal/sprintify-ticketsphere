
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [configOpen, setConfigOpen] = useState(false);
  
  // Parse the tab parameter from the URL
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  
  // Effect to handle tab parameter
  useEffect(() => {
    if (tabParam) {
      // If the tab is "members", set the activeTab in ProjectLayout
      if (tabParam === 'settings') {
        setConfigOpen(true);
      }
    }
  }, [tabParam]);
  
  const { data: project, isLoading: isLoadingProject, error, refetch: refetchProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      return await supabaseService.getProjectById(projectId);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { 
    data: tickets = [], 
    isLoading: isLoadingTickets, 
    refetch: refetchTickets 
  } = useQuery({
    queryKey: ['project-tickets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await supabaseService.getTicketsByProjectId(projectId);
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Function to handle refreshing both project and tickets data
  const handleRefresh = async () => {
    console.log('Project page: Refreshing project and tickets data');
    await Promise.all([
      refetchProject(),
      refetchTickets()
    ]);
  };

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
        onRefresh={handleRefresh}
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

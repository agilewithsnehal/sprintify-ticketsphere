
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import KanbanBoard from '@/components/KanbanBoard';
import ProjectHeader from '@/components/ProjectHeader';
import { createBoard, getProjectById } from '@/lib/data';
import { Board as BoardType, Project, Status } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Filter, StarIcon, ListFilter, ChevronDown } from 'lucide-react';

const Board = () => {
  const { projectId = '1' } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<BoardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get project and board data
    const fetchData = async () => {
      setIsLoading(true);
      
      // Add a small delay to simulate loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const projectData = getProjectById(projectId);
      if (projectData) {
        setProject(projectData);
        setBoard(createBoard(projectId));
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [projectId]);

  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    console.log(`Moved ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}`);
    // In a real app, this would make an API call to update the ticket
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse space-y-4 w-full max-w-3xl">
            <div className="h-8 bg-secondary rounded-md w-1/3"></div>
            <div className="h-4 bg-secondary rounded-md w-2/3"></div>
            <div className="flex space-x-4">
              <div className="h-24 bg-secondary rounded-md w-1/4"></div>
              <div className="h-24 bg-secondary rounded-md w-1/4"></div>
              <div className="h-24 bg-secondary rounded-md w-1/4"></div>
              <div className="h-24 bg-secondary rounded-md w-1/4"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project || !board) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground">The requested project does not exist or you don't have access to it.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProjectHeader project={project} />
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold flex items-center">
            {board.name}
            <Button variant="ghost" size="icon" className="ml-1 h-7 w-7">
              <StarIcon className="h-4 w-4" />
            </Button>
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          
          <Button variant="outline" size="sm" className="gap-1">
            <ListFilter className="h-4 w-4" />
            <span>Group</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <KanbanBoard board={board} onTicketMove={handleTicketMove} />
      </motion.div>
    </Layout>
  );
};

export default Board;

import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListTodo, Users, BarChart3, Settings, GitBranch } from 'lucide-react';
import BoardContainer from '@/components/board/BoardContainer';
import ProjectConfiguration from '@/components/board/ProjectConfiguration';
import ProjectMembersTab from './ProjectMembersTab';
import ProjectReportsTab from './ProjectReportsTab';
import IssueHierarchyView from './IssueHierarchyView';
import { Project, Status, Ticket } from '@/lib/types';
import { useLocation, useNavigate } from 'react-router-dom';

interface ProjectTabsProps {
  project: Project;
  tickets: Ticket[];
  activeTab: string;
  setActiveTab: (value: string) => void;
  onCreateTicket: () => void;
  onTicketMove: (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent?: boolean) => void;
  onRefresh?: () => void;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({
  project,
  tickets,
  activeTab,
  setActiveTab,
  onCreateTicket,
  onTicketMove,
  onRefresh
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle URL tab parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam) {
      if (['board', 'hierarchy', 'members', 'reports', 'settings'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [location.search, setActiveTab]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/project/${project.id}?tab=${value}`, { replace: true });
  };
  
  return (
    <Tabs 
      value={activeTab} 
      onValueChange={handleTabChange} 
      className="mt-6"
    >
      <TabsList className="grid w-full grid-cols-5 mb-6">
        <TabsTrigger value="board" className="gap-2">
          <ListTodo className="h-4 w-4" />
          Board
        </TabsTrigger>
        <TabsTrigger value="hierarchy" className="gap-2">
          <GitBranch className="h-4 w-4" />
          Hierarchy
        </TabsTrigger>
        <TabsTrigger value="members" className="gap-2">
          <Users className="h-4 w-4" />
          Members
        </TabsTrigger>
        <TabsTrigger value="reports" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Reports
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="board" className="overflow-visible">
        <BoardContainer 
          projectId={project.id} 
          boardName={project.name}
          onCreateTicket={onCreateTicket}
          onTicketMove={onTicketMove}
          onRefresh={onRefresh}
        />
      </TabsContent>
      
      <TabsContent value="hierarchy">
        <IssueHierarchyView 
          tickets={tickets} 
          projectId={project.id} 
        />
      </TabsContent>
      
      <TabsContent value="members">
        <ProjectMembersTab project={project} />
      </TabsContent>
      
      <TabsContent value="reports">
        <ProjectReportsTab project={project} tickets={tickets} />
      </TabsContent>
      
      <TabsContent value="settings">
        <div className="max-w-3xl mx-auto">
          <ProjectConfiguration project={project} isOpen={true} />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ProjectTabs;

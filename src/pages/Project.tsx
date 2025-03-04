
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '@/lib/supabase-service';
import Layout from '@/components/Layout';
import ProjectHeader from '@/components/ProjectHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BoardContainer from '@/components/board/BoardContainer';
import ProjectConfiguration from '@/components/board/ProjectConfiguration';
import { BarChart, ListTodo, Settings, Users, BarChart3, TicketPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Status, Ticket } from '@/lib/types';
import CreateTicketModal from '@/components/CreateTicketModal';

const Project = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('board');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
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

  const handleTicketCreate = async (newTicket: Ticket): Promise<boolean> => {
    try {
      const createdTicket = await supabaseService.createTicket(newTicket);
      
      if (createdTicket) {
        toast.success('Ticket created successfully');
        // Force a refresh of the tickets
        setTimeout(() => {
          navigate(`/board/${projectId}`);
        }, 500);
        return true;
      } else {
        toast.error('Failed to create ticket');
        return false;
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
      return false;
    }
  };

  if (error) {
    toast.error('Error loading project data');
    navigate('/');
    return null;
  }

  if (isLoadingProject) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded-md w-1/4"></div>
            <div className="h-4 bg-secondary rounded-md w-1/2"></div>
            <div className="h-64 bg-secondary rounded-md w-full mt-8"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <p className="mt-2">The project you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/')} className="mt-4">Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  const ticketsByStatus = tickets.reduce((acc, ticket) => {
    const status = ticket.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(ticket);
    return acc;
  }, {} as Record<Status, Ticket[]>);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <ProjectHeader 
          project={project} 
          rightContent={
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1"
            >
              <TicketPlus className="h-4 w-4" />
              Create Ticket
            </Button>
          }
        />
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="board" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Board
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
          
          <TabsContent value="board">
            <BoardContainer projectId={projectId || ''} />
          </TabsContent>
          
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Members working on {project.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-muted-foreground capitalize">{member.role}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Analytics and statistics for {project.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Tickets by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(ticketsByStatus).map(([status, statusTickets]) => (
                          <div key={status} className="flex justify-between items-center">
                            <span className="capitalize">{status.replace(/-/g, ' ')}</span>
                            <span className="font-medium">{statusTickets.length}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tickets.length > 0 ? (
                        <div className="space-y-2">
                          {tickets
                            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                            .slice(0, 5)
                            .map(ticket => (
                              <div key={ticket.id} className="text-sm">
                                <p className="font-medium">{ticket.key}: {ticket.summary}</p>
                                <p className="text-xs text-muted-foreground">Updated {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No ticket activity yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <ProjectConfiguration project={project} />
          </TabsContent>
        </Tabs>
      </div>
      
      {isCreateModalOpen && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          project={project}
          column="todo"
          onTicketCreate={handleTicketCreate}
        />
      )}
    </Layout>
  );
};

export default Project;

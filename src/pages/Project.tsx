
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProjectHeader from '@/components/ProjectHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusColor } from '@/lib/utils';
import { Ticket as TicketType } from '@/lib/types';
import { LayoutGrid, ListChecks, Users } from 'lucide-react';
import CreateTicketModal from '@/components/CreateTicketModal';
import { supabaseService } from '@/lib/supabase-service';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const Project = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Use React Query to fetch project data
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      return supabaseService.getProjectById(projectId);
    },
    enabled: !!projectId,
  });
  
  const { data: tickets = [], isLoading: isLoadingTickets, refetch } = useQuery({
    queryKey: ['project-tickets', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      return supabaseService.getTicketsByProjectId(projectId);
    },
    enabled: !!projectId,
  });

  const handleCreateTicket = async (ticket: TicketType) => {
    try {
      await supabaseService.createTicket(ticket);
      toast.success('Ticket created successfully');
      refetch();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsCreateModalOpen(false);
    }
  };

  if (isLoadingProject || isLoadingTickets) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-secondary rounded w-1/4"></div>
          <div className="h-8 bg-secondary rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="h-64 bg-secondary rounded"></div>
            <div className="h-64 bg-secondary rounded"></div>
            <div className="h-64 bg-secondary rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-medium mb-4">Project not found</h2>
          <p className="text-muted-foreground mb-6">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <ProjectHeader 
          project={project}
          ticketCount={tickets.length}
          onCreateTicket={() => setIsCreateModalOpen(true)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                <span>Board</span>
              </CardTitle>
              <CardDescription>Visualize work in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {['backlog', 'todo', 'in-progress', 'review', 'done'].map((status) => {
                    const count = tickets.filter(t => t.status === status).length;
                    const statusTitle = status.replace(/-/g, ' ');
                    
                    return (
                      <div key={status} className="flex flex-col items-center">
                        <div className={`w-full h-1 ${StatusColor[status]} rounded-full mb-1`}></div>
                        <span className="text-xs text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
                
                <Button onClick={() => navigate(`/board/${projectId}`)} className="w-full">
                  View Board
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-5 h-5" />
                <span>Recent Tickets</span>
              </CardTitle>
              <CardDescription>Latest updates</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="p-3 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{ticket.key}</Badge>
                        <Badge variant="outline" className={`text-xs ${StatusColor[ticket.status]}`}>
                          {ticket.status.replace(/-/g, ' ')}
                        </Badge>
                      </div>
                      {ticket.assignee && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                          <AvatarFallback>{ticket.assignee.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <Link to={`/board/${projectId}`} className="text-sm font-medium hover:text-primary transition-colors">
                      {ticket.summary}
                    </Link>
                  </div>
                ))}
                
                {tickets.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    No tickets found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Team</span>
              </CardTitle>
              <CardDescription>Project members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {isCreateModalOpen && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          project={project}
          column="todo"
          onTicketCreate={handleCreateTicket}
        />
      )}
    </Layout>
  );
};

export default Project;

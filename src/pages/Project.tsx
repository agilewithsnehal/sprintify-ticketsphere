import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import ProjectHeader from '@/components/ProjectHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, CheckCircle2, Clock, ListChecks, TicketCheck, Users, Trash2 } from 'lucide-react';
import { supabaseService } from '@/lib/supabase-service';
import { Project, Ticket } from '@/lib/types';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleting, setIsDeleting] = useState(false);

  const isValidUuid = (id) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };

  const { 
    data: project, 
    isLoading: isLoadingProject,
    isError: isProjectError
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      try {
        if (!isValidUuid(projectId)) {
          toast.error('Invalid project ID format');
          return null;
        }
        
        return await supabaseService.getProjectById(projectId);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Could not load project details');
        return null;
      }
    },
  });
  
  const { 
    data: tickets = [], 
    isLoading: isLoadingTickets 
  } = useQuery({
    queryKey: ['tickets', projectId],
    queryFn: async () => {
      if (!projectId || !isValidUuid(projectId)) return [];
      
      try {
        return await supabaseService.getTicketsByProjectId(projectId);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        return [];
      }
    },
    enabled: !!projectId && isValidUuid(projectId)
  });

  const { 
    data: allProjects = [], 
    isLoading: isLoadingAllProjects 
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        return await supabaseService.getAllProjects();
      } catch (error) {
        console.error('Error fetching all projects:', error);
        return [];
      }
    },
    enabled: activeTab === 'projects'
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    
    setIsDeleting(true);
    try {
      const success = await supabaseService.deleteProject(projectId);
      if (success) {
        toast.success('Project deleted successfully');
        navigate('/');
      } else {
        toast.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('An error occurred while deleting the project');
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isLoadingProject || isLoadingTickets || (activeTab === 'projects' && isLoadingAllProjects);

  if (!projectId) {
    navigate('/');
    return null;
  }

  if (!isValidUuid(projectId)) {
    return (
      <Layout>
        <div className="px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid Project ID</h2>
          <p className="text-muted-foreground mb-4">The project ID format is not valid. Please check the URL and try again.</p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  if (isProjectError || (project === null && !isLoadingProject)) {
    return (
      <Layout>
        <div className="px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading || !project) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-secondary"></div>
            <div className="h-6 w-48 bg-secondary rounded-md"></div>
          </div>
          <div className="h-[40vh] bg-secondary rounded-md"></div>
        </div>
      </Layout>
    );
  }

  const ticketsByStatus = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || []).concat(ticket);
    return acc;
  }, {} as Record<string, Ticket[]>);

  const statusCounts = {
    todo: ticketsByStatus.todo?.length || 0,
    'in-progress': ticketsByStatus['in-progress']?.length || 0,
    review: ticketsByStatus.review?.length || 0,
    done: ticketsByStatus.done?.length || 0,
    backlog: ticketsByStatus.backlog?.length || 0,
  };

  const totalTickets = tickets.length;
  const completedTickets = statusCounts.done;
  const completionPercentage = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ProjectHeader project={project} />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1">
              <Trash2 className="h-4 w-4" />
              Delete Project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project
                "{project?.name}" and all associated tickets and data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="members">Team</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Status Overview</CardTitle>
                <CardDescription>Ticket distribution by status</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Backlog
                    </span>
                    <span className="font-medium">{statusCounts.backlog}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-muted-foreground" />
                      To Do
                    </span>
                    <span className="font-medium">{statusCounts.todo}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      In Progress
                    </span>
                    <span className="font-medium">{statusCounts['in-progress']}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <TicketCheck className="h-4 w-4 text-muted-foreground" />
                      Review
                    </span>
                    <span className="font-medium">{statusCounts.review}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      Done
                    </span>
                    <span className="font-medium">{statusCounts.done}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Team Members</CardTitle>
                <CardDescription>People working on this project</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mt-4 space-y-3">
                  {project.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full gap-1">
                  <Users className="h-4 w-4" />
                  View All Members
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Completion</CardTitle>
                <CardDescription>Project progress overview</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mt-4 flex flex-col items-center justify-center gap-2">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle
                        className="text-secondary stroke-current"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      />
                      <circle
                        className="text-primary stroke-current"
                        strokeWidth="10"
                        strokeLinecap="round"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        strokeDasharray={`${completionPercentage * 2.51} 251`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold">{completionPercentage}%</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {completedTickets} of {totalTickets} tickets completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Recently updated tickets in this project</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {tickets.length > 0 ? (
                  tickets
                    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                    .slice(0, 5)
                    .map((ticket) => (
                      <div key={ticket.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">{ticket.key}</span>
                              <Badge variant="outline" className="capitalize text-xs">{ticket.priority}</Badge>
                              <Badge variant="outline" className="capitalize text-xs">{ticket.status.replace(/-/g, ' ')}</Badge>
                            </div>
                            <Link to={`/board/${projectId}/ticket/${ticket.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                              {ticket.summary}
                            </Link>
                          </div>
                          {ticket.assignee && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                              <AvatarFallback>{ticket.assignee.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No tickets found in this project.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/board/${projectId}`)}>
                View All Tickets
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="board">
          <div className="text-center py-10">
            <h3 className="text-xl font-medium mb-4">Project Board</h3>
            <p className="text-muted-foreground mb-6">View and manage all tickets for this project in a Kanban board view.</p>
            <Button variant="default" onClick={() => navigate(`/board/${projectId}`)} className="px-8">
              Go to Board View
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoadingAllProjects ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-[150px] bg-secondary rounded-md"></div>
                </div>
              ))
            ) : allProjects.length > 0 ? (
              allProjects.map((proj) => (
                <motion.div
                  key={proj.id}
                  whileHover={{ y: -5 }}
                  className="transition-all duration-200"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{proj.name}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">{proj.description}</CardDescription>
                        </div>
                        <Badge variant="outline">{proj.key}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {proj.members.slice(0, 3).map((member) => (
                            <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {proj.members.length > 3 && (
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-muted-foreground text-xs border-2 border-background">
                              +{proj.members.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/project/${proj.id}`)}
                      >
                        View Project
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <h3 className="text-lg font-medium">No projects found</h3>
                <p className="text-muted-foreground">Create your first project to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>People working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-md bg-accent/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge className="capitalize">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default ProjectPage;

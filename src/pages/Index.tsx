import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import CreateTicketModal from '@/components/CreateTicketModal';
import ProjectModal from '@/components/ProjectModal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BarChart3, CalendarRange, CheckCircle, Clock, ListTodo, Plus, Search, TicketPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase-service';
import { Project, Ticket, User } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

const Index = () => {
  const navigate = useNavigate();
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Fetch all projects and tickets with React Query
  const { data: projects = [], isLoading: isLoadingProjects, refetch: refetchProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => await supabaseService.getAllProjects(),
  });
  
  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => await supabaseService.getAllTickets(),
  });

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Filter projects and tickets based on search query
  const filteredProjects = projects.filter(project => 
    searchQuery === '' || 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.key.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredTickets = tickets.filter(ticket => 
    searchQuery === '' || 
    ticket.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.key.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const myTickets = filteredTickets.filter(ticket => ticket.assignee?.id === currentUser?.id);
  const recentTickets = [...filteredTickets].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5);
  
  // Count tickets by status
  const ticketStatusCount = filteredTickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
  };
  
  const statusIcons = {
    'backlog': Clock,
    'todo': ListTodo,
    'in-progress': BarChart3,
    'review': CalendarRange,
    'done': CheckCircle,
  };

  const handleCreateTicket = async (ticket: Ticket) => {
    try {
      const createdTicket = await supabaseService.createTicket(ticket);
      if (createdTicket) {
        toast.success('Ticket created successfully');
        navigate(`/board/${ticket.project.id}`);
      } else {
        toast.error('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  const isLoading = isLoadingProjects || isLoadingTickets;

  const handleCreateProject = () => {
    setIsCreateProjectModalOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse space-y-4 w-full max-w-3xl">
            <div className="h-8 bg-secondary rounded-md w-1/3"></div>
            <div className="h-4 bg-secondary rounded-md w-2/3"></div>
            <div className="h-64 bg-secondary rounded-md w-full mt-8"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {currentUser?.name || 'User'}</p>
          </div>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects, tickets..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="gap-1"
              onClick={() => setIsCreateTicketModalOpen(true)}
              disabled={projects.length === 0}
            >
              <TicketPlus className="h-4 w-4" />
              Create Ticket
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            className="col-span-1 md:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Projects</CardTitle>
                <CardDescription>Your recent projects</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <Link 
                      key={project.id} 
                      to={`/project/${project.id}`}
                      className="block group"
                    >
                      <motion.div 
                        className="glass-card p-4 rounded-xl group-hover:shadow-hover transition-all duration-200"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium group-hover:text-primary transition-colors">{project.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                          </div>
                          <Badge variant="outline">{project.key}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex -space-x-2">
                            {project.members.slice(0, 3).map((member) => (
                              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                            ))}
                            {project.members.length > 3 && (
                              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs font-medium border-2 border-background">
                                +{project.members.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {tickets.filter(t => t.project.id === project.id).length} tickets
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  ))
                ) : searchQuery ? (
                  <div className="col-span-2 py-8 text-center text-muted-foreground">
                    No projects found matching "{searchQuery}".
                  </div>
                ) : (
                  <div className="col-span-2 py-8 text-center text-muted-foreground">
                    No projects found.
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-1"
                  onClick={handleCreateProject}
                >
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updated tickets</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentTickets.length > 0 ? (
                    recentTickets.map((ticket, i) => (
                      <motion.div 
                        key={ticket.id}
                        className="p-4 hover:bg-accent/50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">{ticket.key}</span>
                              <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <Link to={`/board/${ticket.project.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                              {ticket.summary}
                            </Link>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                              <span>
                                Updated {new Intl.DateTimeFormat('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                }).format(ticket.updatedAt)}
                              </span>
                              <span className="mx-1">•</span>
                              <span>{ticket.project.name}</span>
                            </div>
                          </div>
                          {ticket.assignee && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                              <AvatarFallback>{ticket.assignee.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : searchQuery ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No recent activity found matching "{searchQuery}".
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No recent activity found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>Assigned to you</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {myTickets.length > 0 ? (
                    myTickets.map((ticket, i) => (
                      <motion.div 
                        key={ticket.id}
                        className="p-4 hover:bg-accent/50 transition-colors"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">{ticket.key}</span>
                          <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <Link to={`/board/${ticket.project.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                          {ticket.summary}
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      You don't have any assigned tickets.
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full">View all tickets</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Overview</CardTitle>
                <CardDescription>Ticket status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(ticketStatusCount).length > 0 ? (
                    Object.entries(ticketStatusCount).map(([status, count], i) => {
                      const StatusIcon = statusIcons[status as keyof typeof statusIcons];
                      const percentage = Math.round((count / filteredTickets.length) * 100);
                      
                      return (
                        <motion.div 
                          key={status}
                          className="space-y-1"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.05 }}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <StatusIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="capitalize">{status.replace(/-/g, ' ')}</span>
                            </div>
                            <div className="font-medium">{count}</div>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No ticket data available.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      {isCreateTicketModalOpen && projects.length > 0 && (
        <CreateTicketModal 
          isOpen={isCreateTicketModalOpen}
          onClose={() => setIsCreateTicketModalOpen(false)}
          project={projects[0]} // Default to first project
          column="todo" // Default to "todo" status
          onTicketCreate={handleCreateTicket}
        />
      )}

      {isCreateProjectModalOpen && (
        <ProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setIsCreateProjectModalOpen(false)}
        />
      )}
    </Layout>
  );
};

export default Index;

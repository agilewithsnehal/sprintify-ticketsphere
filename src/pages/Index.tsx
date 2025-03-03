import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import CreateTicketModal from '@/components/CreateTicketModal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BarChart3, CalendarRange, CheckCircle, Clock, ListTodo, Plus, TicketPlus } from 'lucide-react';
import { getAllTickets, projects, users } from '@/lib/data';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  
  const tickets = getAllTickets();
  const myTickets = tickets.filter(ticket => ticket.assignee?.id === users[0].id);
  const recentTickets = [...tickets].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5);
  
  // Count tickets by status
  const ticketStatusCount = tickets.reduce((acc, ticket) => {
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

  const handleCreateTicket = (ticket) => {
    toast.success('Ticket created successfully');
    navigate(`/board/${ticket.project.id}`);
  };

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
            <p className="text-muted-foreground">Welcome back, {users[0].name}</p>
          </div>
          <Button 
            className="gap-1"
            onClick={() => setIsCreateTicketModalOpen(true)}
          >
            <TicketPlus className="h-4 w-4" />
            Create Ticket
          </Button>
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
                {projects.map((project) => (
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
                ))}
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-1">
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
                  {recentTickets.map((ticket, i) => (
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
                  ))}
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
                  {Object.entries(ticketStatusCount).map(([status, count], i) => {
                    const StatusIcon = statusIcons[status as keyof typeof statusIcons];
                    const percentage = Math.round((count / tickets.length) * 100);
                    
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
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      {isCreateTicketModalOpen && (
        <CreateTicketModal 
          isOpen={isCreateTicketModalOpen}
          onClose={() => setIsCreateTicketModalOpen(false)}
          project={projects[0]} // Default to first project
          column="todo" // Default to "todo" status
          onTicketCreate={handleCreateTicket}
        />
      )}
    </Layout>
  );
};

export default Index;

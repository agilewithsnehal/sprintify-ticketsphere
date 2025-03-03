
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import ProjectHeader from '@/components/ProjectHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getProjectById, getTicketsByProject } from '@/lib/data';
import { Project as ProjectType, Ticket } from '@/lib/types';
import { BarChart3, CheckCircle, Clock, Info, ListTodo, MessageSquare, Users } from 'lucide-react';

const Project = () => {
  const { projectId = '1' } = useParams();
  const [project, setProject] = useState<ProjectType | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get project data
    const fetchData = async () => {
      setIsLoading(true);
      
      // Add a small delay to simulate loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const projectData = getProjectById(projectId);
      if (projectData) {
        setProject(projectData);
        setTickets(getTicketsByProject(projectId));
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [projectId]);

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
  };
  
  const statusCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusIcons = {
    'backlog': Clock,
    'todo': ListTodo,
    'in-progress': BarChart3,
    'review': MessageSquare,
    'done': CheckCircle,
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

  if (!project) {
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
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="gap-1">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1">
            <ListTodo className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
                <CardDescription>Overview of the project status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(statusCounts).map(([status, count], i) => {
                      const StatusIcon = statusIcons[status as keyof typeof statusIcons];
                      
                      return (
                        <motion.div 
                          key={status}
                          className="glass-card p-4 rounded-xl"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <StatusIcon className="h-5 w-5 text-muted-foreground" />
                            <span className="text-2xl font-semibold">{count}</span>
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {status.replace(/-/g, ' ')}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Status Distribution</h3>
                    <div className="h-3 bg-secondary rounded-full flex overflow-hidden">
                      {Object.entries(statusCounts).map(([status, count], i) => {
                        const percentage = (count / tickets.length) * 100;
                        let color = '';
                        
                        switch (status) {
                          case 'backlog':
                            color = 'bg-gray-400';
                            break;
                          case 'todo':
                            color = 'bg-blue-400';
                            break;
                          case 'in-progress':
                            color = 'bg-purple-400';
                            break;
                          case 'review':
                            color = 'bg-yellow-400';
                            break;
                          case 'done':
                            color = 'bg-green-400';
                            break;
                          default:
                            color = 'bg-gray-400';
                        }
                        
                        return (
                          <motion.div
                            key={status}
                            className={`h-full ${color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Project Description</h3>
                    <p className="text-sm">{project.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
                <CardDescription>Project members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.members.map((member, i) => (
                    <motion.div 
                      key={member.id}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                      </div>
                      {member.id === project.lead.id && (
                        <Badge variant="outline" className="ml-auto text-xs">Lead</Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updated tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {tickets
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .slice(0, 5)
                  .map((ticket, i) => (
                    <motion.div 
                      key={ticket.id}
                      className="py-3 first:pt-0 last:pb-0"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">{ticket.key}</span>
                            <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <Link to={`/board/${project.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                            {ticket.summary}
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                          }).format(ticket.updatedAt)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tickets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Tickets</CardTitle>
              <CardDescription>All tickets in this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {tickets.length > 0 ? (
                  tickets.map((ticket, i) => (
                    <motion.div 
                      key={ticket.id}
                      className="py-4 first:pt-0"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">{ticket.key}</span>
                            <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <h3 className="font-medium">{ticket.summary}</h3>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>
                                {new Intl.DateTimeFormat('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                }).format(ticket.createdAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              <span>{ticket.comments.length}</span>
                            </div>
                            
                            <Badge variant="secondary" className="capitalize text-xs px-2 py-0 h-5">
                              {ticket.status.replace(/-/g, ' ')}
                            </Badge>
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
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No tickets found in this project.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>People working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {project.members.map((member, i) => (
                  <motion.div 
                    key={member.id}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <div className="text-sm text-muted-foreground flex items-center space-x-2">
                            <span className="capitalize">{member.role}</span>
                            {member.id === project.lead.id && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">Project Lead</Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tickets.filter(ticket => ticket.assignee?.id === member.id).length} assigned tickets
                        </div>
                      </div>
                      
                      {tickets.filter(ticket => ticket.assignee?.id === member.id).length > 0 && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tickets
                            .filter(ticket => ticket.assignee?.id === member.id)
                            .slice(0, 4)
                            .map(ticket => (
                              <div key={ticket.id} className="text-sm flex items-center space-x-2">
                                <span className="text-xs font-medium text-muted-foreground">{ticket.key}</span>
                                <span className="truncate">{ticket.summary}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Project;

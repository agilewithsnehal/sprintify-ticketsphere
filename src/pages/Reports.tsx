
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabaseService } from '@/lib/supabase'; // Updated import
import { Status, Priority, Ticket } from '@/lib/types';
import { BarChart3, PieChart as PieChartIcon, LineChart, Download } from 'lucide-react';
import { toast } from 'sonner';

const Reports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('status');
  
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['allTickets'],
    queryFn: async () => {
      return await supabaseService.getAllTickets();
    },
  });
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Reports</h1>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error || !tickets) {
    return (
      <Layout>
        <div className="container mx-auto p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Reports</h1>
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Reports</CardTitle>
              <CardDescription>Unable to load ticket data for reporting</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="mb-4 text-muted-foreground">
                There was an error fetching the data needed to generate reports.
              </p>
              <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Process data for status report
  const statusCounts = tickets.reduce((acc, ticket) => {
    const status = ticket.status.replace(/-/g, ' ');
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const statusData = Object.keys(statusCounts).map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: statusCounts[status]
  }));
  
  // Process data for priority report
  const priorityCounts = tickets.reduce((acc, ticket) => {
    const priority = ticket.priority;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});
  
  const priorityData = Object.keys(priorityCounts).map(priority => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: priorityCounts[priority]
  }));
  
  // Process data for project distribution
  const projectCounts = tickets.reduce((acc, ticket) => {
    const projectName = ticket.project.name;
    acc[projectName] = (acc[projectName] || 0) + 1;
    return acc;
  }, {});
  
  const projectData = Object.keys(projectCounts).map(project => ({
    name: project,
    value: projectCounts[project]
  }));
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  const handleExportData = () => {
    try {
      let dataToExport;
      let filename;
      
      switch (activeTab) {
        case 'status':
          dataToExport = statusData;
          filename = 'ticket-status-report.json';
          break;
        case 'priority':
          dataToExport = priorityData;
          filename = 'ticket-priority-report.json';
          break;
        case 'project':
          dataToExport = projectData;
          filename = 'ticket-project-report.json';
          break;
        default:
          dataToExport = tickets;
          filename = 'all-tickets-report.json';
      }
      
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      
      toast.success('Report data exported successfully');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export report data');
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Reports</h1>
          <Button 
            variant="outline" 
            onClick={handleExportData}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Export Data
          </Button>
        </div>
        
        <Tabs defaultValue="status" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid grid-cols-3 sm:w-[400px]">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="priority" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Priority
            </TabsTrigger>
            <TabsTrigger value="project" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Projects
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>Distribution of tickets across different status categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statusData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Number of Tickets" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Total tickets: {tickets.length}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="priority">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Priority</CardTitle>
                <CardDescription>Distribution of tickets across different priority levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Total tickets: {tickets.length}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="project">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Project</CardTitle>
                <CardDescription>Distribution of tickets across different projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Number of Tickets" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Total projects: {projectData.length}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;

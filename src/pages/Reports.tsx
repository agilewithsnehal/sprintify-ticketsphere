import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart as RechartsLineChart, Line } from 'recharts';
import { supabaseService } from '@/lib/supabase';
import { Status, Priority, Ticket } from '@/lib/types';
import { BarChart3, PieChartIcon, LineChart, Download, Clock, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { calculateCycleTime, calculateLeadTime } from '@/lib/metrics';

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
  
  const statusCounts = tickets.reduce((acc, ticket) => {
    const status = ticket.status.replace(/-/g, ' ');
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const statusData = Object.keys(statusCounts).map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: statusCounts[status]
  }));
  
  const priorityCounts = tickets.reduce((acc, ticket) => {
    const priority = ticket.priority;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});
  
  const priorityData = Object.keys(priorityCounts).map(priority => ({
    name: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: priorityCounts[priority]
  }));
  
  const projectCounts = tickets.reduce((acc, ticket) => {
    const projectName = ticket.project.name;
    acc[projectName] = (acc[projectName] || 0) + 1;
    return acc;
  }, {});
  
  const projectData = Object.keys(projectCounts).map(project => ({
    name: project,
    value: projectCounts[project]
  }));
  
  const completedTickets = tickets.filter(ticket => ticket.status === 'done');
  
  const cycleTimeData = completedTickets.map(ticket => {
    const cycleTime = calculateCycleTime(ticket);
    return {
      key: ticket.key,
      name: ticket.key,
      days: cycleTime,
      summary: ticket.summary
    };
  }).sort((a, b) => b.days - a.days).slice(0, 10);
  
  const leadTimeData = completedTickets.map(ticket => {
    const leadTime = calculateLeadTime(ticket);
    return {
      key: ticket.key,
      name: ticket.key,
      days: leadTime,
      summary: ticket.summary
    };
  }).sort((a, b) => b.days - a.days).slice(0, 10);
  
  const avgCycleTime = cycleTimeData.length > 0 
    ? (cycleTimeData.reduce((sum, item) => sum + item.days, 0) / cycleTimeData.length).toFixed(1)
    : 'N/A';
    
  const avgLeadTime = leadTimeData.length > 0 
    ? (leadTimeData.reduce((sum, item) => sum + item.days, 0) / leadTimeData.length).toFixed(1)
    : 'N/A';
  
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
        case 'cycletime':
          dataToExport = cycleTimeData;
          filename = 'ticket-cycletime-report.json';
          break;
        case 'leadtime':
          dataToExport = leadTimeData;
          filename = 'ticket-leadtime-report.json';
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
          <TabsList className="mb-6 grid grid-cols-5 sm:w-[600px]">
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
            <TabsTrigger value="cycletime" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Cycle Time
            </TabsTrigger>
            <TabsTrigger value="leadtime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Lead Time
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
          
          <TabsContent value="cycletime">
            <Card>
              <CardHeader>
                <CardTitle>Cycle Time</CardTitle>
                <CardDescription>Time taken for tickets to move from in-progress to done (average: {avgCycleTime} days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={cycleTimeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                      />
                      <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} days`, 'Cycle Time'
                        ]}
                        labelFormatter={(label, props) => {
                          const item = props[0]?.payload;
                          return item ? `${item.key}: ${item.summary}` : label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="days" name="Cycle Time (days)" fill="#4C86A8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Cycle Time: Time taken from when work begins on a ticket (in-progress) until it's completed (done)</p>
                  <p className="mt-2">Total completed tickets: {completedTickets.length}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leadtime">
            <Card>
              <CardHeader>
                <CardTitle>Lead Time</CardTitle>
                <CardDescription>Time taken from ticket creation to completion (average: {avgLeadTime} days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={leadTimeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                      />
                      <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} days`, 'Lead Time'
                        ]}
                        labelFormatter={(label, props) => {
                          const item = props[0]?.payload;
                          return item ? `${item.key}: ${item.summary}` : label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="days" name="Lead Time (days)" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Lead Time: Total time from when a ticket is created until it's completed (done)</p>
                  <p className="mt-2">Total completed tickets: {completedTickets.length}</p>
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

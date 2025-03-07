
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Project, Status, Ticket } from '@/lib/types';
import { 
  calculateCycleTime, 
  calculateLeadTime, 
  calculateWIP, 
  calculateThroughput, 
  calculateFlowEfficiency,
  calculateFlowDistribution,
  calculateWorkItemAge
} from '@/lib/metrics';
import { Clock, Timer, GitPullRequestDraft, BarChart, Workflow } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ProjectReportsTabProps {
  project: Project;
  tickets: Ticket[];
}

const ProjectReportsTab: React.FC<ProjectReportsTabProps> = ({ project, tickets }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const ticketsByStatus = tickets.reduce((acc, ticket) => {
    const status = ticket.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(ticket);
    return acc;
  }, {} as Record<Status, Ticket[]>);

  // Calculate cycle and lead times for completed tickets in this project
  const completedTickets = tickets.filter(ticket => ticket.status === 'done');
  
  const avgCycleTime = completedTickets.length > 0
    ? (completedTickets.reduce((sum, ticket) => sum + calculateCycleTime(ticket), 0) / completedTickets.length).toFixed(1)
    : 'N/A';
    
  const avgLeadTime = completedTickets.length > 0
    ? (completedTickets.reduce((sum, ticket) => sum + calculateLeadTime(ticket), 0) / completedTickets.length).toFixed(1)
    : 'N/A';
    
  // Calculate flow metrics
  const wipCount = calculateWIP(tickets);
  const throughput = calculateThroughput(tickets, 7); // 7-day throughput
  const flowEfficiency = calculateFlowEfficiency(tickets).toFixed(1);
  
  // Oldest items by status
  const oldestByStatus = Object.entries(ticketsByStatus).reduce((acc, [status, statusTickets]) => {
    if (statusTickets.length === 0 || status === 'done') return acc;
    
    statusTickets.sort((a, b) => 
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
    
    acc[status as Status] = {
      ticket: statusTickets[0],
      age: calculateWorkItemAge(statusTickets[0])
    };
    
    return acc;
  }, {} as Record<Status, { ticket: Ticket, age: number }>);
  
  // Chart data
  const flowDistribution = calculateFlowDistribution(tickets);
  const distributionData = Object.entries(flowDistribution).map(([status, percentage]) => ({
    name: status.replace(/-/g, ' '),
    value: parseFloat(percentage.toFixed(1))
  }));
  
  const cycleTimeData = completedTickets
    .map(ticket => ({
      key: ticket.key,
      days: calculateCycleTime(ticket),
      summary: ticket.summary
    }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);
    
  const leadTimeData = completedTickets
    .map(ticket => ({
      key: ticket.key,
      days: calculateLeadTime(ticket),
      summary: ticket.summary
    }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);
    
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Analytics and statistics for {project.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="flow">Flow Metrics</TabsTrigger>
            <TabsTrigger value="cycle">Cycle Time</TabsTrigger>
            <TabsTrigger value="lead">Lead Time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
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
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Cycle Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Average Cycle Time</span>
                      <span className="font-medium">{avgCycleTime} days</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Time from when work begins on a ticket until completion
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Lead Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Average Lead Time</span>
                      <span className="font-medium">{avgLeadTime} days</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total time from ticket creation to completion
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="flow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GitPullRequestDraft className="h-4 w-4" />
                    Flow Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Work in Progress (WIP)</span>
                      <span className="font-medium">{wipCount} tickets</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Weekly Throughput</span>
                      <span className="font-medium">{throughput} tickets/week</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Flow Efficiency</span>
                      <span className="font-medium">{flowEfficiency}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Flow efficiency = Value-add time / Total time
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Workflow className="h-4 w-4" />
                    Work Item Age
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(oldestByStatus).map(([status, data]) => (
                      <div key={status} className="text-sm">
                        <div className="flex justify-between items-center">
                          <span className="capitalize">{status.replace(/-/g, ' ')}</span>
                          <span className="font-medium">{data.age.toFixed(1)} days</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{data.ticket.key}: {data.ticket.summary}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Flow Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="cycle">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Cycle Time Analysis
                  </CardTitle>
                  <CardDescription>
                    Time from when work begins until completion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={cycleTimeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="key" />
                        <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value) => [`${value} days`, 'Cycle Time']}
                          labelFormatter={(label) => {
                            const item = cycleTimeData.find(d => d.key === label);
                            return item ? `${label}: ${item.summary}` : label;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="days" name="Cycle Time (days)" fill="#4C86A8" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Average Cycle Time</h3>
                      <p className="text-xl font-bold">{avgCycleTime} days</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Highest Cycle Times</h3>
                      <div className="space-y-2">
                        {cycleTimeData.map(item => (
                          <div key={item.key} className="flex justify-between items-center text-sm">
                            <span>{item.key}: {item.summary}</span>
                            <span className="font-medium">{item.days.toFixed(1)} days</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="lead">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Lead Time Analysis
                  </CardTitle>
                  <CardDescription>
                    Total time from when a ticket is created until completion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={leadTimeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="key" />
                        <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          formatter={(value) => [`${value} days`, 'Lead Time']}
                          labelFormatter={(label) => {
                            const item = leadTimeData.find(d => d.key === label);
                            return item ? `${label}: ${item.summary}` : label;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="days" name="Lead Time (days)" fill="#8884d8" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Average Lead Time</h3>
                      <p className="text-xl font-bold">{avgLeadTime} days</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Highest Lead Times</h3>
                      <div className="space-y-2">
                        {leadTimeData.map(item => (
                          <div key={item.key} className="flex justify-between items-center text-sm">
                            <span>{item.key}: {item.summary}</span>
                            <span className="font-medium">{item.days.toFixed(1)} days</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectReportsTab;

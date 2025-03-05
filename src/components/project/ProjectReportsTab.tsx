
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Project, Status, Ticket } from '@/lib/types';
import { calculateCycleTime, calculateLeadTime } from '@/lib/metrics';
import { Clock, Timer } from 'lucide-react';

interface ProjectReportsTabProps {
  project: Project;
  tickets: Ticket[];
}

const ProjectReportsTab: React.FC<ProjectReportsTabProps> = ({ project, tickets }) => {
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

  return (
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
      </CardContent>
    </Card>
  );
};

export default ProjectReportsTab;

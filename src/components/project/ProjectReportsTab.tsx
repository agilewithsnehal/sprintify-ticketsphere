
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Project, Status, Ticket } from '@/lib/types';

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
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectReportsTab;

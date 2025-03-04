
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/lib/types';

interface ProjectMembersTabProps {
  project: Project;
}

const ProjectMembersTab: React.FC<ProjectMembersTabProps> = ({ project }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Members working on {project.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {project.members.map(member => (
            <div key={member.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="text-sm font-medium text-muted-foreground capitalize">{member.role}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectMembersTab;

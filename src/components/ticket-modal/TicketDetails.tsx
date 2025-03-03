
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Ticket, Priority, Status } from '@/lib/types';
import { priorityColors, statusColors } from './constants';

interface TicketDetailsProps {
  ticket: Ticket;
  formattedDate: string;
  isEditing: boolean;
  handleEditToggle: () => void;
  handleStatusChange: (status: Status) => void;
  handlePriorityChange: (priority: Priority) => void;
  handleAssigneeChange: (userId: string) => void;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  formattedDate,
  isEditing,
  handleEditToggle,
  handleStatusChange,
  handlePriorityChange,
  handleAssigneeChange,
}) => {
  return (
    <div className="col-span-1 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Assignee</span>
            <div className="w-32">
              <Select 
                value={ticket.assignee?.id || ''} 
                onValueChange={handleAssigneeChange}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Unassigned">
                    {ticket.assignee ? (
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                          <AvatarFallback>{ticket.assignee.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{ticket.assignee.name}</span>
                      </div>
                    ) : 'Unassigned'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {ticket.project.members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reporter</span>
            <div className="flex items-center space-x-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={ticket.reporter.avatar} alt={ticket.reporter.name} />
                <AvatarFallback>{ticket.reporter.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <span>{ticket.reporter.name}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Priority</span>
            <div className="w-32">
              <Select 
                value={ticket.priority} 
                onValueChange={(value: Priority) => handlePriorityChange(value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue>
                    <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge variant="outline" className={`text-xs ${priorityColors.low}`}>
                      low
                    </Badge>
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge variant="outline" className={`text-xs ${priorityColors.medium}`}>
                      medium
                    </Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge variant="outline" className={`text-xs ${priorityColors.high}`}>
                      high
                    </Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <div className="w-32">
              <Select 
                value={ticket.status} 
                onValueChange={(value: Status) => handleStatusChange(value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue>
                    <Badge variant="outline" className={`text-xs ${statusColors[ticket.status]}`}>
                      {ticket.status.replace(/-/g, ' ')}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">
                    <Badge variant="outline" className={`text-xs ${statusColors.backlog}`}>
                      backlog
                    </Badge>
                  </SelectItem>
                  <SelectItem value="todo">
                    <Badge variant="outline" className={`text-xs ${statusColors.todo}`}>
                      to do
                    </Badge>
                  </SelectItem>
                  <SelectItem value="in-progress">
                    <Badge variant="outline" className={`text-xs ${statusColors["in-progress"]}`}>
                      in progress
                    </Badge>
                  </SelectItem>
                  <SelectItem value="review">
                    <Badge variant="outline" className={`text-xs ${statusColors.review}`}>
                      review
                    </Badge>
                  </SelectItem>
                  <SelectItem value="done">
                    <Badge variant="outline" className={`text-xs ${statusColors.done}`}>
                      done
                    </Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created</span>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Actions</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={handleEditToggle}
          >
            <Edit className="h-3.5 w-3.5 mr-2" />
            {isEditing ? 'Cancel edit' : 'Edit'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;

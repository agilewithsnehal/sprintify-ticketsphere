
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket, Status, Priority, IssueType } from '@/lib/types';
import { 
  priorityOptions, 
  statusOptions, 
  priorityColors,
  statusColors,
  issueTypeOptions,
  issueTypeColors 
} from './constants';
import { Trash2 } from 'lucide-react';

interface TicketDetailsProps {
  ticket: Ticket;
  formattedDate: string;
  isEditing: boolean;
  handleEditToggle: () => void;
  handleStatusChange: (status: Status) => void;
  handlePriorityChange: (priority: Priority) => void;
  handleIssueTypeChange?: (issueType: IssueType) => void;
  handleAssigneeChange: (assigneeId: string) => void;
  onTicketDelete?: () => void;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  formattedDate,
  isEditing,
  handleEditToggle,
  handleStatusChange,
  handlePriorityChange,
  handleIssueTypeChange,
  handleAssigneeChange,
  onTicketDelete
}) => {
  return (
    <div className="space-y-5 border-l pl-5">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm">Ticket Details</h3>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleEditToggle}
            className="text-xs"
          >
            Edit
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          {isEditing ? (
            <Select
              value={ticket.status}
              onValueChange={(value: Status) => handleStatusChange(value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className={`text-sm font-medium ${statusColors[ticket.status]}`}>
              {statusOptions.find(o => o.value === ticket.status)?.label || 'Unknown'}
            </p>
          )}
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground mb-1">Priority</p>
          {isEditing ? (
            <Select
              value={ticket.priority}
              onValueChange={(value: Priority) => handlePriorityChange(value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className={`text-sm font-medium ${priorityColors[ticket.priority]}`}>
              {priorityOptions.find(o => o.value === ticket.priority)?.label || 'Unknown'}
            </p>
          )}
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground mb-1">Issue Type</p>
          {isEditing && handleIssueTypeChange ? (
            <Select
              value={ticket.issueType || 'task'}
              onValueChange={(value: IssueType) => handleIssueTypeChange(value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {issueTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className={`text-sm font-medium ${issueTypeColors[ticket.issueType || 'task']}`}>
              {issueTypeOptions.find(o => o.value === (ticket.issueType || 'task'))?.label || 'Task'}
            </p>
          )}
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground mb-1">Assignee</p>
          {isEditing ? (
            <Select
              value={ticket.assignee?.id || 'unassigned'}
              onValueChange={(value) => handleAssigneeChange(value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {ticket.project.members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm">
              {ticket.assignee ? ticket.assignee.name : 'Unassigned'}
            </p>
          )}
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground mb-1">Reporter</p>
          <p className="text-sm">{ticket.reporter.name}</p>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground mb-1">Created</p>
          <p className="text-sm">{formattedDate}</p>
        </div>
        
        {onTicketDelete && (
          <div className="pt-4">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onTicketDelete}
              className="w-full text-xs"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Ticket
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetails;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, Save, Trash2 } from 'lucide-react';
import { Ticket, Status, Priority } from '@/lib/types';
import { priorityOptions, statusOptions } from './constants';

interface TicketDetailsProps {
  ticket: Ticket;
  formattedDate: string;
  isEditing: boolean;
  handleEditToggle: () => void;
  handleStatusChange: (status: Status) => void;
  handlePriorityChange: (priority: Priority) => void;
  handleAssigneeChange: (userId: string) => void;
  onTicketDelete?: () => void;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  formattedDate,
  isEditing,
  handleEditToggle,
  handleStatusChange,
  handlePriorityChange,
  handleAssigneeChange,
  onTicketDelete
}) => {
  return (
    <div className="col-span-1 space-y-6">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-muted-foreground">Ticket Details</h3>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleEditToggle}
            >
              {isEditing ? <Save className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            </Button>
            
            {onTicketDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={onTicketDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-4 mt-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            {isEditing ? (
              <Select 
                value={ticket.status} 
                onValueChange={(value) => handleStatusChange(value as Status)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm capitalize">{ticket.status.replace(/-/g, ' ')}</div>
            )}
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-1">Priority</div>
            {isEditing ? (
              <Select 
                value={ticket.priority} 
                onValueChange={(value) => handlePriorityChange(value as Priority)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm capitalize">{ticket.priority}</div>
            )}
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-1">Assignee</div>
            {isEditing ? (
              <Select 
                value={ticket.assignee?.id || 'unassigned'} 
                onValueChange={handleAssigneeChange}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {ticket.project.members.map(member => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center">
                {ticket.assignee ? (
                  <>
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                      <AvatarFallback>{ticket.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{ticket.assignee.name}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </div>
            )}
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-1">Reporter</div>
            <div className="flex items-center">
              <Avatar className="h-5 w-5 mr-2">
                <AvatarImage src={ticket.reporter.avatar} alt={ticket.reporter.name} />
                <AvatarFallback>{ticket.reporter.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{ticket.reporter.name}</span>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-muted-foreground mb-1">Created</div>
            <div className="text-sm">{formattedDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;

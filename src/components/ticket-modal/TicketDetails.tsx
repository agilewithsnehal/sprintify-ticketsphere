import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket, Status, Priority, IssueType, User } from '@/lib/types';
import { 
  priorityOptions, 
  statusOptions, 
  priorityColors,
  statusColors,
  issueTypeOptions,
  issueTypeColors 
} from './constants';
import { Trash2, Link, ExternalLink } from 'lucide-react';
import { supabaseService } from '@/lib/supabase';
import { IssueTypeIcon } from '../ticket-form/IssueTypeIcon';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableAssignees, setAvailableAssignees] = useState<User[]>([]);
  const [parentTicket, setParentTicket] = useState<Ticket | null>(null);
  const [childTickets, setChildTickets] = useState<Ticket[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
        
        const projectMembers = [...ticket.project.members];
        
        const isCurrentUserInMembers = projectMembers.some(member => member.id === user.id);
        
        if (!isCurrentUserInMembers) {
          projectMembers.push(user);
        }
        
        setAvailableAssignees(projectMembers);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, [ticket.project.members]);

  useEffect(() => {
    const fetchRelatedTickets = async () => {
      try {
        // Fetch parent ticket if this ticket has a parent
        if (ticket.parentId) {
          const allTickets = await supabaseService.getAllTickets();
          const parent = allTickets.find(t => t.id === ticket.parentId);
          setParentTicket(parent || null);
        } else {
          setParentTicket(null);
        }
        
        // Fetch all child tickets
        const children = await supabaseService.getChildTickets(ticket.id);
        setChildTickets(children);
      } catch (error) {
        console.error('Error fetching related tickets:', error);
      }
    };
    
    fetchRelatedTickets();
  }, [ticket.id, ticket.parentId]);

  const handleStatusChangeWithValidation = async (status: Status) => {
    // If moving to done status and has children, validate all children are done
    if (status === 'done' && childTickets.length > 0) {
      const allChildrenDone = childTickets.every(child => child.status === 'done');
      
      if (!allChildrenDone) {
        toast.error("Cannot move to Done: All child tickets must be completed first");
        return;
      }
    }
    
    // Status change is valid, proceed
    handleStatusChange(status);
  };

  const handleTicketClick = (ticketId: string) => {
    // Navigate to ticket detail page
    navigate(`/board/${ticket.project.id}/ticket/${ticketId}`);
  };

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
                    <div className="flex items-center space-x-2">
                      <IssueTypeIcon issueType={option.value as IssueType} size={14} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center space-x-2">
              <IssueTypeIcon issueType={ticket.issueType} size={16} />
              <p className={`text-sm font-medium ${issueTypeColors[ticket.issueType || 'task']}`}>
                {issueTypeOptions.find(o => o.value === (ticket.issueType || 'task'))?.label || 'Task'}
              </p>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          {isEditing ? (
            <Select
              value={ticket.status}
              onValueChange={(value: Status) => handleStatusChangeWithValidation(value)}
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
        
        {ticket.parentId && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Parent</p>
            {parentTicket ? (
              <div 
                className="flex items-center space-x-2 text-sm p-2 rounded-md bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => handleTicketClick(parentTicket.id)}
              >
                <Link className="h-3 w-3" />
                <IssueTypeIcon issueType={parentTicket.issueType} size={14} />
                <span className="font-medium">{parentTicket.key}</span>
                <span className="truncate text-xs">{parentTicket.summary}</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </div>
            ) : (
              <p className="text-xs italic text-muted-foreground">Loading parent ticket...</p>
            )}
          </div>
        )}
        
        {childTickets.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Children ({childTickets.length})</p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {childTickets.map(child => (
                <div 
                  key={child.id}
                  className="flex items-center space-x-2 text-sm p-2 rounded-md bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => handleTicketClick(child.id)}
                >
                  <Link className="h-3 w-3" />
                  <IssueTypeIcon issueType={child.issueType} size={14} />
                  <span className="font-medium">{child.key}</span>
                  <span className="truncate text-xs">{child.summary}</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )}
        
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
                {availableAssignees.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} {member.id === currentUser?.id ? '(You)' : ''}
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


import React, { useState, useEffect } from 'react';
import { Ticket, IssueType } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link, useNavigate } from 'react-router-dom';
import { priorityColors, statusColors } from '@/components/ticket-modal/constants';
import TicketModal from '@/components/ticket-modal';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';

interface IssueHierarchyViewProps {
  tickets: Ticket[];
  projectId: string;
  onTicketUpdated?: () => void;
}

type TicketNode = {
  ticket: Ticket;
  children: TicketNode[];
};

const IssueHierarchyView: React.FC<IssueHierarchyViewProps> = ({ 
  tickets, 
  projectId,
  onTicketUpdated 
}) => {
  const [hierarchyData, setHierarchyData] = useState<TicketNode[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await supabaseService.getCurrentUser();
      setCurrentUser(user);
    };
    
    fetchCurrentUser();
  }, []);
  
  useEffect(() => {
    // Build hierarchy tree
    const buildHierarchy = () => {
      // Get all epic tickets (top level)
      const epics = tickets.filter(ticket => ticket.issueType === 'epic');
      
      // Create the hierarchy
      const hierarchy = epics.map(epic => {
        return buildNodeRecursively(epic);
      });
      
      // Add orphaned tickets (no parent but not epics)
      const orphanedTickets = tickets.filter(
        ticket => !ticket.parentId && ticket.issueType !== 'epic'
      );
      
      orphanedTickets.forEach(ticket => {
        hierarchy.push(buildNodeRecursively(ticket));
      });
      
      setHierarchyData(hierarchy);
    };
    
    const buildNodeRecursively = (ticket: Ticket): TicketNode => {
      const childTickets = tickets.filter(t => t.parentId === ticket.id);
      
      const children = childTickets.map(childTicket => {
        return buildNodeRecursively(childTicket);
      });
      
      return {
        ticket,
        children
      };
    };
    
    if (tickets.length > 0) {
      buildHierarchy();
    }
  }, [tickets]);
  
  // Get the icon color based on issue type
  const getIssueTypeColor = (issueType: IssueType) => {
    switch (issueType) {
      case 'epic': return 'text-purple-500';
      case 'feature': return 'text-blue-500';
      case 'story': return 'text-green-500';
      case 'task': return 'text-gray-500';
      case 'bug': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  // Get the background color based on issue type
  const getIssueTypeBg = (issueType: IssueType) => {
    switch (issueType) {
      case 'epic': return 'bg-purple-50';
      case 'feature': return 'bg-blue-50';
      case 'story': return 'bg-green-50';
      case 'task': return 'bg-gray-50';
      case 'bug': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };
  
  const handleOpenTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };
  
  const handleCloseTicketModal = () => {
    setIsTicketModalOpen(false);
    setSelectedTicket(null);
  };
  
  const handleTicketUpdate = async (updatedTicket: Ticket) => {
    try {
      const result = await supabaseService.updateTicket(updatedTicket.id, updatedTicket);
      if (result) {
        toast.success('Ticket updated successfully');
        if (onTicketUpdated) {
          onTicketUpdated();
        }
      } else {
        toast.error('Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
  };
  
  const handleTicketDelete = async (ticketId: string) => {
    try {
      const success = await supabaseService.deleteTicket(ticketId);
      
      if (success) {
        toast.success('Ticket deleted successfully');
        setIsTicketModalOpen(false);
        if (onTicketUpdated) {
          onTicketUpdated();
        }
      } else {
        toast.error('Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };
  
  // Render a ticket node and its children recursively
  const renderTicketNode = (node: TicketNode, level: number = 0) => {
    const { ticket, children } = node;
    const hasChildren = children.length > 0;
    
    return (
      <div key={ticket.id} className="mb-2">
        <AccordionItem value={ticket.id} className={`border rounded-md ${getIssueTypeBg(ticket.issueType)}`}>
          <AccordionTrigger className="px-4 py-2 hover:no-underline">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <span className={`font-mono text-xs ${getIssueTypeColor(ticket.issueType)}`}>
                  {ticket.key}
                </span>
                <span className="font-medium">{ticket.summary}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={statusColors[ticket.status]}>
                  {ticket.status.replace(/-/g, ' ')}
                </Badge>
                <Badge variant="outline" className={priorityColors[ticket.priority]}>
                  {ticket.priority}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          
          <AccordionContent className="px-4 pb-3">
            <div className="flex justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {ticket.description ? ticket.description.substring(0, 150) + (ticket.description.length > 150 ? '...' : '') : 'No description'}
                </p>
                <div className="text-sm">
                  <span className="text-muted-foreground">Assignee: </span>
                  {ticket.assignee ? ticket.assignee.name : 'Unassigned'}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOpenTicket(ticket)}
                  className="px-3 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded-md"
                >
                  Edit
                </button>
                <Link 
                  to={`/board/${projectId}/ticket/${ticket.id}`} 
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  View Details
                </Link>
              </div>
            </div>
            
            {hasChildren && (
              <div className="ml-6 mt-3 border-l-2 border-muted pl-4">
                {children.map(child => renderTicketNode(child, level + 1))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Hierarchy</CardTitle>
        <CardDescription>
          Overview of project issues and their relationships
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hierarchyData.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {hierarchyData.map(node => renderTicketNode(node))}
          </Accordion>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No issues found for this project
          </div>
        )}
      </CardContent>
      
      {selectedTicket && (
        <TicketModal 
          isOpen={isTicketModalOpen} 
          onClose={handleCloseTicketModal} 
          ticket={selectedTicket}
          onTicketUpdate={handleTicketUpdate}
          onTicketDelete={() => handleTicketDelete(selectedTicket.id)}
          currentUser={currentUser}
        />
      )}
    </Card>
  );
};

export default IssueHierarchyView;

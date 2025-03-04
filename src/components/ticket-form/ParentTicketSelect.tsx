
import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket } from '@/lib/types';
import { supabaseService } from '@/lib/supabase-service';
import { IssueTypeIcon } from './IssueTypeIcon';

interface ParentTicketSelectProps {
  parentTicketId?: string;
  onParentTicketChange: (value: string) => void;
  projectId: string;
  issueType: string;
  disabled?: boolean;
}

export const ParentTicketSelect: React.FC<ParentTicketSelectProps> = ({
  parentTicketId,
  onParentTicketChange,
  projectId,
  issueType,
  disabled = false
}) => {
  const [availableParents, setAvailableParents] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  // Only epics, features, and stories can be parents
  // epics -> features -> stories -> tasks
  const getParentTypes = () => {
    switch (issueType) {
      case 'feature':
        return ['epic'];
      case 'story':
        return ['feature'];
      case 'task':
        return ['story'];
      default:
        return [];
    }
  };

  const parentTypes = getParentTypes();

  useEffect(() => {
    const fetchPotentialParents = async () => {
      if (!projectId || parentTypes.length === 0) {
        setAvailableParents([]);
        return;
      }

      setLoading(true);
      try {
        // Get all tickets for this project
        const tickets = await supabaseService.getAllTickets();
        
        // Filter for potential parents based on issue type hierarchy
        const potentialParents = tickets.filter(ticket => 
          ticket.project.id === projectId && 
          parentTypes.includes(ticket.issueType)
        );
        
        setAvailableParents(potentialParents);
      } catch (error) {
        console.error('Error fetching potential parent tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPotentialParents();
  }, [projectId, issueType, parentTypes.join(',')]);

  // If the issue is an epic, no parent selection is needed
  if (issueType === 'epic' || parentTypes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label htmlFor="parentTicket" className="text-sm font-medium">Parent {parentTypes[0]}</label>
      <Select 
        value={parentTicketId || ''} 
        onValueChange={onParentTicketChange}
        disabled={disabled || loading || availableParents.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading..." : `Select parent ${parentTypes[0]}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No parent</SelectItem>
          {availableParents.map(ticket => (
            <SelectItem key={ticket.id} value={ticket.id}>
              <div className="flex items-center space-x-2">
                <IssueTypeIcon issueType={ticket.issueType} size={14} />
                <span>{ticket.key}: {ticket.summary.substring(0, 30)}{ticket.summary.length > 30 ? '...' : ''}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

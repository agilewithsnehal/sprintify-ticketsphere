import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IssueType } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';

interface ParentTicketSelectProps {
  parentTicketId: string;
  onParentTicketChange: (value: string) => void;
  projectId: string;
  issueType: IssueType;
  disabled?: boolean;
}

export const ParentTicketSelect: React.FC<ParentTicketSelectProps> = ({
  parentTicketId,
  onParentTicketChange,
  projectId,
  issueType,
  disabled = false
}) => {
  const [availableParents, setAvailableParents] = useState<{id: string, key: string, summary: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchPotentialParents = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        const allTickets = await supabaseService.getTicketsByProjectId(projectId);
        
        let validParentTypes: IssueType[] = [];
        
        switch (issueType) {
          case 'feature':
            validParentTypes = ['epic'];
            break;
          case 'story':
            validParentTypes = ['epic', 'feature'];
            break;
          case 'task':
            validParentTypes = ['epic', 'feature', 'story'];
            break;
          default:
            validParentTypes = [];
        }
        
        const filteredParents = allTickets
          .filter(ticket => validParentTypes.includes(ticket.issueType))
          .map(ticket => ({
            id: ticket.id,
            key: ticket.key,
            summary: ticket.summary
          }));
        
        setAvailableParents(filteredParents);
      } catch (error) {
        console.error('Error loading potential parent tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPotentialParents();
  }, [projectId, issueType]);
  
  if (issueType === 'epic' || availableParents.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      <label htmlFor="parent-ticket" className="text-sm font-medium">Parent Ticket</label>
      <Select 
        value={parentTicketId} 
        onValueChange={onParentTicketChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select parent ticket" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Parent</SelectItem>
          {availableParents.map(parent => (
            <SelectItem key={parent.id} value={parent.id}>
              {parent.key} - {parent.summary}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

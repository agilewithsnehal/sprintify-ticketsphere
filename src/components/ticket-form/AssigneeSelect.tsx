
import React from 'react';
import { User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AssigneeSelectProps {
  assigneeId: string;
  availableAssignees: User[];
  onAssigneeChange: (assigneeId: string) => void;
  currentUser: User | null;
  disabled?: boolean;
}

export const AssigneeSelect: React.FC<AssigneeSelectProps> = ({
  assigneeId,
  availableAssignees,
  onAssigneeChange,
  currentUser,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="assignee" className="text-sm font-medium">Assignee</label>
      <Select 
        value={assigneeId} 
        onValueChange={onAssigneeChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select assignee" />
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
    </div>
  );
};

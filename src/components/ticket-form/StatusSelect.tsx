
import React from 'react';
import { Status } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StatusSelectProps {
  status: Status;
  onStatusChange: (value: Status) => void;
  disabled?: boolean;
  parentStatus?: Status | null;
  childStatus?: Status | null;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  status,
  onStatusChange,
  disabled = false,
  parentStatus = null,
  childStatus = null
}) => {
  // Status progression order for validation
  const statusOrder: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];
  
  // Determine if each status should be disabled based on parent/child constraints
  const isStatusDisabled = (statusValue: Status): boolean => {
    // If parent status exists, child cannot be before parent
    if (parentStatus) {
      const parentIndex = statusOrder.indexOf(parentStatus);
      const statusIndex = statusOrder.indexOf(statusValue);
      
      // Don't allow child to be before parent
      return statusIndex < parentIndex;
    }
    
    // If child status exists, parent cannot be after child
    if (childStatus) {
      const childIndex = statusOrder.indexOf(childStatus);
      const statusIndex = statusOrder.indexOf(statusValue);
      
      // Don't allow parent to be after child
      return statusIndex > childIndex;
    }
    
    return false;
  };

  return (
    <div className="space-y-2">
      <label htmlFor="status" className="text-sm font-medium">Status</label>
      <Select 
        value={status} 
        onValueChange={(value: Status) => onStatusChange(value)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="backlog" disabled={isStatusDisabled('backlog')}>Backlog</SelectItem>
          <SelectItem value="todo" disabled={isStatusDisabled('todo')}>To Do</SelectItem>
          <SelectItem value="in-progress" disabled={isStatusDisabled('in-progress')}>In Progress</SelectItem>
          <SelectItem value="review" disabled={isStatusDisabled('review')}>Review</SelectItem>
          <SelectItem value="done" disabled={isStatusDisabled('done')}>Done</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

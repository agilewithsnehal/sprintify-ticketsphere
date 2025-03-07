import React from 'react';
import { Status } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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
    // If parent status exists, child cannot be before parent in workflow
    if (parentStatus) {
      const parentIndex = statusOrder.indexOf(parentStatus);
      const statusIndex = statusOrder.indexOf(statusValue);
      
      // Don't allow child to be before parent
      if (statusIndex < parentIndex) {
        return true;
      }
    }
    
    // If child status exists, parent cannot be after child in workflow
    if (childStatus) {
      const childIndex = statusOrder.indexOf(childStatus);
      const statusIndex = statusOrder.indexOf(statusValue);
      
      // Don't allow parent to be after child
      if (statusIndex > childIndex) {
        return true;
      }
    }
    
    return false;
  };

  const handleStatusChange = (newStatus: Status) => {
    console.log(`Attempting to change status from ${status} to ${newStatus}`);
    console.log(`Parent status: ${parentStatus}, Child status: ${childStatus}`);
    
    // If there's a child status and we're trying to move past it, show an error
    if (childStatus) {
      const childIndex = statusOrder.indexOf(childStatus);
      const newStatusIndex = statusOrder.indexOf(newStatus);
      
      if (newStatusIndex > childIndex) {
        console.error(`Cannot move parent past child status: ${childStatus}`);
        toast.error(`Cannot move ticket ahead of child tickets (${childStatus})`);
        return;
      }
    }
    
    // If there's a parent status and we're trying to move before it, show an error
    if (parentStatus) {
      const parentIndex = statusOrder.indexOf(parentStatus);
      const newStatusIndex = statusOrder.indexOf(newStatus);
      
      if (newStatusIndex < parentIndex) {
        console.error(`Cannot move child before parent status: ${parentStatus}`);
        toast.error(`Cannot move ticket before parent status: ${parentStatus}`);
        return;
      }
    }
    
    // Otherwise, proceed with the status change
    onStatusChange(newStatus);
  };

  return (
    <div className="space-y-2">
      <label htmlFor="status" className="text-sm font-medium">Status</label>
      <Select 
        value={status} 
        onValueChange={(value: Status) => handleStatusChange(value)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {statusOrder.map((statusValue) => (
            <SelectItem 
              key={statusValue} 
              value={statusValue} 
              disabled={isStatusDisabled(statusValue)}
            >
              {statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace(/-/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

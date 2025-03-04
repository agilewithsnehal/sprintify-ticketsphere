
import React from 'react';
import { Status } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StatusSelectProps {
  status: Status;
  onStatusChange: (value: Status) => void;
  disabled?: boolean;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  status,
  onStatusChange,
  disabled = false
}) => {
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
          <SelectItem value="backlog">Backlog</SelectItem>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

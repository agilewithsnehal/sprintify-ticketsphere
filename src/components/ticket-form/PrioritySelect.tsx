
import React from 'react';
import { Priority } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PrioritySelectProps {
  priority: Priority;
  onPriorityChange: (value: Priority) => void;
  disabled?: boolean;
}

export const PrioritySelect: React.FC<PrioritySelectProps> = ({
  priority,
  onPriorityChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="priority" className="text-sm font-medium">Priority</label>
      <Select 
        value={priority} 
        onValueChange={(value: Priority) => onPriorityChange(value)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

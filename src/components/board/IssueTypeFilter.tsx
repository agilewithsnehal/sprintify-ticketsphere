
import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket, IssueType } from '@/lib/types';
import { Blocks, Layers, TicketIcon, Bug, Lightbulb } from 'lucide-react';

interface IssueTypeFilterProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
}

const IssueTypeFilter: React.FC<IssueTypeFilterProps> = ({ selectedType, onTypeChange }) => {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedType || 'all'}
        onValueChange={(value) => onTypeChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by issue type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all" className="flex items-center gap-2">
              <span className="flex items-center gap-2">
                All Types
              </span>
            </SelectItem>
            <SelectItem value="epic" className="flex items-center gap-2">
              <span className="flex items-center gap-2">
                <Blocks className="h-4 w-4 text-purple-500" />
                Epic
              </span>
            </SelectItem>
            <SelectItem value="feature" className="flex items-center gap-2">
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-green-500" />
                Feature
              </span>
            </SelectItem>
            <SelectItem value="story" className="flex items-center gap-2">
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                Story
              </span>
            </SelectItem>
            <SelectItem value="task" className="flex items-center gap-2">
              <span className="flex items-center gap-2">
                <TicketIcon className="h-4 w-4 text-gray-500" />
                Task
              </span>
            </SelectItem>
            <SelectItem value="bug" className="flex items-center gap-2">
              <span className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-500" />
                Bug
              </span>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default IssueTypeFilter;

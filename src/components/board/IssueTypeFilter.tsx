
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, CircleDot, Flag, Layers, Blocks } from 'lucide-react';

interface IssueTypeFilterProps {
  selectedIssueType: string | null;
  onIssueTypeChange: (type: string | null) => void;
  className?: string;
}

const IssueTypeFilter: React.FC<IssueTypeFilterProps> = ({ 
  selectedIssueType, 
  onIssueTypeChange,
  className = ""
}) => {
  const issueTypes = [
    { value: null, label: 'All Types' },
    { value: 'epic', label: 'Epic', icon: <Layers className="h-4 w-4 text-purple-500" /> },
    { value: 'feature', label: 'Feature', icon: <Flag className="h-4 w-4 text-blue-500" /> },
    { value: 'task', label: 'Task', icon: <CircleDot className="h-4 w-4 text-green-500" /> },
    { value: 'bug', label: 'Bug', icon: <Bug className="h-4 w-4 text-red-500" /> },
    { value: 'subtask', label: 'Subtask', icon: <Blocks className="h-4 w-4 text-orange-500" /> }
  ];

  return (
    <Select 
      value={selectedIssueType || 'null'} 
      onValueChange={(value) => onIssueTypeChange(value === 'null' ? null : value)}
    >
      <SelectTrigger className={`h-8 ${className}`}>
        <SelectValue placeholder="Filter by type" />
      </SelectTrigger>
      <SelectContent>
        <ScrollArea className="h-56">
          {issueTypes.map((type) => (
            <SelectItem 
              key={type.value === null ? 'null' : type.value} 
              value={type.value === null ? 'null' : type.value}
              className="flex items-center space-x-2"
            >
              <div className="flex items-center space-x-2">
                {type.icon}
                <span>{type.label}</span>
              </div>
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
};

export default IssueTypeFilter;

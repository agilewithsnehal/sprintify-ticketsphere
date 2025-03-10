
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, CircleDot, Flag, Layers, Blocks, FileText, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { IssueType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface IssueTypeFilterProps {
  selectedIssueTypes: string[];
  onIssueTypesChange: (types: string[]) => void;
  className?: string;
}

const IssueTypeFilter: React.FC<IssueTypeFilterProps> = ({ 
  selectedIssueTypes, 
  onIssueTypesChange,
  className = ""
}) => {
  const issueTypes = [
    { value: 'epic', label: 'Epic', icon: <Layers className="h-4 w-4 text-purple-500" /> },
    { value: 'feature', label: 'Feature', icon: <Flag className="h-4 w-4 text-blue-500" /> },
    { value: 'story', label: 'Story', icon: <FileText className="h-4 w-4 text-indigo-500" /> },
    { value: 'task', label: 'Task', icon: <CircleDot className="h-4 w-4 text-green-500" /> },
    { value: 'bug', label: 'Bug', icon: <Bug className="h-4 w-4 text-red-500" /> },
    { value: 'subtask', label: 'Subtask', icon: <Blocks className="h-4 w-4 text-orange-500" /> }
  ];

  const handleTypeToggle = (type: string) => {
    if (selectedIssueTypes.includes(type)) {
      onIssueTypesChange(selectedIssueTypes.filter(t => t !== type));
    } else {
      onIssueTypesChange([...selectedIssueTypes, type]);
    }
  };

  const handleClearFilter = () => {
    onIssueTypesChange([]);
  };

  const handleSelectAll = () => {
    onIssueTypesChange(issueTypes.map(type => type.value));
  };

  // Display the count of selected types or "All Types" if none selected
  const buttonText = selectedIssueTypes.length === 0 
    ? "All Types" 
    : selectedIssueTypes.length === issueTypes.length 
      ? "All Types" 
      : `${selectedIssueTypes.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("flex justify-between items-center gap-2 w-40", className)}
        >
          <span className="truncate">{buttonText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <ScrollArea className="h-60">
          <div className="p-2">
            <div className="flex justify-between mb-2 px-2 py-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7" 
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7" 
                onClick={handleClearFilter}
              >
                Clear
              </Button>
            </div>

            {issueTypes.map((type) => (
              <div 
                key={type.value}
                onClick={() => handleTypeToggle(type.value)}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-secondary rounded-md cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  {type.icon}
                  <span>{type.label}</span>
                </div>
                {selectedIssueTypes.includes(type.value) && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default IssueTypeFilter;

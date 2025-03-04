
import React from 'react';
import { IssueType } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { issueTypeOptions } from '../ticket-modal/constants';

interface IssueTypeSelectProps {
  issueType: IssueType;
  onIssueTypeChange: (value: IssueType) => void;
  disabled?: boolean;
}

export const IssueTypeSelect: React.FC<IssueTypeSelectProps> = ({
  issueType,
  onIssueTypeChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="issueType" className="text-sm font-medium">Issue Type</label>
      <Select 
        value={issueType} 
        onValueChange={(value: IssueType) => onIssueTypeChange(value)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select issue type" />
        </SelectTrigger>
        <SelectContent>
          {issueTypeOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

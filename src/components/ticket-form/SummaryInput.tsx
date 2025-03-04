
import React from 'react';
import { Input } from '@/components/ui/input';

interface SummaryInputProps {
  summary: string;
  onSummaryChange: (value: string) => void;
  disabled?: boolean;
}

export const SummaryInput: React.FC<SummaryInputProps> = ({
  summary,
  onSummaryChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="summary" className="text-sm font-medium">Summary</label>
      <Input 
        id="summary"
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        placeholder="Enter ticket summary"
        required
        disabled={disabled}
      />
    </div>
  );
};

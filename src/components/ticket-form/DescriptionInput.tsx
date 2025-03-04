
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface DescriptionInputProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  disabled?: boolean;
}

export const DescriptionInput: React.FC<DescriptionInputProps> = ({
  description,
  onDescriptionChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="description" className="text-sm font-medium">Description</label>
      <Textarea 
        id="description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Enter ticket description"
        rows={5}
        disabled={disabled}
      />
    </div>
  );
};

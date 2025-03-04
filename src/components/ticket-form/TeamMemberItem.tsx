
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { User } from '@/lib/types';

interface TeamMemberItemProps {
  user: User;
  isCurrentUser: boolean;
  isSelected: boolean;
  onToggle: (userId: string) => void;
}

export const TeamMemberItem = ({ 
  user, 
  isCurrentUser, 
  isSelected, 
  onToggle 
}: TeamMemberItemProps) => {
  return (
    <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
      <Checkbox 
        id={`user-${user.id}`}
        checked={isSelected}
        onCheckedChange={() => onToggle(user.id)}
        disabled={isCurrentUser} // Current user is always selected
      />
      <label 
        htmlFor={`user-${user.id}`}
        className={`text-sm cursor-pointer flex-1 flex justify-between ${
          isCurrentUser ? 'font-semibold' : ''
        }`}
      >
        <span>{user.name}{isCurrentUser ? ' (You)' : ''}</span>
        <span className="text-muted-foreground">{user.role}</span>
      </label>
    </div>
  );
};

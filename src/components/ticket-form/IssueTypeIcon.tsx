
import React from 'react';
import { IssueType } from '@/lib/types';
import { Bug, GitBranch, ArrowUp, CheckSquare, Clipboard } from 'lucide-react';
import { issueTypeColors } from '../ticket-modal/constants';

interface IssueTypeIconProps {
  issueType: IssueType;
  size?: number;
  className?: string;
}

export const IssueTypeIcon: React.FC<IssueTypeIconProps> = ({
  issueType,
  size = 16,
  className = ''
}) => {
  const iconColor = issueTypeColors[issueType] || 'text-gray-600';
  
  const getIcon = () => {
    switch (issueType) {
      case 'epic':
        return <GitBranch size={size} className={`${iconColor} ${className}`} />;
      case 'feature':
        return <ArrowUp size={size} className={`${iconColor} ${className}`} />;
      case 'story':
        return <CheckSquare size={size} className={`${iconColor} ${className}`} />;
      case 'bug':
        return <Bug size={size} className={`${iconColor} ${className}`} />;
      case 'task':
      default:
        return <Clipboard size={size} className={`${iconColor} ${className}`} />;
    }
  };

  return getIcon();
};

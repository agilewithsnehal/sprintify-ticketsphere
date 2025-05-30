
import React from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProjectSelect } from './ProjectSelect';
import { SummaryInput } from './SummaryInput';
import { DescriptionInput } from './DescriptionInput';
import { StatusSelect } from './StatusSelect';
import { PrioritySelect } from './PrioritySelect';
import { IssueTypeSelect } from './IssueTypeSelect';
import { AssigneeSelect } from './AssigneeSelect';
import { ParentTicketSelect } from './ParentTicketSelect';
import { Status, Priority, IssueType, User, Project } from '@/lib/types';

interface TicketFormProps {
  summary: string;
  onSummaryChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  status: Status;
  onStatusChange: (value: Status) => void;
  priority: Priority;
  onPriorityChange: (value: Priority) => void;
  issueType: IssueType;
  onIssueTypeChange: (value: IssueType) => void;
  assigneeId: string;
  onAssigneeChange: (value: string) => void;
  projectId: string;
  projects: Project[];
  onProjectChange: (value: string) => void;
  availableAssignees: User[];
  currentUser: User | null;
  isSubmitting: boolean;
  selectedProject: Project | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  parentTicketId?: string;
  onParentTicketChange?: (value: string) => void;
}

export const TicketForm: React.FC<TicketFormProps> = ({
  summary,
  onSummaryChange,
  description,
  onDescriptionChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  issueType,
  onIssueTypeChange,
  assigneeId,
  onAssigneeChange,
  projectId,
  projects,
  onProjectChange,
  availableAssignees,
  currentUser,
  isSubmitting,
  selectedProject,
  onSubmit,
  onCancel,
  parentTicketId = '',
  onParentTicketChange = () => {}
}) => {
  const handleParentChange = (value: string) => {
    // Handle "none" value to clear parent
    if (value === "none") {
      onParentTicketChange("");
    } else {
      onParentTicketChange(value);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      {/* Project Selection */}
      <ProjectSelect 
        projectId={projectId} 
        projects={projects} 
        onProjectChange={onProjectChange} 
        disabled={isSubmitting} 
      />
      
      {/* Issue Type */}
      <IssueTypeSelect 
        issueType={issueType} 
        onIssueTypeChange={onIssueTypeChange} 
        disabled={isSubmitting} 
      />
      
      {/* Parent Ticket Selection - only show for non-epics */}
      {projectId && (
        <ParentTicketSelect
          parentTicketId={parentTicketId}
          onParentTicketChange={handleParentChange}
          projectId={projectId}
          issueType={issueType}
          disabled={isSubmitting}
        />
      )}
      
      {/* Summary */}
      <SummaryInput 
        summary={summary} 
        onSummaryChange={onSummaryChange} 
        disabled={isSubmitting} 
      />
      
      {/* Description */}
      <DescriptionInput 
        description={description} 
        onDescriptionChange={onDescriptionChange} 
        disabled={isSubmitting} 
      />
      
      {/* Status and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <StatusSelect 
          status={status} 
          onStatusChange={onStatusChange} 
          disabled={isSubmitting} 
        />
        
        <PrioritySelect 
          priority={priority} 
          onPriorityChange={onPriorityChange} 
          disabled={isSubmitting} 
        />
      </div>
      
      {/* Assignee */}
      <AssigneeSelect 
        assigneeId={assigneeId} 
        availableAssignees={availableAssignees} 
        onAssigneeChange={onAssigneeChange} 
        currentUser={currentUser} 
        disabled={isSubmitting || !selectedProject} 
      />
      
      {/* Footer with Actions */}
      <DialogFooter className="mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !projectId || !summary.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create Ticket'}
        </Button>
      </DialogFooter>
    </form>
  );
};

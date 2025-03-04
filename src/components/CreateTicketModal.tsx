
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project, Status, Ticket } from '@/lib/types';
import { useTicketCreation } from '@/hooks/kanban/useTicketCreation';
import { TicketForm } from './ticket-form';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  column?: Status;
  onTicketCreate: (ticket: Ticket) => Promise<boolean> | void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ 
  isOpen, 
  onClose, 
  project: initialProject, 
  column: initialColumn, 
  onTicketCreate 
}) => {
  const {
    summary,
    setSummary,
    description,
    setDescription,
    priority,
    setPriority,
    issueType,
    setIssueType,
    assigneeId,
    setAssigneeId,
    status,
    setStatus,
    projectId,
    projects,
    selectedProject,
    parentTicketId,
    setParentTicketId,
    isSubmitting,
    currentUser,
    availableAssignees,
    handleProjectChange,
    handleSubmit,
    resetForm
  } = useTicketCreation({
    initialProject,
    initialColumn,
    onTicketCreate,
    onClose
  });

  // Only fetch data when modal is open
  useEffect(() => {
    if (!isOpen) return;
    // The hook will handle data fetching
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
        </DialogHeader>
        
        <TicketForm
          summary={summary}
          onSummaryChange={setSummary}
          description={description}
          onDescriptionChange={setDescription}
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
          issueType={issueType}
          onIssueTypeChange={setIssueType}
          assigneeId={assigneeId}
          onAssigneeChange={setAssigneeId}
          projectId={projectId}
          projects={projects}
          onProjectChange={handleProjectChange}
          availableAssignees={availableAssignees}
          currentUser={currentUser}
          isSubmitting={isSubmitting}
          selectedProject={selectedProject}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          parentTicketId={parentTicketId}
          onParentTicketChange={setParentTicketId}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketModal;


import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Ticket, Project, Status, Priority, User, IssueType } from '@/lib/types';
import { supabaseService } from '@/lib/supabase-service';
import { issueTypeOptions } from './ticket-modal/constants';

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
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [issueType, setIssueType] = useState<IssueType>('task');
  const [assigneeId, setAssigneeId] = useState<string>('unassigned');
  const [status, setStatus] = useState<Status>(initialColumn || 'todo');
  const [projectId, setProjectId] = useState<string>(initialProject?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProject || null);
  
  // Track if a ticket has been successfully submitted
  const hasSubmittedRef = useRef(false);
  
  // Fetch current user and projects on load
  useEffect(() => {
    if (!isOpen) return; // Only fetch when modal is open
    
    const fetchInitialData = async () => {
      try {
        // Fetch current user
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
        
        // Fetch all projects
        const allProjects = await supabaseService.getAllProjects();
        console.log('Fetched all projects:', allProjects);
        setProjects(allProjects);
        
        // If a project was passed as prop, select it
        if (initialProject) {
          console.log('Using initial project:', initialProject.name);
          setSelectedProject(initialProject);
          setProjectId(initialProject.id);
        } else if (allProjects.length > 0) {
          console.log('Selecting first project:', allProjects[0].name);
          setSelectedProject(allProjects[0]);
          setProjectId(allProjects[0].id);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load data');
      }
    };
    
    console.log('Fetching initial data for CreateTicketModal');
    fetchInitialData();
    
    // Reset submission state when modal opens
    hasSubmittedRef.current = false;
    
  }, [initialProject, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form, hasSubmittedRef:', hasSubmittedRef.current);
    
    if (!summary.trim()) {
      toast.error('Please provide a summary for the ticket');
      return;
    }
    
    if (!projectId) {
      toast.error('Please select a project');
      return;
    }
    
    if (!currentUser) {
      toast.error('Unable to determine current user');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting || hasSubmittedRef.current) {
      console.log('Preventing duplicate submission');
      return;
    }

    setIsSubmitting(true);
    hasSubmittedRef.current = true;

    try {
      // Find the selected project
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        toast.error('Selected project not found');
        setIsSubmitting(false);
        hasSubmittedRef.current = false;
        return;
      }
      
      console.log('Creating ticket for project:', project.name);
      
      // Get existing tickets for this project to generate a unique key
      const projectTickets = await supabaseService.getTicketsByProjectId(project.id);
      
      // Find the highest ticket number for this project
      let highestNumber = 0;
      projectTickets.forEach(ticket => {
        const match = ticket.key.match(new RegExp(`${project.key}-(\\d+)`));
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > highestNumber) {
            highestNumber = num;
          }
        }
      });
      
      // Generate a unique ticket number
      const ticketNumber = highestNumber + 1;
      const ticketKey = `${project.key}-${ticketNumber}`;
      
      console.log('Generated unique ticket key:', ticketKey);
      
      // Create a new ticket object
      const newTicket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'> = {
        key: ticketKey,
        summary: summary.trim(),
        description: description.trim(),
        status: status,
        priority,
        issueType,
        assignee: assigneeId !== 'unassigned' ? project.members.find(member => member.id === assigneeId) : undefined,
        reporter: currentUser,
        project,
      };
      
      console.log('New ticket data:', newTicket);
      
      // Create the ticket and get the result with all fields populated
      const result = await onTicketCreate(newTicket as any);
      
      if (result !== false) {
        console.log('Ticket created successfully');
        resetForm();
        onClose();
        // Toast is handled by the parent component
      } else {
        console.log('Ticket creation failed');
        hasSubmittedRef.current = false;
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('An error occurred while creating the ticket');
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSummary('');
    setDescription('');
    setPriority('medium');
    setIssueType('task');
    setAssigneeId('unassigned');
    setStatus(initialColumn || 'todo');
    hasSubmittedRef.current = false;
  };

  const handleProjectChange = (projectId: string) => {
    console.log('Changing project to:', projectId);
    setProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
    // Reset assignee when project changes
    setAssigneeId('unassigned');
  };

  // When closing the modal, we need to reset everything
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
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <label htmlFor="project" className="text-sm font-medium">Project</label>
            <Select 
              value={projectId} 
              onValueChange={handleProjectChange}
              disabled={!!initialProject || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} ({project.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="summary" className="text-sm font-medium">Summary</label>
            <Input 
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter ticket summary"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter ticket description"
              rows={5}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <Select 
                value={status} 
                onValueChange={(value: Status) => setStatus(value)}
                disabled={!!initialColumn || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">Priority</label>
              <Select 
                value={priority} 
                onValueChange={(value: Priority) => setPriority(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="issueType" className="text-sm font-medium">Issue Type</label>
            <Select 
              value={issueType} 
              onValueChange={(value: IssueType) => setIssueType(value)}
              disabled={isSubmitting}
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
          
          <div className="space-y-2">
            <label htmlFor="assignee" className="text-sm font-medium">Assignee</label>
            <Select 
              value={assigneeId} 
              onValueChange={setAssigneeId}
              disabled={isSubmitting || !selectedProject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {selectedProject?.members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !projectId || hasSubmittedRef.current}>
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketModal;

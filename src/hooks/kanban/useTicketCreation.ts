
import { useState, useEffect, useRef } from 'react';
import { User, Project, Status, Priority, IssueType, Ticket } from '@/lib/types';
import { supabaseService } from '@/lib/supabase-service';
import { toast } from 'sonner';

interface UseTicketCreationProps {
  initialProject?: Project;
  initialColumn?: Status;
  onTicketCreate: (ticket: Ticket) => Promise<boolean> | void;
  onClose: () => void;
}

export function useTicketCreation({
  initialProject,
  initialColumn,
  onTicketCreate,
  onClose
}: UseTicketCreationProps) {
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
  const [availableAssignees, setAvailableAssignees] = useState<User[]>([]);
  
  // Track if a ticket has been successfully submitted
  const hasSubmittedRef = useRef(false);
  
  // Fetch current user and projects on load
  useEffect(() => {
    // Only fetch when modal is open (handled by parent component)
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
          
          // Set available assignees
          const projectMembers = [...initialProject.members];
          const isCurrentUserInMembers = projectMembers.some(member => member.id === user.id);
          if (!isCurrentUserInMembers) {
            projectMembers.push(user);
          }
          setAvailableAssignees(projectMembers);
        } else if (allProjects.length > 0) {
          // If no initial project, select the first one from the fetched projects
          console.log('Selecting first project:', allProjects[0].name);
          setSelectedProject(allProjects[0]);
          setProjectId(allProjects[0].id);
          
          // Set available assignees for the first project
          const projectMembers = [...allProjects[0].members];
          const isCurrentUserInMembers = projectMembers.some(member => member.id === user.id);
          if (!isCurrentUserInMembers) {
            projectMembers.push(user);
          }
          setAvailableAssignees(projectMembers);
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
  }, [initialProject]);

  const handleProjectChange = (projectId: string) => {
    console.log('Changing project to:', projectId);
    setProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
    
    // Reset assignee when project changes
    setAssigneeId('unassigned');
    
    // Update available assignees
    if (project && currentUser) {
      const projectMembers = [...project.members];
      const isCurrentUserInMembers = projectMembers.some(member => member.id === currentUser.id);
      if (!isCurrentUserInMembers) {
        projectMembers.push(currentUser);
      }
      setAvailableAssignees(projectMembers);
    }
  };

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
      
      // Find assignee if not unassigned
      const assignee = assigneeId !== 'unassigned' 
        ? availableAssignees.find(member => member.id === assigneeId)
        : undefined;
      
      // Create a new ticket object
      const newTicket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'> = {
        key: ticketKey,
        summary: summary.trim(),
        description: description.trim(),
        status: status,
        priority,
        issueType,
        assignee: assignee,
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

  return {
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
    isSubmitting,
    currentUser,
    availableAssignees,
    handleProjectChange,
    handleSubmit,
    resetForm
  };
}

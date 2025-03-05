import { useState, useEffect } from 'react';
import { Project, Status, Priority, IssueType, Ticket, User } from '@/lib/types';
import { supabaseService } from '@/lib/supabase-service';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface UseTicketCreationProps {
  initialProject?: Project;
  initialColumn?: Status;
  onTicketCreate: (ticket: Ticket) => Promise<boolean> | void;
  onClose: () => void;
}

export function useTicketCreation({
  initialProject,
  initialColumn = 'todo',
  onTicketCreate,
  onClose
}: UseTicketCreationProps) {
  // Form state
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>(initialColumn);
  const [issueType, setIssueType] = useState<IssueType>('task');
  const [assigneeId, setAssigneeId] = useState('');
  const [parentTicketId, setParentTicketId] = useState('');
  
  // Project state
  const [projectId, setProjectId] = useState(initialProject?.id || '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProject || null);
  
  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableAssignees, setAvailableAssignees] = useState<User[]>([]);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load projects and current user on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all projects
        const allProjects = await supabaseService.getAllProjects();
        setProjects(allProjects);
        
        // Set initial project if provided
        if (initialProject) {
          setSelectedProject(initialProject);
          setProjectId(initialProject.id);
        } else if (allProjects.length > 0) {
          // Default to first project if none provided
          setSelectedProject(allProjects[0]);
          setProjectId(allProjects[0].id);
        }
        
        // Get current user
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
        
        // Set initial assignee to current user
        if (user) {
          setAssigneeId(user.id);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load initial data');
      }
    };
    
    fetchInitialData();
  }, [initialProject]);

  // Update available assignees when project changes
  useEffect(() => {
    const updateAssignees = async () => {
      if (!projectId) return;
      
      try {
        const project = projects.find(p => p.id === projectId);
        
        if (project) {
          setSelectedProject(project);
          
          // Start with project members
          let projectMembers = [...project.members];
          
          // Add current user if not already in list
          if (currentUser && !projectMembers.some(member => member.id === currentUser.id)) {
            projectMembers.push(currentUser);
          }
          
          setAvailableAssignees(projectMembers);
          
          // If current assignee is not in the new project's members, reset to unassigned
          if (assigneeId && !projectMembers.some(member => member.id === assigneeId)) {
            setAssigneeId(currentUser?.id || '');
          }
        }
      } catch (error) {
        console.error('Error updating assignees:', error);
      }
    };
    
    updateAssignees();
  }, [projectId, currentUser, projects, assigneeId]);

  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId);
    setParentTicketId(''); // Reset parent ticket when project changes
  };

  const resetForm = () => {
    setSummary('');
    setDescription('');
    setPriority('medium');
    setStatus(initialColumn);
    setIssueType('task');
    setAssigneeId(currentUser?.id || '');
    setParentTicketId('');
  };

  // Function to generate a ticket key
  const generateTicketKey = async (project: Project): Promise<string> => {
    try {
      // Get all tickets for the project to determine next ticket number
      const projectTickets = await supabaseService.getTicketsByProjectId(project.id);
      
      // Default ticket number starts at 1
      let ticketNumber = 1;
      
      // If there are existing tickets, find the highest number and increment
      if (projectTickets.length > 0) {
        const ticketNumbers = projectTickets
          .map(ticket => {
            const parts = ticket.key.split('-');
            if (parts.length === 2) {
              const num = parseInt(parts[1], 10);
              return isNaN(num) ? 0 : num;
            }
            return 0;
          })
          .filter(num => !isNaN(num));
        
        if (ticketNumbers.length > 0) {
          ticketNumber = Math.max(...ticketNumbers) + 1;
        }
      }
      
      // Generate key in format "PRJ-123"
      return `${project.key}-${ticketNumber}`;
    } catch (error) {
      console.error('Error generating ticket key:', error);
      // Fallback to a timestamp-based key
      return `${project.key}-${Date.now().toString().substring(7)}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!summary.trim()) {
      toast.error('Summary is required');
      return;
    }
    
    if (!projectId) {
      toast.error('Project is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        toast.error('Selected project not found');
        setIsSubmitting(false);
        return;
      }
      
      const reporter = currentUser;
      
      if (!reporter) {
        toast.error('User information not available');
        setIsSubmitting(false);
        return;
      }
      
      // Find assignee
      const assignee = assigneeId 
        ? [...project.members, reporter].find(user => user.id === assigneeId)
        : undefined;
      
      // Generate ticket key
      const ticketKey = await generateTicketKey(project);
      console.log(`Generated ticket key: ${ticketKey}`);
      
      // Generate a temporary ID for the ticket
      const tempId = uuidv4();
      
      // Create new ticket object with valid dates and ID
      const newTicket: Ticket = {
        id: tempId, // Add temporary ID
        key: ticketKey,
        summary,
        description,
        status,
        priority,
        issueType,
        project,
        reporter,
        assignee,
        parentId: parentTicketId || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: []
      };
      
      console.log('Creating new ticket with temp ID:', newTicket.id);
      
      // Call the create function
      const success = await onTicketCreate(newTicket);
      
      if (success) {
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
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
    parentTicketId,
    setParentTicketId,
    isSubmitting,
    currentUser,
    availableAssignees,
    handleProjectChange,
    handleSubmit,
    resetForm
  };
}


import { supabase } from "@/integrations/supabase/client";
import { Board, Comment, Priority, Project, Status, Ticket, User, IssueType } from "@/lib/types";

// Helper function to transform database data into our app types
const mapDbTicketToTicket = async (dbTicket: any): Promise<Ticket> => {
  // Fetch project
  const { data: projectData } = await supabase
    .from('projects')
    .select('*')
    .eq('id', dbTicket.project_id)
    .single();
  
  // Fetch assignee if exists
  let assignee: User | undefined = undefined;
  if (dbTicket.assignee_id) {
    const { data: assigneeData } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbTicket.assignee_id)
      .single();
    
    if (assigneeData) {
      assignee = {
        id: assigneeData.id,
        name: assigneeData.name,
        email: assigneeData.email,
        avatar: assigneeData.avatar,
        role: assigneeData.role as 'admin' | 'manager' | 'developer' | 'viewer'
      };
    }
  }

  // Fetch reporter
  const { data: reporterData } = await supabase
    .from('users')
    .select('*')
    .eq('id', dbTicket.reporter_id)
    .single();

  // Fetch project members
  const { data: memberIds } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', dbTicket.project_id);

  const memberPromises = memberIds?.map(async ({ user_id }) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();
    
    return data ? {
      id: data.id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
    } : null;
  }) || [];

  const members = (await Promise.all(memberPromises)).filter(Boolean) as User[];

  // Fetch comments
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*')
    .eq('ticket_id', dbTicket.id)
    .order('created_at', { ascending: true });

  const commentPromises = commentsData?.map(async (comment) => {
    const { data: authorData } = await supabase
      .from('users')
      .select('*')
      .eq('id', comment.author_id)
      .single();
    
    return {
      id: comment.id,
      content: comment.content,
      createdAt: new Date(comment.created_at),
      author: authorData ? {
        id: authorData.id,
        name: authorData.name,
        email: authorData.email,
        avatar: authorData.avatar,
        role: authorData.role as 'admin' | 'manager' | 'developer' | 'viewer'
      } : {
        id: reporterData.id,
        name: reporterData.name,
        email: reporterData.email,
        avatar: reporterData.avatar,
        role: reporterData.role as 'admin' | 'manager' | 'developer' | 'viewer'
      }
    };
  }) || [];

  const comments = await Promise.all(commentPromises);

  // Construct project object
  const project: Project = {
    id: projectData.id,
    name: projectData.name,
    description: projectData.description || '',
    key: projectData.key,
    members: members,
    lead: members.find(m => m.role === 'admin') || members[0], // Assuming admin is the lead
    createdAt: new Date(projectData.created_at),
    updatedAt: new Date(projectData.updated_at)
  };

  // Construct and return the ticket
  return {
    id: dbTicket.id,
    key: dbTicket.key,
    summary: dbTicket.summary,
    description: dbTicket.description || '',
    status: dbTicket.status as Status,
    priority: dbTicket.priority as Priority,
    issueType: dbTicket.issue_type as IssueType || 'task', // Default to 'task' if not set
    assignee: assignee,
    reporter: {
      id: reporterData.id,
      name: reporterData.name,
      email: reporterData.email,
      avatar: reporterData.avatar,
      role: reporterData.role as 'admin' | 'manager' | 'developer' | 'viewer'
    },
    project: project,
    createdAt: new Date(dbTicket.created_at),
    updatedAt: new Date(dbTicket.updated_at),
    comments: comments
  };
};

// Service functions
export const supabaseService = {
  // Projects
  async getAllProjects(): Promise<Project[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projectsWithDetails = await Promise.all(
        projects.map(async (project) => {
          // Get members
          const { data: memberIds } = await supabase
            .from('project_members')
            .select('user_id')
            .eq('project_id', project.id);

          const memberPromises = memberIds?.map(async ({ user_id }) => {
            const { data } = await supabase
              .from('users')
              .select('*')
              .eq('id', user_id)
              .single();
            
            return data ? {
              id: data.id,
              name: data.name,
              email: data.email,
              avatar: data.avatar,
              role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
            } : null;
          }) || [];

          const members = (await Promise.all(memberPromises)).filter(Boolean) as User[];

          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            key: project.key,
            members,
            lead: members.find(m => m.role === 'admin') || members[0],
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.updated_at)
          };
        })
      );

      return projectsWithDetails;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (!project) return null;

      // Get members
      const { data: memberIds } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', project.id);

      const memberPromises = memberIds?.map(async ({ user_id }) => {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user_id)
          .single();
        
        return data ? {
          id: data.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
        } : null;
      }) || [];

      const members = (await Promise.all(memberPromises)).filter(Boolean) as User[];

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        key: project.key,
        members,
        lead: members.find(m => m.role === 'admin') || members[0],
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at)
      };
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  },

  async createProject(newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project | null> {
    try {
      // Insert the project
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name,
          description: newProject.description,
          key: newProject.key
        })
        .select()
        .single();

      if (error) throw error;
      if (!project) return null;
      
      // Add members
      const memberPromises = newProject.members.map(async (member) => {
        return supabase
          .from('project_members')
          .insert({
            project_id: project.id,
            user_id: member.id
          });
      });
      
      await Promise.all(memberPromises);
      
      // Return the full project
      return this.getProjectById(project.id);
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  },

  async getTicketsByProjectId(projectId: string): Promise<Ticket[]> {
    try {
      const { data: dbTickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tickets = await Promise.all(
        dbTickets.map(ticket => mapDbTicketToTicket(ticket))
      );

      return tickets;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  },

  async getAllTickets(): Promise<Ticket[]> {
    try {
      const { data: dbTickets, error } = await supabase
        .from('tickets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const tickets = await Promise.all(
        dbTickets.map(ticket => mapDbTicketToTicket(ticket))
      );

      return tickets;
    } catch (error) {
      console.error('Error fetching all tickets:', error);
      return [];
    }
  },

  async createTicket(newTicket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>): Promise<Ticket | null> {
    try {
      console.log('Creating new ticket in database:', newTicket.key);
      
      // First check if a ticket with this key already exists
      const { data: existingTickets } = await supabase
        .from('tickets')
        .select('id, key')
        .eq('key', newTicket.key);
      
      if (existingTickets && existingTickets.length > 0) {
        console.error('A ticket with this key already exists:', newTicket.key);
        return null;
      }
      
      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          key: newTicket.key,
          summary: newTicket.summary,
          description: newTicket.description,
          status: newTicket.status,
          priority: newTicket.priority,
          issue_type: newTicket.issueType || 'task',
          assignee_id: newTicket.assignee?.id,
          reporter_id: newTicket.reporter.id,
          project_id: newTicket.project.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting ticket:', error);
        throw error;
      }
      
      return ticket ? await mapDbTicketToTicket(ticket) : null;
    } catch (error) {
      console.error('Error creating ticket:', error);
      return null;
    }
  },

  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
    try {
      const updateData: any = {};
      
      if (updates.summary !== undefined) updateData.summary = updates.summary;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.issueType !== undefined) updateData.issue_type = updates.issueType;
      if (updates.assignee !== undefined) updateData.assignee_id = updates.assignee?.id || null;
      
      const { data: ticket, error } = await supabase
        .from('tickets')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      
      return ticket ? await mapDbTicketToTicket(ticket) : null;
    } catch (error) {
      console.error('Error updating ticket:', error);
      return null;
    }
  },

  async addComment(ticketId: string, content: string, authorId: string): Promise<Comment | null> {
    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          ticket_id: ticketId,
          content,
          author_id: authorId
        })
        .select()
        .single();

      if (error) throw error;
      
      if (!comment) return null;

      // Fetch author data
      const { data: author } = await supabase
        .from('users')
        .select('*')
        .eq('id', comment.author_id)
        .single();

      // Update ticket's updated_at timestamp
      await supabase
        .from('tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      return {
        id: comment.id,
        content: comment.content,
        createdAt: new Date(comment.created_at),
        author: {
          id: author.id,
          name: author.name,
          email: author.email,
          avatar: author.avatar,
          role: author.role as 'admin' | 'manager' | 'developer' | 'viewer'
        }
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  },

  async createBoard(projectId: string): Promise<Board | null> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) return null;
      
      const tickets = await this.getTicketsByProjectId(projectId);
      
      // Organize tickets by status
      const backlog = tickets.filter(ticket => ticket.status === 'backlog');
      const todo = tickets.filter(ticket => ticket.status === 'todo');
      const inProgress = tickets.filter(ticket => ticket.status === 'in-progress');
      const review = tickets.filter(ticket => ticket.status === 'review');
      const done = tickets.filter(ticket => ticket.status === 'done');
      
      return {
        id: `board-${projectId}`,
        name: `${project.name} Board`,
        project,
        columns: [
          { id: 'backlog', title: 'Backlog', tickets: backlog },
          { id: 'todo', title: 'To Do', tickets: todo },
          { id: 'in-progress', title: 'In Progress', tickets: inProgress },
          { id: 'review', title: 'Review', tickets: review },
          { id: 'done', title: 'Done', tickets: done }
        ]
      };
    } catch (error) {
      console.error('Error creating board:', error);
      return null;
    }
  },

  async searchTickets(query: string): Promise<Ticket[]> {
    try {
      const { data: dbTickets, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`summary.ilike.%${query}%,description.ilike.%${query}%,key.ilike.%${query}%`);

      if (error) throw error;
      
      const tickets = await Promise.all(
        dbTickets.map(ticket => mapDbTicketToTicket(ticket))
      );
      
      return tickets;
    } catch (error) {
      console.error('Error searching tickets:', error);
      return [];
    }
  },

  async getCurrentUser(): Promise<User> {
    // In a real app with auth, we would get the current user from the session
    // For now, we'll return the first user as the "current user"
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
    };
  },

  async deleteTicket(ticketId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return false;
    }
  },

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      // First delete all related tickets
      const { error: ticketsError } = await supabase
        .from('tickets')
        .delete()
        .eq('project_id', projectId);

      if (ticketsError) throw ticketsError;

      // Delete project members
      const { error: membersError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId);

      if (membersError) throw membersError;

      // Finally delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  },
};


import { supabase } from "@/integrations/supabase/client";
import { Board, Comment, Priority, Project, Status, Ticket, User } from "@/lib/types";

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
        role: assigneeData.role
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
      role: data.role
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
        role: authorData.role
      } : reporterData // Fallback to reporter if author is not found
    };
  }) || [];

  const comments = await Promise.all(commentPromises);

  // Construct project object
  const project: Project = {
    id: projectData.id,
    name: projectData.name,
    description: projectData.description,
    key: projectData.key,
    members: members,
    lead: members.find(m => m.role === 'admin') || members[0] // Assuming admin is the lead
  };

  // Construct and return the ticket
  return {
    id: dbTicket.id,
    key: dbTicket.key,
    summary: dbTicket.summary,
    description: dbTicket.description || '',
    status: dbTicket.status as Status,
    priority: dbTicket.priority as Priority,
    assignee: assignee,
    reporter: {
      id: reporterData.id,
      name: reporterData.name,
      email: reporterData.email,
      avatar: reporterData.avatar,
      role: reporterData.role
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
              role: data.role
            } : null;
          }) || [];

          const members = (await Promise.all(memberPromises)).filter(Boolean) as User[];

          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            key: project.key,
            members,
            lead: members.find(m => m.role === 'admin') || members[0]
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
          role: data.role
        } : null;
      }) || [];

      const members = (await Promise.all(memberPromises)).filter(Boolean) as User[];

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        key: project.key,
        members,
        lead: members.find(m => m.role === 'admin') || members[0]
      };
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  },

  // Tickets
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
      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          key: newTicket.key,
          summary: newTicket.summary,
          description: newTicket.description,
          status: newTicket.status,
          priority: newTicket.priority,
          assignee_id: newTicket.assignee?.id,
          reporter_id: newTicket.reporter.id,
          project_id: newTicket.project.id
        })
        .select()
        .single();

      if (error) throw error;
      
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

  // Comments
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
          role: author.role
        }
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  },

  // Board
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

  // Users
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
      role: data.role
    };
  }
};


import { Board } from "@/lib/types";
import { supabaseService as projectService } from './project-service';
import { supabaseService as ticketService } from './ticket-service';

export const supabaseService = {
  async createBoard(projectId: string): Promise<Board | null> {
    try {
      const project = await projectService.getProjectById(projectId);
      if (!project) return null;
      
      const tickets = await ticketService.getTicketsByProjectId(projectId);
      
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
};

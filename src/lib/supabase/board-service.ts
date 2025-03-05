import { Board, Column } from "@/lib/types";
import { supabaseService as projectService } from './project-service';
import { ticketService } from './ticket';
import { supabase } from "@/integrations/supabase/client";

// Store column configurations in localStorage for persistence
// In a production app, we'd store this in the database
const getStoredColumns = (projectId: string): Column[] | null => {
  const storedData = localStorage.getItem(`board_columns_${projectId}`);
  return storedData ? JSON.parse(storedData) : null;
};

const storeColumns = (projectId: string, columns: Column[]): void => {
  localStorage.setItem(`board_columns_${projectId}`, JSON.stringify(columns));
};

export const supabaseService = {
  async createBoard(projectId: string): Promise<Board | null> {
    try {
      const project = await projectService.getProjectById(projectId);
      if (!project) return null;
      
      const tickets = await ticketService.getTicketsByProjectId(projectId);
      
      // Check if we have stored column configuration
      const storedColumns = getStoredColumns(projectId);
      
      if (storedColumns) {
        // If we have stored columns, use them but update the tickets
        const columns = storedColumns.map(column => {
          const columnTickets = tickets.filter(ticket => ticket.status === column.id);
          return {
            ...column,
            tickets: columnTickets
          };
        });
        
        return {
          id: `board-${projectId}`,
          name: `${project.name} Board`,
          project,
          columns
        };
      }
      
      // Otherwise use default columns
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

  async updateBoardColumns(projectId: string, columns: Column[]): Promise<boolean> {
    try {
      console.log('Updating board columns for project:', projectId, columns);
      
      // Store the column configuration in localStorage
      // In a real application, we would save this to a database
      storeColumns(projectId, columns.map(column => ({
        id: column.id,
        title: column.title,
        tickets: [] // Don't store tickets in localStorage to save space
      })));
      
      // In the future, when we have a proper board table in the database:
      // const { data, error } = await supabase
      //   .from('board_configurations')
      //   .upsert({ 
      //     project_id: projectId, 
      //     columns: columns.map(c => ({ id: c.id, title: c.title }))
      //   });
      
      return true;
    } catch (error) {
      console.error('Error updating board columns:', error);
      return false;
    }
  }
};

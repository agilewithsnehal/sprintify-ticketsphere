
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

// Default columns to use when no configuration exists
const getDefaultColumns = () => {
  return [
    { id: 'backlog', title: 'Backlog', tickets: [] },
    { id: 'todo', title: 'To Do', tickets: [] },
    { id: 'in-progress', title: 'In Progress', tickets: [] },
    { id: 'review', title: 'Review', tickets: [] },
    { id: 'done', title: 'Done', tickets: [] }
  ];
};

export const supabaseService = {
  async createBoard(projectId: string): Promise<Board | null> {
    try {
      const project = await projectService.getProjectById(projectId);
      if (!project) return null;
      
      const tickets = await ticketService.getTicketsByProjectId(projectId);
      
      // Check if we have stored column configuration
      let storedColumns = getStoredColumns(projectId);
      
      // If no stored columns, use default columns
      if (!storedColumns || storedColumns.length === 0) {
        console.log('No stored columns found, using defaults');
        storedColumns = getDefaultColumns();
        
        // Save default columns to localStorage
        storeColumns(projectId, storedColumns);
      }
      
      // Map tickets to their respective columns
      const columns = storedColumns.map(column => {
        const columnTickets = tickets.filter(ticket => ticket.status === column.id);
        return {
          ...column,
          tickets: columnTickets
        };
      });
      
      console.log('Board created with columns:', columns.map(c => c.title));
      
      return {
        id: `board-${projectId}`,
        name: `${project.name} Board`,
        project,
        columns
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
  },
  
  // Function to reset columns to default
  async resetBoardColumns(projectId: string): Promise<boolean> {
    try {
      const defaultColumns = getDefaultColumns();
      
      // Store the default columns in localStorage
      storeColumns(projectId, defaultColumns);
      
      console.log('Reset board columns to default for project:', projectId);
      return true;
    } catch (error) {
      console.error('Error resetting board columns:', error);
      return false;
    }
  }
};

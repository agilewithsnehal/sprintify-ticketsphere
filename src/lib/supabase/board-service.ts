
import { Board, Column, Status } from "@/lib/types";
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
const getDefaultColumns = (): Column[] => {
  return [
    { id: 'backlog' as Status, title: 'Backlog', tickets: [] },
    { id: 'todo' as Status, title: 'To Do', tickets: [] },
    { id: 'in-progress' as Status, title: 'In Progress', tickets: [] },
    { id: 'review' as Status, title: 'Review', tickets: [] },
    { id: 'done' as Status, title: 'Done', tickets: [] }
  ];
};

export const supabaseService = {
  async createBoard(projectId: string): Promise<Board | null> {
    try {
      console.log('Creating board for project:', projectId);
      const project = await projectService.getProjectById(projectId);
      if (!project) return null;
      
      // Force fresh data fetch by adding cache-busting timestamp parameter
      const timestamp = new Date().getTime();
      console.log(`Fetching tickets for project ${projectId} with timestamp ${timestamp}`);
      
      // Use a direct query to ensure we get fresh data
      const { data: freshTickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('project_id', projectId);
        
      if (error) {
        console.error('Error fetching tickets:', error);
        return null;
      }
      
      // Map the database tickets to our application ticket type
      const tickets = await Promise.all(
        freshTickets.map(dbTicket => ticketService.getTicketById(dbTicket.id))
      );
      
      // Filter out any null values from the mapping
      const validTickets = tickets.filter(Boolean) as any[];
      
      console.log(`Fetched ${validTickets.length} tickets for project ${projectId}`);
      validTickets.forEach(ticket => {
        console.log(`Ticket: ${ticket.key}, Status: ${ticket.status}, ID: ${ticket.id}`);
      });
      
      // Check if we have stored column configuration
      let storedColumns = getStoredColumns(projectId);
      
      // If no stored columns, use default columns
      if (!storedColumns || storedColumns.length === 0) {
        console.log('No stored columns found, using defaults');
        storedColumns = getDefaultColumns();
        
        // Save default columns to localStorage
        storeColumns(projectId, storedColumns);
      }
      
      // Ensure each column has a valid Status id
      const validColumns = storedColumns.map(column => {
        // Ensure column.id is a valid Status
        const columnId = column.id as Status;
        return {
          ...column,
          id: columnId,
          tickets: [] // Start with empty tickets, we'll fill them below
        };
      });
      
      // Map tickets to their respective columns
      const columns = validColumns.map(column => {
        const columnTickets = validTickets.filter(ticket => ticket.status === column.id);
        console.log(`Column ${column.title} has ${columnTickets.length} tickets`);
        return {
          ...column,
          tickets: columnTickets
        };
      });
      
      console.log('Board created with columns:', columns.map(c => `${c.title} (${c.tickets.length})`));
      
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
      
      // Ensure we're storing columns with valid Status ids
      const columnsToStore = columns.map(column => ({
        id: column.id,
        title: column.title,
        tickets: [] // Don't store tickets in localStorage to save space
      }));
      
      // Store the column configuration in localStorage
      storeColumns(projectId, columnsToStore);
      
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

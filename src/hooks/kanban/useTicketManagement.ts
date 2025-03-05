
import { useCallback } from 'react';
import { Ticket as TicketType, Status, Comment } from '@/lib/types';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase';

export function useTicketManagement(
  columns: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>
) {
  // Helper function to find the latest ticket data in the columns
  const findTicketInColumns = useCallback((ticketId: string): TicketType | null => {
    if (!ticketId) return null;
    
    for (const column of columns) {
      const ticket = column.tickets.find((t: TicketType) => t.id === ticketId);
      if (ticket) {
        return ticket;
      }
    }
    return null;
  }, [columns]);

  // Helper to check if ticket exists by key or id
  const ticketExistsInColumns = useCallback((ticketId: string, ticketKey: string): boolean => {
    console.log('Checking if ticket exists:', ticketId, ticketKey);
    
    for (const column of columns) {
      const existsById = column.tickets.some((t: TicketType) => t.id === ticketId);
      const existsByKey = column.tickets.some((t: TicketType) => t.key === ticketKey);
      
      if (existsById || existsByKey) {
        console.log(`Ticket exists: ${existsById ? 'by ID' : 'by Key'}`);
        return true;
      }
    }
    
    console.log('Ticket does not exist in columns');
    return false;
  }, [columns]);

  const handleTicketCreate = useCallback(async (newTicket: TicketType) => {
    try {
      console.log('Handling ticket create:', newTicket.key, 'ID:', newTicket.id);
      
      // Ensure the ticket has a valid ID
      if (!newTicket.id) {
        console.error('New ticket has no valid ID:', newTicket);
        toast.error('Cannot add ticket: Missing ID');
        return false; // Return false to indicate failure
      }
      
      // Check if the ticket already exists in any column by ID or key
      if (ticketExistsInColumns(newTicket.id, newTicket.key)) {
        console.log('Ticket already exists in board. Skipping duplicate creation.');
        toast.info('Ticket is already on the board');
        return false; // Return false to indicate failure (already exists)
      }
      
      // Create the ticket in the database
      const createdTicket = await supabaseService.createTicket(newTicket);
      
      if (!createdTicket || !createdTicket.id) {
        console.error('Failed to create ticket in database:', newTicket);
        toast.error('Failed to create ticket in database');
        return false; // Return false to indicate failure
      }
      
      console.log('Ticket created in database with ID:', createdTicket.id);
      
      // Update the local state with the new ticket (use the database ticket with real ID)
      setColumns(prevColumns => {
        // Make a deep copy to ensure state updates correctly
        const updatedColumns = [...prevColumns];
        
        // Find the column that matches the ticket's status
        const columnIndex = updatedColumns.findIndex(col => col.id === createdTicket.status);
        
        // If the column exists, add the ticket to it
        if (columnIndex >= 0) {
          // Create a new tickets array to avoid mutating state
          const updatedTickets = [...updatedColumns[columnIndex].tickets];
          
          // Ensure there are no duplicates
          const ticketExists = updatedTickets.some(t => 
            t.id === createdTicket.id || t.key === createdTicket.key
          );
          
          if (!ticketExists) {
            updatedTickets.push(createdTicket);
            
            // Update the column with the new tickets array
            updatedColumns[columnIndex] = {
              ...updatedColumns[columnIndex],
              tickets: updatedTickets
            };
          }
        } else {
          console.error(`Column with id ${createdTicket.status} not found`);
        }
        
        return updatedColumns;
      });
      
      console.log('Ticket added to board:', createdTicket.id);
      toast.success('Ticket created successfully');
      return true; // Return true to indicate success
      
    } catch (error) {
      console.error('Error handling ticket create:', error);
      toast.error('Failed to update board with new ticket');
      return false; // Return false to indicate failure
    }
  }, [columns, setColumns, ticketExistsInColumns]);

  const handleTicketUpdate = useCallback(async (updatedTicket: TicketType) => {
    try {
      const oldTicket = findTicketInColumns(updatedTicket.id);
      if (!oldTicket) {
        toast.error('Ticket not found in board');
        return;
      }
      
      const oldStatus = oldTicket.status;
      const newStatus = updatedTicket.status;
      
      // Check if this is just a comment addition (not needing a full ticket update)
      if (updatedTicket.comments.length > oldTicket.comments.length && 
          updatedTicket.status === oldTicket.status && 
          updatedTicket.priority === oldTicket.priority && 
          updatedTicket.assignee?.id === oldTicket.assignee?.id) {
        
        // The comment has already been added to the database in TicketModal
        // Just update the UI
        setColumns(prevColumns => prevColumns.map(col => {
          if (col.id === oldStatus) {
            return {
              ...col,
              tickets: col.tickets.map((t: TicketType) => 
                t.id === updatedTicket.id ? updatedTicket : t
              )
            };
          }
          return col;
        }));
        
        return;
      }
      
      // For other updates, proceed with updating the ticket in the database
      const result = await supabaseService.updateTicket(updatedTicket.id, updatedTicket);
      
      if (!result) {
        toast.error('Failed to update ticket');
        return;
      }
      
      // Update the local state
      if (oldStatus !== newStatus) {
        // If status changed, move the ticket to a different column
        setColumns(prevColumns => prevColumns.map(col => {
          if (col.id === oldStatus) {
            return {
              ...col,
              tickets: col.tickets.filter((t: TicketType) => t.id !== updatedTicket.id)
            };
          }
          if (col.id === newStatus) {
            return {
              ...col,
              tickets: [...col.tickets, updatedTicket]
            };
          }
          return col;
        }));
      } else {
        // Just update the ticket in the current column
        setColumns(prevColumns => prevColumns.map(col => {
          if (col.id === updatedTicket.status) {
            return {
              ...col,
              tickets: col.tickets.map((t: TicketType) => 
                t.id === updatedTicket.id ? updatedTicket : t
              )
            };
          }
          return col;
        }));
      }
      
      toast.success('Ticket updated successfully');
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
  }, [columns, setColumns, findTicketInColumns]);

  const handleTicketDelete = useCallback(async (ticketId: string) => {
    try {
      // Find the ticket's current column
      const ticketColumn = columns.find(col => 
        col.tickets.some((t: TicketType) => t.id === ticketId)
      );
      
      if (!ticketColumn) {
        toast.error('Ticket not found in board');
        return false;
      }
      
      // Delete from database
      const success = await supabaseService.deleteTicket(ticketId);
      
      if (!success) {
        toast.error('Failed to delete ticket from database');
        return false;
      }
      
      // Update the local state by removing the ticket from its column
      setColumns(prevColumns => prevColumns.map(col => {
        if (col.id === ticketColumn.id) {
          return {
            ...col,
            tickets: col.tickets.filter((t: TicketType) => t.id !== ticketId)
          };
        }
        return col;
      }));
      
      toast.success('Ticket deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
      return false;
    }
  }, [columns, setColumns]);

  return {
    findTicketInColumns,
    ticketExistsInColumns,
    handleTicketCreate,
    handleTicketUpdate,
    handleTicketDelete
  };
}

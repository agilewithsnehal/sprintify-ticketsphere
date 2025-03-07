
import { useCallback } from 'react';
import { Ticket as TicketType } from '@/lib/types';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase';

/**
 * Hook that provides operations for ticket creation
 */
export function useTicketCreationOperations(
  columns: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>,
  ticketExistsInColumns: (ticketId: string, ticketKey: string) => boolean
) {
  const handleTicketCreate = useCallback(async (newTicket: TicketType) => {
    try {
      console.log('Handling ticket create:', newTicket.key, 'ID:', newTicket.id, 'Status:', newTicket.status);
      
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
            
            console.log('Added ticket to column:', updatedColumns[columnIndex].id, 
              'New count:', updatedTickets.length);
          }
        } else {
          console.error(`Column with id ${createdTicket.status} not found`);
        }
        
        return updatedColumns;
      });
      
      console.log('Ticket added to board:', createdTicket.id);
      
      // Dispatch an event to notify other components about the ticket creation
      document.dispatchEvent(new CustomEvent('ticket-notification', {
        detail: { 
          type: 'created',
          ticketKey: createdTicket.key,
          message: `Ticket ${createdTicket.key} created by ${createdTicket.reporter.name} `
        }
      }));
      
      toast.success('Ticket created successfully');
      return true; // Return true to indicate success
      
    } catch (error) {
      console.error('Error handling ticket create:', error);
      toast.error('Failed to update board with new ticket');
      return false; // Return false to indicate failure
    }
  }, [columns, setColumns, ticketExistsInColumns]);

  return {
    handleTicketCreate
  };
}

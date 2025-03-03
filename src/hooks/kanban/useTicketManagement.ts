import { useCallback } from 'react';
import { Ticket as TicketType, Status } from '@/lib/types';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase-service';

export function useTicketManagement(
  columns: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>
) {
  // Helper function to find the latest ticket data in the columns
  const findTicketInColumns = useCallback((ticketId: string): TicketType | null => {
    for (const column of columns) {
      const ticket = column.tickets.find((t: TicketType) => t.id === ticketId);
      if (ticket) {
        return ticket;
      }
    }
    return null;
  }, [columns]);

  const handleTicketCreate = useCallback(async (newTicket: TicketType) => {
    try {
      // In a real implementation, this would be handled by the parent component
      // which calls the service directly, but we're keeping this for UI updates
      setColumns(prevColumns => prevColumns.map(col => {
        if (col.id === newTicket.status) {
          return {
            ...col,
            tickets: [...col.tickets, newTicket]
          };
        }
        return col;
      }));
      
      toast.success(`Ticket created successfully in ${newTicket.status.replace(/-/g, ' ')}`);
    } catch (error) {
      console.error('Error handling ticket create:', error);
      toast.error('Failed to update board with new ticket');
    }
  }, []);

  const handleTicketUpdate = useCallback(async (updatedTicket: TicketType) => {
    try {
      const oldStatus = columns.find(col => 
        col.tickets.some((t: TicketType) => t.id === updatedTicket.id)
      )?.id;
      
      const newStatus = updatedTicket.status;
      
      // Update the ticket in the database
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
  }, [columns]);

  return {
    findTicketInColumns,
    handleTicketCreate,
    handleTicketUpdate
  };
}

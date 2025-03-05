
import { useCallback } from 'react';
import { Ticket as TicketType } from '@/lib/types';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase';

/**
 * Hook that provides operations for ticket updates
 */
export function useTicketUpdateOperations(
  columns: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>,
  findTicketInColumns: (ticketId: string) => TicketType | null
) {
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

  return {
    handleTicketUpdate
  };
}

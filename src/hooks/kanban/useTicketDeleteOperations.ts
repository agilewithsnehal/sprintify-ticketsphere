
import { useCallback } from 'react';
import { Ticket as TicketType } from '@/lib/types';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase';

/**
 * Hook that provides operations for ticket deletion
 */
export function useTicketDeleteOperations(
  columns: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>
) {
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
    handleTicketDelete
  };
}

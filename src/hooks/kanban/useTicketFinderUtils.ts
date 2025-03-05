
import { useCallback } from 'react';
import { Ticket as TicketType } from '@/lib/types';

/**
 * Hook that provides utilities for finding tickets in the kanban columns
 */
export function useTicketFinderUtils(columns: any[]) {
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

  return {
    findTicketInColumns,
    ticketExistsInColumns
  };
}

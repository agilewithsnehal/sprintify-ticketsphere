
import { Ticket as TicketType } from '@/lib/types';
import { useTicketFinderUtils } from './useTicketFinderUtils';
import { useTicketCreationOperations } from './useTicketCreationOperations';
import { useTicketUpdateOperations } from './useTicketUpdateOperations';
import { useTicketDeleteOperations } from './useTicketDeleteOperations';
import { useState, useRef } from 'react';

/**
 * Main hook that combines all ticket management operations
 */
export function useTicketManagement(
  columns: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>
) {
  // Use a ref to track processed ticket IDs
  const processedTicketIds = useRef(new Set<string>());
  
  // Get ticket finder utilities
  const { findTicketInColumns, ticketExistsInColumns } = useTicketFinderUtils(columns);
  
  // Ensure a ticket isn't processed more than once in a single operation
  const markTicketAsProcessed = (ticketId: string): boolean => {
    if (processedTicketIds.current.has(ticketId)) {
      return false; // Already processed
    }
    processedTicketIds.current.add(ticketId);
    return true;
  };
  
  // Clear processed tickets after each operation
  const clearProcessedTickets = () => {
    processedTicketIds.current.clear();
  };
  
  // Get ticket operations
  const { handleTicketCreate } = useTicketCreationOperations(
    columns, 
    setColumns, 
    ticketExistsInColumns
  );
  
  const { handleTicketUpdate } = useTicketUpdateOperations(
    columns, 
    setColumns, 
    findTicketInColumns
  );
  
  const { handleTicketDelete } = useTicketDeleteOperations(
    columns, 
    setColumns
  );

  return {
    findTicketInColumns,
    ticketExistsInColumns,
    handleTicketCreate,
    handleTicketUpdate,
    handleTicketDelete,
    markTicketAsProcessed,
    clearProcessedTickets
  };
}

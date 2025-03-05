
import { Ticket as TicketType } from '@/lib/types';
import { useTicketFinderUtils } from './useTicketFinderUtils';
import { useTicketCreationOperations } from './useTicketCreationOperations';
import { useTicketUpdateOperations } from './useTicketUpdateOperations';
import { useTicketDeleteOperations } from './useTicketDeleteOperations';

/**
 * Main hook that combines all ticket management operations
 */
export function useTicketManagement(
  columns: any[],
  setColumns: React.Dispatch<React.SetStateAction<any[]>>
) {
  // Get ticket finder utilities
  const { findTicketInColumns, ticketExistsInColumns } = useTicketFinderUtils(columns);
  
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
    handleTicketDelete
  };
}

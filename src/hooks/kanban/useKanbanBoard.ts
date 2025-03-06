
import { useState, useRef, useEffect } from 'react';
import { Board as BoardType, Status, Ticket as TicketType } from '@/lib/types';
import { useTicketManagement } from './useTicketManagement';
import { useModalManagement } from './useModalManagement';
import { useDragAndDrop } from './useDragAndDrop';
import { useScrollHandling } from './useScrollHandling';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';

export function useKanbanBoard(
  board: BoardType,
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status, updateParent?: boolean) => void
) {
  const [columns, setColumns] = useState(board.columns || []);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef(columns); // Use a ref to track previous column state

  // Update columns when board changes
  useEffect(() => {
    if (board && board.columns) {
      console.log('useKanbanBoard: Updating columns from board:', 
        board.columns.map(c => `${c.title} (${c.tickets.length} tickets)`), 
        'Column count:', board.columns.length);
      
      // Make a deep copy of the columns to ensure React detects the state change
      const columnsCopy = board.columns.map(column => ({
        ...column,
        tickets: [...column.tickets]
      }));
      
      setColumns(columnsCopy);
      columnsRef.current = columnsCopy;
    }
  }, [board]);

  // Load current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Integrate all the hooks
  const { 
    findTicketInColumns,
    handleTicketCreate, 
    handleTicketUpdate,
    handleTicketDelete 
  } = useTicketManagement(columns, setColumns);

  const { 
    selectedTicket,
    isTicketModalOpen,
    createModalStatus,
    isCreateModalOpen,
    handleOpenTicket,
    handleCloseTicketModal,
    handleOpenCreateModal,
    handleCloseCreateModal
  } = useModalManagement(findTicketInColumns);

  // Configure drag and drop with proper persistence
  const handleTicketMoveWithPersistence = async (
    ticketId: string, 
    sourceColumn: Status, 
    destinationColumn: Status,
    updateParent: boolean = true // Default to true
  ) => {
    console.log(`useKanbanBoard: handleTicketMoveWithPersistence called with ticketId=${ticketId}, source=${sourceColumn}, dest=${destinationColumn}, updateParent=${updateParent}`);
    
    // First, find the ticket in our columns
    const ticket = findTicketInColumns(ticketId);
    if (!ticket) {
      console.error('Cannot move ticket: Ticket not found in columns');
      toast.error('Cannot move ticket: Ticket not found');
      return;
    }
    
    try {
      // Check if this is a parent ticket being moved to "done"
      if (destinationColumn === 'done' && !ticket.parentId) {
        // Get child tickets for this parent
        const childTickets = await supabaseService.ticket.getChildTickets(ticket.id);
        
        if (childTickets && childTickets.length > 0) {
          // Check if all children are in "done" status
          const pendingChildren = childTickets.filter(child => child.status !== 'done');
          
          if (pendingChildren.length > 0) {
            console.error('Cannot move parent to done: Some children are not done');
            toast.error('All child tickets must be done before moving parent to done');
            return;
          }
        }
      }
      
      // Update the ticket in the database
      const result = await supabaseService.updateTicket(ticketId, {
        ...ticket,
        status: destinationColumn
      });
      
      if (!result) {
        toast.error('Failed to update ticket status in database');
        return;
      }
      
      console.log(`Ticket ${ticketId} successfully moved to ${destinationColumn} in database`);
      toast.success(`Ticket moved to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // Check if this ticket has a parent and update it if needed
      if (ticket.parentId && updateParent) {
        const parentTicket = await supabaseService.ticket.getTicketById(ticket.parentId);
        
        if (parentTicket) {
          // For "done" status, we need to check if all children are done
          if (destinationColumn === 'done') {
            const allChildTickets = await supabaseService.ticket.getChildTickets(parentTicket.id);
            const nonDoneChildren = allChildTickets.filter(child => child.status !== 'done');
            
            if (nonDoneChildren.length > 0) {
              console.log('Not updating parent to done yet as some children are still not done');
              return;
            }
          }
          
          // Only update parent if its status differs from destination
          if (parentTicket.status !== destinationColumn) {
            const updatedParent = await supabaseService.updateTicket(parentTicket.id, {
              status: destinationColumn
            });
            
            if (updatedParent) {
              console.log(`Successfully updated parent ticket status to ${destinationColumn}`);
              toast.success(`Parent ticket updated to ${destinationColumn.replace(/-/g, ' ')}`);
            } else {
              console.error('Failed to update parent ticket status');
              toast.error('Failed to update parent ticket');
            }
          } else {
            console.log(`Parent already in ${destinationColumn} status, no update needed`);
          }
        }
      }
      
      // Call the parent callback if provided, making sure to pass the updateParent parameter
      if (onTicketMove) {
        console.log(`About to call onTicketMove for ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}, updateParent: ${updateParent}`);
        onTicketMove(ticketId, sourceColumn, destinationColumn, updateParent);
      }
    } catch (error) {
      console.error('Error persisting ticket move:', error);
      toast.error('Failed to save ticket status');
    }
  };

  const { onDragEnd } = useDragAndDrop(columns, setColumns, handleTicketMoveWithPersistence);
  
  const { scrollLeft, scrollRight } = useScrollHandling(scrollContainerRef);

  return {
    columns,
    selectedTicket,
    isTicketModalOpen,
    createModalStatus,
    isCreateModalOpen,
    scrollContainerRef,
    currentUser,
    handleOpenTicket,
    handleCloseTicketModal,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleTicketCreate,
    handleTicketUpdate,
    handleTicketDelete,
    onDragEnd,
    scrollLeft,
    scrollRight
  };
}

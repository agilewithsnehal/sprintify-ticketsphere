
import { useState, useRef, useEffect } from 'react';
import { Board as BoardType, Status, Ticket as TicketType, IssueType } from '@/lib/types';
import { useTicketManagement } from './useTicketManagement';
import { useModalManagement } from './useModalManagement';
import { useDragAndDrop } from './useDragAndDrop';
import { useScrollHandling } from './useScrollHandling';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';

export function useKanbanBoard(
  board: BoardType,
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void
) {
  const [columns, setColumns] = useState(board.columns || []);
  const [filteredColumns, setFilteredColumns] = useState(board.columns || []);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef(columns);

  useEffect(() => {
    if (board && board.columns) {
      console.log('useKanbanBoard: Updating columns from board:', 
        board.columns.map(c => `${c.title} (${c.tickets.length} tickets)`), 
        'Column count:', board.columns.length);
      
      const columnsCopy = board.columns.map(column => ({
        ...column,
        tickets: [...column.tickets]
      }));
      
      setColumns(columnsCopy);
      setFilteredColumns(columnsCopy);
      columnsRef.current = columnsCopy;
    }
  }, [board]);

  // Listen for parent ticket update events to update the UI immediately without a full refresh
  useEffect(() => {
    const handleParentTicketUpdated = (event: CustomEvent<{ parentId: string, newStatus: Status }>) => {
      const { parentId, newStatus } = event.detail;
      console.log(`Handling parent ticket update event: ${parentId} to ${newStatus}`);
      
      // Update our local columns state to move the parent ticket to the new column
      setColumns(prevColumns => {
        let parentTicket: TicketType | null = null;
        let sourceColumnId: Status | null = null;
        
        // Find the parent ticket and its current column
        prevColumns.forEach(column => {
          const foundTicket = column.tickets.find(t => t.id === parentId);
          if (foundTicket) {
            parentTicket = foundTicket;
            sourceColumnId = column.id as Status;
          }
        });
        
        // If ticket not found or already in correct column, no update needed
        if (!parentTicket || !sourceColumnId || sourceColumnId === newStatus) {
          console.log('No UI update needed - parent ticket not found or already in correct column');
          return prevColumns;
        }
        
        console.log(`Moving parent ${parentId} in UI from ${sourceColumnId} to ${newStatus}`);
        
        // Move the ticket between columns in the UI
        return prevColumns.map(column => {
          // Remove from source column
          if (column.id === sourceColumnId) {
            return {
              ...column,
              tickets: column.tickets.filter(t => t.id !== parentId)
            };
          }
          
          // Add to destination column
          if (column.id === newStatus) {
            return {
              ...column,
              tickets: [...column.tickets, { ...parentTicket!, status: newStatus }]
            };
          }
          
          return column;
        });
      });
    };
    
    // Add event listener for parent ticket updates
    document.addEventListener('ticket-parent-updated', 
      handleParentTicketUpdated as EventListener);
      
    return () => {
      document.removeEventListener('ticket-parent-updated', 
        handleParentTicketUpdated as EventListener);
    };
  }, []);

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

  const handleTicketMoveWithPersistence = async (
    ticketId: string, 
    sourceColumn: Status, 
    destinationColumn: Status
  ) => {
    console.log(`useKanbanBoard: handleTicketMoveWithPersistence called with ticketId=${ticketId}, source=${sourceColumn}, dest=${destinationColumn}`);
    
    const ticket = findTicketInColumns(ticketId);
    if (!ticket) {
      console.error('Cannot move ticket: Ticket not found in columns');
      toast.error('Cannot move ticket: Ticket not found');
      return;
    }
    
    try {
      // For any forward move of a parent ticket
      if (sourceColumn !== destinationColumn) {
        // Get the status indices to determine if moving forward
        const sourceStatusIndex = statusOrder.indexOf(sourceColumn);
        const destStatusIndex = statusOrder.indexOf(destinationColumn);
        const isMovingForward = destStatusIndex > sourceStatusIndex;
        
        // Special validation for parent tickets
        if (isMovingForward && !ticket.parentId) {
          // Check for children tickets
          const childTickets = await supabaseService.ticket.getChildTickets(ticket.id);
          
          if (childTickets && childTickets.length > 0) {
            // For "done" status, all children must be done
            if (destinationColumn === 'done') {
              const pendingChildren = childTickets.filter(child => child.status !== 'done');
              
              if (pendingChildren.length > 0) {
                console.error('Cannot move parent to done: Some children are not done');
                toast.error('All child tickets must be done before moving parent to done');
                return;
              }
            }
            
            // For any forward move, no child can be in an earlier status
            const childrenBehind = childTickets.filter(child => {
              const childStatusIndex = statusOrder.indexOf(child.status as Status);
              return childStatusIndex < destStatusIndex;
            });
            
            if (childrenBehind.length > 0) {
              console.error('Cannot move parent ahead of children:', childrenBehind.map(t => t.key));
              toast.error('Cannot move parent ticket ahead of its children');
              return;
            }
          }
        }
      }
      
      // Move the ticket in the UI immediately
      setColumns(prevColumns => prevColumns.map(column => {
        // Remove from source column
        if (column.id === sourceColumn) {
          return {
            ...column,
            tickets: column.tickets.filter(t => t.id !== ticketId)
          };
        }
        
        // Add to destination column
        if (column.id === destinationColumn) {
          return {
            ...column,
            tickets: [...column.tickets, { ...ticket, status: destinationColumn }]
          };
        }
        
        return column;
      }));
      
      // Update the ticket status in the database
      const result = await supabaseService.updateTicket(ticketId, {
        ...ticket,
        status: destinationColumn
      });
      
      if (!result) {
        // If database update fails, revert the UI change
        setColumns(columnsRef.current);
        toast.error('Failed to update ticket status in database');
        return;
      }
      
      console.log(`Ticket ${ticketId} successfully moved to ${destinationColumn} in database`);
      toast.success(`Ticket moved to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // Call the onTicketMove callback if provided
      if (onTicketMove) {
        onTicketMove(ticketId, sourceColumn, destinationColumn);
      }
    } catch (error) {
      console.error('Error persisting ticket move:', error);
      toast.error('Failed to save ticket status');
      
      // Revert UI to previous state on error
      setColumns(columnsRef.current);
    }
  };

  const { onDragEnd } = useDragAndDrop(columns, setColumns, handleTicketMoveWithPersistence);
  
  const { scrollLeft, scrollRight } = useScrollHandling(scrollContainerRef);

  // Define the statusOrder for validation
  const statusOrder: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];

  return {
    columns,
    filteredColumns,
    setFilteredColumns,
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

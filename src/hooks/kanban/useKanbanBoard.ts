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
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void
) {
  const [columns, setColumns] = useState(board.columns || []);
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
      columnsRef.current = columnsCopy;
    }
  }, [board]);

  useEffect(() => {
    const handleParentTicketUpdated = (event: CustomEvent<{ parentId: string, newStatus: Status }>) => {
      const { parentId, newStatus } = event.detail;
      console.log(`Handling parent ticket update event: ${parentId} to ${newStatus}`);
      
      setColumns(prevColumns => {
        let parentTicket: TicketType | null = null;
        let sourceColumnId: Status | null = null;
        
        prevColumns.forEach(column => {
          const foundTicket = column.tickets.find(t => t.id === parentId);
          if (foundTicket) {
            parentTicket = foundTicket;
            sourceColumnId = column.id as Status;
          }
        });
        
        if (!parentTicket || !sourceColumnId || sourceColumnId === newStatus) {
          console.log('No UI update needed - parent ticket not found or already in correct column');
          return prevColumns;
        }
        
        console.log(`Moving parent ${parentId} in UI from ${sourceColumnId} to ${newStatus}`);
        
        return prevColumns.map(column => {
          if (column.id === sourceColumnId) {
            return {
              ...column,
              tickets: column.tickets.filter(t => t.id !== parentId)
            };
          }
          
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
      if (destinationColumn === 'done' && !ticket.parentId) {
        const childTickets = await supabaseService.ticket.getChildTickets(ticket.id);
        
        if (childTickets && childTickets.length > 0) {
          const pendingChildren = childTickets.filter(child => child.status !== 'done');
          
          if (pendingChildren.length > 0) {
            console.error('Cannot move parent to done: Some children are not done');
            toast.error('All child tickets must be done before moving parent to done');
            return;
          }
        }
      }
      
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
      
      if (onTicketMove) {
        console.log(`About to call onTicketMove for ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}`);
        onTicketMove(ticketId, sourceColumn, destinationColumn);
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

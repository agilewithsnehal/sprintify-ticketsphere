
import { useState, useCallback, useRef, useEffect } from 'react';
import { Ticket as TicketType, Board as BoardType, Status } from '@/lib/types';
import { DropResult } from 'react-beautiful-dnd';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase-service';

export function useKanbanBoard(
  board: BoardType,
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void
) {
  const [columns, setColumns] = useState(board.columns);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<Status | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  // Update columns when board changes
  useEffect(() => {
    setColumns(board.columns);
  }, [board]);

  // Helper function to find the latest ticket data in the columns
  const findTicketInColumns = useCallback((ticketId: string): TicketType | null => {
    for (const column of columns) {
      const ticket = column.tickets.find(t => t.id === ticketId);
      if (ticket) {
        return ticket;
      }
    }
    return null;
  }, [columns]);

  const handleOpenTicket = useCallback((ticket: TicketType) => {
    console.log('Opening ticket:', ticket.id, ticket.summary);
    try {
      // Make sure we get the latest ticket data
      const updatedTicket = findTicketInColumns(ticket.id);
      console.log('Updated ticket found:', updatedTicket ? 'yes' : 'no');
      setSelectedTicket(updatedTicket || ticket);
      setIsTicketModalOpen(true);
    } catch (error) {
      console.error('Error opening ticket:', error);
      toast.error('Failed to open ticket details');
    }
  }, [findTicketInColumns]);

  const handleCloseTicketModal = useCallback(() => {
    setIsTicketModalOpen(false);
    // Small delay to avoid visual glitches during closing animation
    setTimeout(() => {
      setSelectedTicket(null);
    }, 300);
  }, []);

  const handleOpenCreateModal = useCallback((status: Status) => {
    setCreateModalStatus(status);
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setCreateModalStatus(null);
  }, []);

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
      const oldStatus = selectedTicket?.status;
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
              tickets: col.tickets.filter(t => t.id !== updatedTicket.id)
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
              tickets: col.tickets.map(t => 
                t.id === updatedTicket.id ? updatedTicket : t
              )
            };
          }
          return col;
        }));
      }
      
      setSelectedTicket(updatedTicket);
      toast.success('Ticket updated successfully');
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
  }, [selectedTicket]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    const sourceTickets = [...sourceColumn.tickets];
    const destTickets = source.droppableId === destination.droppableId 
      ? sourceTickets 
      : [...destColumn.tickets];

    const [movedTicket] = sourceTickets.splice(source.index, 1);
    
    // Create the updated ticket with new status
    const updatedTicket = { 
      ...movedTicket,
      status: destination.droppableId as Status,
      updatedAt: new Date()
    };

    destTickets.splice(destination.index, 0, updatedTicket);

    // Update local state first for immediate UI response
    setColumns(prevColumns => prevColumns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, tickets: sourceTickets };
      }
      if (col.id === destination.droppableId) {
        return { ...col, tickets: destTickets };
      }
      return col;
    }));

    if (source.droppableId !== destination.droppableId) {
      // If the status changed, call the onTicketMove callback
      if (onTicketMove) {
        onTicketMove(
          draggableId,
          source.droppableId as Status,
          destination.droppableId as Status
        );
      }
    }
  }, [columns, onTicketMove]);

  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  }, []);

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
    onDragEnd,
    scrollLeft,
    scrollRight
  };
}


import { useState, useCallback, useRef, useEffect } from 'react';
import { Ticket as TicketType, Board as BoardType, Status } from '@/lib/types';
import { DropResult } from 'react-beautiful-dnd';
import { toast } from 'sonner';

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

  // Update columns when board changes
  useEffect(() => {
    setColumns(board.columns);
  }, [board]);

  const handleOpenTicket = useCallback((ticket: TicketType) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  }, []);

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

  const handleTicketCreate = useCallback((newTicket: TicketType) => {
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
  }, []);

  const handleTicketUpdate = useCallback((updatedTicket: TicketType) => {
    const oldStatus = selectedTicket?.status;
    const newStatus = updatedTicket.status;
    
    if (oldStatus !== newStatus) {
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
  }, [selectedTicket]);

  const onDragEnd = useCallback((result: DropResult) => {
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
    
    const updatedTicket = { 
      ...movedTicket,
      status: destination.droppableId as Status,
      updatedAt: new Date()
    };

    destTickets.splice(destination.index, 0, updatedTicket);

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
      toast.success(`Ticket moved to ${destination.droppableId.replace(/-/g, ' ')}`);
      console.log(`Moved ticket ${draggableId} from ${source.droppableId} to ${destination.droppableId}`);
    }

    if (onTicketMove) {
      onTicketMove(
        draggableId,
        source.droppableId as Status,
        destination.droppableId as Status
      );
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


import { useState, useRef, useEffect } from 'react';
import { Board as BoardType, Status, Ticket as TicketType } from '@/lib/types';
import { useTicketManagement } from './useTicketManagement';
import { useModalManagement } from './useModalManagement';
import { useDragAndDrop } from './useDragAndDrop';
import { useScrollHandling } from './useScrollHandling';
import { supabaseService } from '@/lib/supabase';

export function useKanbanBoard(
  board: BoardType,
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void
) {
  const [columns, setColumns] = useState(board.columns || []);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update columns when board changes
  useEffect(() => {
    if (board && board.columns) {
      console.log('useKanbanBoard: Updating columns from board:', 
        board.columns.map(c => c.title).join(', '), 
        'Column count:', board.columns.length);
      
      setColumns(board.columns);
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

  const { onDragEnd } = useDragAndDrop(columns, setColumns, onTicketMove);
  
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

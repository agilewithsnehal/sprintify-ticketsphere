
import { useState, useCallback } from 'react';
import { Status, Ticket as TicketType } from '@/lib/types';
import { toast } from 'sonner';

export function useModalManagement(findTicketInColumns: (id: string) => TicketType | null) {
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<Status | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenTicket = useCallback((ticket: TicketType) => {
    console.log('Opening ticket:', ticket.id, ticket.summary);
    try {
      // Make sure we get the latest ticket data
      const updatedTicket = findTicketInColumns(ticket.id);
      console.log('Updated ticket found:', updatedTicket ? 'yes' : 'no');
      
      // Set the selected ticket first
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      } else {
        setSelectedTicket(ticket);
      }
      
      // Important: Use setTimeout to ensure state has updated before opening modal
      setTimeout(() => {
        console.log('Opening modal for ticket:', ticket.id);
        setIsTicketModalOpen(true);
      }, 50);
    } catch (error) {
      console.error('Error opening ticket:', error);
      toast.error('Failed to open ticket details');
    }
  }, [findTicketInColumns]);

  const handleCloseTicketModal = useCallback(() => {
    console.log('Closing ticket modal');
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

  return {
    selectedTicket,
    isTicketModalOpen,
    createModalStatus,
    isCreateModalOpen,
    handleOpenTicket,
    handleCloseTicketModal,
    handleOpenCreateModal,
    handleCloseCreateModal
  };
}


import React, { useEffect, useState } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Board, Status } from '@/lib/types';
import { toast } from 'sonner';

interface KanbanBoardWrapperProps {
  board: Board;
  onTicketMove: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void;
  onRefresh?: () => void;
  selectedIssueType: string | null;
  onIssueTypeChange: (type: string | null) => void;
}

const KanbanBoardWrapper: React.FC<KanbanBoardWrapperProps> = ({ 
  board, 
  onTicketMove, 
  onRefresh,
  selectedIssueType,
  onIssueTypeChange
}) => {
  useEffect(() => {
    if (board && board.columns) {
      console.log('KanbanBoardWrapper: Rendering board with columns:', 
        board.columns.map(c => `${c.title} (${c.tickets.length})`).join(', '));
      
      // Calculate total tickets for debugging
      const totalTickets = board.columns.reduce((sum, col) => sum + col.tickets.length, 0);
      console.log(`KanbanBoardWrapper: Total tickets on board: ${totalTickets}`);
      
      // If filtering is active, also log filtered tickets count
      if (selectedIssueType) {
        const filteredTickets = board.columns.reduce((sum, col) => 
          sum + col.tickets.filter(t => t.issueType === selectedIssueType).length, 0);
        console.log(`KanbanBoardWrapper: Filtered tickets (${selectedIssueType}): ${filteredTickets}`);
      }
    }
  }, [board, selectedIssueType]);

  // Add an effect to listen for any ticket update events
  useEffect(() => {
    const handleTicketEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('KanbanBoardWrapper: Detected ticket event:', customEvent.detail);
      
      // Only refresh for created tickets or parent updates, not for moves
      if ((customEvent.detail?.type === 'created' || event.type === 'ticket-parent-updated') && onRefresh) {
        console.log('KanbanBoardWrapper: Triggering refresh after ticket event');
        // Add a small delay to ensure database has updated
        setTimeout(() => onRefresh(), 100);
      }
    };
    
    // Listen for both regular ticket notifications and parent update events
    document.addEventListener('ticket-notification', handleTicketEvent);
    document.addEventListener('ticket-parent-updated', handleTicketEvent);
    
    return () => {
      document.removeEventListener('ticket-notification', handleTicketEvent);
      document.removeEventListener('ticket-parent-updated', handleTicketEvent);
    };
  }, [onRefresh]);

  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    console.log(`KanbanBoardWrapper: Handling ticket move ${ticketId} from ${sourceColumn} to ${destinationColumn}`);
    
    try {
      // Show immediate feedback to the user
      toast.info(`Moving ticket from ${sourceColumn.replace(/-/g, ' ')} to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // The parent status updates are now handled automatically by the ticket-update.ts file
      // This will update the database but won't trigger a full board refresh
      onTicketMove(ticketId, sourceColumn, destinationColumn);
    } catch (error) {
      console.error('Error in handleTicketMove:', error);
      toast.error('Failed to move ticket');
      
      // Only refresh on errors to ensure UI is in sync with database
      if (onRefresh) {
        console.log('KanbanBoardWrapper: Triggering refresh after ticket move error');
        onRefresh();
      }
    }
  };

  return <KanbanBoard 
    board={board} 
    onTicketMove={handleTicketMove} 
    onRefresh={onRefresh}
    selectedIssueType={selectedIssueType}
    onIssueTypeChange={onIssueTypeChange}
  />;
};

export default KanbanBoardWrapper;

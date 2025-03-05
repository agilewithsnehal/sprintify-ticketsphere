
import React from 'react';
import { Ticket } from '@/lib/types';
import TicketModal from '@/components/ticket-modal';
import { Card } from '@/components/ui/card';

interface StandaloneTicketProps {
  ticket: Ticket;
  onTicketUpdate: (ticket: Ticket) => void;
  onTicketDelete?: (ticketId: string) => void;
  currentUser: any;
}

const StandaloneTicket: React.FC<StandaloneTicketProps> = ({
  ticket,
  onTicketUpdate,
  onTicketDelete,
  currentUser
}) => {
  return (
    <Card className="shadow-md">
      <TicketModal
        isOpen={true}
        onClose={() => {}}
        ticket={ticket}
        onTicketUpdate={onTicketUpdate}
        currentUser={currentUser}
        isStandalone={true}
        onTicketDelete={onTicketDelete}
      />
    </Card>
  );
};

export default StandaloneTicket;

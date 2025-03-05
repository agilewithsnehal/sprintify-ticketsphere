
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Ticket } from '@/lib/types';
import { priorityColors, statusColors } from './constants';
import { X } from 'lucide-react';

interface TicketHeaderProps {
  ticket: Ticket;
  isEditing: boolean;
  editedTicket: Ticket;
  onClose: () => void;
  handleInputChange: (field: keyof Ticket, value: any) => void;
}

const TicketHeader: React.FC<TicketHeaderProps> = ({
  ticket,
  isEditing,
  editedTicket,
  onClose,
  handleInputChange,
}) => {
  return (
    <DialogHeader className="p-6 border-b relative">
      <button 
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
      
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs font-medium">{ticket.key}</Badge>
          {!isEditing ? (
            <>
              <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </Badge>
              <Badge variant="outline" className={`text-xs ${statusColors[ticket.status]}`}>
                {ticket.status.replace(/-/g, ' ')}
              </Badge>
            </>
          ) : null}
        </div>
      </div>
      
      {isEditing ? (
        <div className="mt-2">
          <Input 
            value={editedTicket.summary}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            className="text-xl font-medium"
            placeholder="Ticket summary"
          />
        </div>
      ) : (
        <h2 className="text-xl font-medium mt-2">{ticket.summary}</h2>
      )}
    </DialogHeader>
  );
};

export default TicketHeader;

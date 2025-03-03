
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { Ticket } from '@/lib/types';
import { priorityColors, statusColors } from './constants';

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
    <DialogHeader className="p-6 border-b">
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
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
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

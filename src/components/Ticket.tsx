
import React from 'react';
import { motion } from 'framer-motion';
import { Ticket as TicketType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Eye } from 'lucide-react';
import { TicketCard, TicketCardHeader, TicketCardContent, TicketCardFooter } from '@/components/ui/ticket-card';

interface TicketProps {
  ticket: TicketType;
  onClick: () => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
};

const Ticket: React.FC<TicketProps> = ({ ticket, onClick }) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(ticket.updatedAt));

  // Explicit click handler with debug information
  const handleTicketClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Ticket clicked in component:', ticket.id, ticket.summary);
    onClick();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ 
        y: -2,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        transition: { duration: 0.2 }
      }}
      onClick={handleTicketClick}
      className="cursor-pointer"
      data-testid={`ticket-${ticket.id}`}
      aria-label={`Ticket ${ticket.key}: ${ticket.summary}`}
    >
      <TicketCard>
        <TicketCardHeader>
          <div className="flex justify-between items-start">
            <div className="flex space-x-2 items-center">
              <span className="text-xs font-medium text-muted-foreground">{ticket.key}</span>
              <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </Badge>
            </div>
            {ticket.assignee && (
              <Avatar className="h-6 w-6 ml-2">
                <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                <AvatarFallback>{ticket.assignee.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </TicketCardHeader>
        
        <TicketCardContent>
          <h3 className="font-medium text-sm mb-2 line-clamp-2">{ticket.summary}</h3>
        </TicketCardContent>
        
        <TicketCardFooter>
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-3 w-3" />
            <span className="text-xs text-muted-foreground">{ticket.comments.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
            <Eye className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
          </div>
        </TicketCardFooter>
      </TicketCard>
    </motion.div>
  );
};

export default Ticket;

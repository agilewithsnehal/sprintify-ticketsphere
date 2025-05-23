import React from 'react';
import { motion } from 'framer-motion';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Ticket as TicketType, Status } from '@/lib/types';
import Ticket from '../Ticket';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface KanbanColumnProps {
  id: Status;
  title: string;
  tickets: TicketType[];
  onOpenTicket: (ticket: TicketType) => void;
  onAddTicket: (status: Status) => void;
  projectId?: string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tickets,
  onOpenTicket,
  onAddTicket,
  projectId
}) => {
  const navigate = useNavigate();

  const handleTicketClick = (ticket: TicketType) => {
    // Check if the ticket has a valid ID before navigating
    if (!ticket.id) {
      console.error('Cannot navigate to ticket with invalid ID:', ticket);
      toast.error('Cannot open ticket: Invalid ticket ID');
      return;
    }

    const ticketProjectId = projectId || ticket.project.id;
    
    // Also validate the project ID
    if (!ticketProjectId) {
      console.error('Cannot navigate to ticket with invalid project ID:', ticket);
      toast.error('Cannot open ticket: Invalid project ID');
      return;
    }
    
    // Debug info to help track the issue
    console.log('Navigating to ticket:', {
      ticketId: ticket.id,
      projectId: ticketProjectId,
      url: `/board/${ticketProjectId}/ticket/${ticket.id}`
    });
    
    navigate(`/board/${ticketProjectId}/ticket/${ticket.id}`);
  };

  // Ensure all tickets have unique IDs to avoid React key warnings and duplicates
  const uniqueTickets = React.useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    
    // Use a Map to deduplicate by ticket ID
    const ticketMap = new Map<string, TicketType>();
    
    tickets.forEach(ticket => {
      if (!ticket || !ticket.id) {
        console.error('Ticket missing ID:', ticket);
        return; // Skip tickets without IDs
      }
      
      // Always keep the most recent instance of a ticket if duplicates exist
      ticketMap.set(ticket.id, ticket);
    });
    
    // Return the deduplicated array of tickets
    return Array.from(ticketMap.values());
  }, [tickets]);

  return (
    <div className="flex-shrink-0 w-72">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="font-medium text-sm">{title}</h3>
          <div className="ml-2 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
            {uniqueTickets.length}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => onAddTicket(id)}
          aria-label={`Add ticket to ${title}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <motion.div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`bg-secondary/50 rounded-lg p-2 min-h-[12rem] h-full max-h-[calc(100vh-240px)] overflow-y-auto ${
              snapshot.isDraggingOver ? 'bg-secondary/80 ring-2 ring-primary/20' : ''
            }`}
            animate={{ 
              backgroundColor: snapshot.isDraggingOver ? 'rgba(237, 242, 247, 0.8)' : 'rgba(237, 242, 247, 0.5)',
            }}
            transition={{ duration: 0.2 }}
          >
            {uniqueTickets.map((ticket, index) => (
              <Draggable 
                key={ticket.id}
                draggableId={ticket.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mb-3"
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.8 : 1,
                    }}
                    data-ticket-id={ticket.id}
                    data-ticket-key={ticket.key}
                  >
                    <Ticket 
                      ticket={ticket} 
                      onClick={() => handleTicketClick(ticket)} 
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {uniqueTickets.length === 0 && (
              <div className="flex items-center justify-center h-20 border border-dashed border-secondary-foreground/20 rounded-lg mt-2">
                <p className="text-sm text-muted-foreground">No tickets</p>
              </div>
            )}
          </motion.div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;

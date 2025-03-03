
import React from 'react';
import { motion } from 'framer-motion';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Ticket as TicketType, Status } from '@/lib/types';
import Ticket from '../Ticket';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: Status;
  title: string;
  tickets: TicketType[];
  onOpenTicket: (ticket: TicketType) => void;
  onAddTicket: (status: Status) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tickets,
  onOpenTicket,
  onAddTicket
}) => {
  return (
    <div className="flex-shrink-0 w-72">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="font-medium text-sm">{title}</h3>
          <div className="ml-2 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
            {tickets.length}
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
            {tickets.map((ticket, index) => (
              <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
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
                  >
                    <Ticket 
                      ticket={ticket} 
                      onClick={() => {
                        console.log('Ticket click triggered from column:', ticket.id, ticket.summary);
                        onOpenTicket(ticket);
                      }} 
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {tickets.length === 0 && (
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

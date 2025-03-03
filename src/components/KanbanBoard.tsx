
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Ticket as TicketType, Board as BoardType, Status } from '@/lib/types';
import Ticket from './Ticket';
import TicketModal from './TicketModal';
import CreateTicketModal from './CreateTicketModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanBoardProps {
  board: BoardType;
  onTicketMove?: (ticketId: string, sourceColumn: Status, destinationColumn: Status) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ board, onTicketMove }) => {
  const [columns, setColumns] = useState(board.columns);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<Status | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenTicket = useCallback((ticket: TicketType) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  }, []);

  const handleCloseTicketModal = useCallback(() => {
    setIsTicketModalOpen(false);
    setSelectedTicket(null);
  }, []);

  const handleOpenCreateModal = (status: Status) => {
    setCreateModalStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateModalStatus(null);
  };

  const handleTicketCreate = (newTicket: TicketType) => {
    const newColumns = columns.map(col => {
      if (col.id === newTicket.status) {
        return {
          ...col,
          tickets: [...col.tickets, newTicket]
        };
      }
      return col;
    });
    
    setColumns(newColumns);
  };

  const handleTicketUpdate = (updatedTicket: TicketType) => {
    // Check if status has changed
    const oldStatus = selectedTicket?.status;
    const newStatus = updatedTicket.status;
    
    if (oldStatus !== newStatus) {
      // Status changed - need to move ticket between columns
      const newColumns = columns.map(col => {
        if (col.id === oldStatus) {
          // Remove from old column
          return {
            ...col,
            tickets: col.tickets.filter(t => t.id !== updatedTicket.id)
          };
        }
        if (col.id === newStatus) {
          // Add to new column
          return {
            ...col,
            tickets: [...col.tickets, updatedTicket]
          };
        }
        return col;
      });
      
      setColumns(newColumns);
    } else {
      // Just update the ticket in its current column
      const newColumns = columns.map(col => {
        if (col.id === updatedTicket.status) {
          return {
            ...col,
            tickets: col.tickets.map(t => 
              t.id === updatedTicket.id ? updatedTicket : t
            )
          };
        }
        return col;
      });
      
      setColumns(newColumns);
    }
    
    // Update selected ticket
    setSelectedTicket(updatedTicket);
  };

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Find source and destination columns
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    // Create new arrays
    const sourceTickets = [...sourceColumn.tickets];
    const destTickets = source.droppableId === destination.droppableId 
      ? sourceTickets 
      : [...destColumn.tickets];

    // Remove from source
    const [movedTicket] = sourceTickets.splice(source.index, 1);
    
    // Update ticket status if column changed
    const updatedTicket = { 
      ...movedTicket,
      status: destination.droppableId as Status,
      updatedAt: new Date()
    };

    // Add to destination
    destTickets.splice(destination.index, 0, updatedTicket);

    // Update columns
    const newColumns = columns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, tickets: sourceTickets };
      }
      if (col.id === destination.droppableId) {
        return { ...col, tickets: destTickets };
      }
      return col;
    });

    setColumns(newColumns);

    // If status changed, show a toast notification
    if (source.droppableId !== destination.droppableId) {
      toast.success(`Ticket moved to ${destination.droppableId.replace(/-/g, ' ')}`);
    }

    // Call external handler if provided
    if (onTicketMove) {
      onTicketMove(
        draggableId,
        source.droppableId as Status,
        destination.droppableId as Status
      );
    }
  }, [columns, onTicketMove]);

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4 pt-2 pr-4 pl-2">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <h3 className="font-medium text-sm">{column.title}</h3>
                  <div className="ml-2 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                    {column.tickets.length}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => handleOpenCreateModal(column.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <motion.div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`status-column ${snapshot.isDraggingOver ? 'bg-secondary/80 ring-2 ring-primary/20' : ''}`}
                    animate={{ 
                      backgroundColor: snapshot.isDraggingOver ? 'rgba(237, 242, 247, 0.8)' : 'rgba(237, 242, 247, 0.5)',
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {column.tickets.map((ticket, index) => (
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
                              onClick={() => handleOpenTicket(ticket)} 
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {column.tickets.length === 0 && (
                      <div className="flex items-center justify-center h-20 border border-dashed border-secondary-foreground/20 rounded-lg mt-2">
                        <p className="text-sm text-muted-foreground">No tickets</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {isTicketModalOpen && selectedTicket && (
        <TicketModal 
          isOpen={isTicketModalOpen} 
          onClose={handleCloseTicketModal} 
          ticket={selectedTicket}
          onTicketUpdate={handleTicketUpdate}
        />
      )}
      
      {isCreateModalOpen && createModalStatus && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          project={board.project}
          column={createModalStatus}
          onTicketCreate={handleTicketCreate}
        />
      )}
    </>
  );
};

export default KanbanBoard;

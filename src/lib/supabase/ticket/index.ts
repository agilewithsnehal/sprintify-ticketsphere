
import { createTicket } from './ticket-create';
import { 
  getAllTickets, 
  getTicketsByProjectId, 
  getTicketsByUserId, 
  getChildTickets 
} from './ticket-queries';
import { 
  updateTicket,
  getTicketById
} from './ticket-update';
import { deleteTicket } from './ticket-delete';
import { searchTickets } from './ticket-search';

// Export all ticket-related functions
export const ticketService = {
  createTicket,
  getAllTickets,
  getTicketsByProjectId,
  getTicketsByUserId,
  getChildTickets,
  updateTicket,
  getTicketById,
  deleteTicket,
  searchTickets
};

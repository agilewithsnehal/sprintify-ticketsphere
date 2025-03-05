
import { getTicketsByProjectId, getAllTickets, getChildTickets } from './ticket-queries';
import { createTicket } from './ticket-create';
import { updateTicket } from './ticket-update';
import { deleteTicket } from './ticket-delete';
import { searchTickets } from './ticket-search';

export const ticketService = {
  getTicketsByProjectId,
  getAllTickets,
  getChildTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  searchTickets,
};

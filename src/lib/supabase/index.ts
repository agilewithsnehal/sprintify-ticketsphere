
import { supabaseService as projectService } from './project-service';
import { supabaseService as boardService } from './board-service';
import { supabaseService as userService } from './user-service';
import { supabaseService as commentService } from './comment-service';
import { ticketService } from './ticket';

// Combine all services into one
export const supabaseService = {
  // Project operations
  ...projectService,
  
  // Board operations
  ...boardService,
  
  // User operations
  ...userService,
  
  // Comment operations
  ...commentService,
  
  // Ticket operations
  createTicket: ticketService.createTicket,
  getAllTickets: ticketService.getAllTickets, 
  getTicketsByProjectId: ticketService.getTicketsByProjectId,
  getTicketsByUserId: ticketService.getTicketsByUserId,
  getChildTickets: ticketService.getChildTickets,
  updateTicket: ticketService.updateTicket,
  getTicketById: ticketService.getTicketById,
  deleteTicket: ticketService.deleteTicket,
  searchTickets: ticketService.searchTickets,
  
  // Also expose the full ticket service for direct access to all ticket operations
  ticket: ticketService
};

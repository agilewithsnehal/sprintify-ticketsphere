
import { supabaseService as projectService } from './project-service';
import { ticketService } from './ticket';
import { supabaseService as commentService } from './comment-service';
import { supabaseService as userService } from './user-service';
import { supabaseService as boardService } from './board-service';

export const supabaseService = {
  // Project operations
  getAllProjects: projectService.getAllProjects,
  getProjectById: projectService.getProjectById,
  createProject: projectService.createProject,
  deleteProject: projectService.deleteProject,

  // Ticket operations
  getTicketsByProjectId: ticketService.getTicketsByProjectId,
  getAllTickets: ticketService.getAllTickets,
  getChildTickets: ticketService.getChildTickets,
  createTicket: ticketService.createTicket,
  updateTicket: ticketService.updateTicket,
  deleteTicket: ticketService.deleteTicket,
  searchTickets: ticketService.searchTickets,

  // Comment operations
  addComment: commentService.addComment,

  // User operations
  getCurrentUser: userService.getCurrentUser,
  updateUserProfile: userService.updateUserProfile,
  uploadProfileImage: userService.uploadProfileImage,

  // Board operations
  createBoard: boardService.createBoard,
  updateBoardColumns: boardService.updateBoardColumns,
  resetBoardColumns: boardService.resetBoardColumns,
};

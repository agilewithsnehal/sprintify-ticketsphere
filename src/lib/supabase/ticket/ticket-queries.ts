
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/lib/types";
import { mapDbTicketToTicket } from "../utils";

/**
 * Fetches all tickets for a specific project
 */
export async function getTicketsByProjectId(projectId: string): Promise<Ticket[]> {
  try {
    const { data: dbTickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tickets = await Promise.all(
      dbTickets.map(ticket => mapDbTicketToTicket(ticket))
    );

    return tickets;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
}

/**
 * Fetches all tickets across all projects
 */
export async function getAllTickets(): Promise<Ticket[]> {
  try {
    const { data: dbTickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const tickets = await Promise.all(
      dbTickets.map(ticket => mapDbTicketToTicket(ticket))
    );

    return tickets;
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    return [];
  }
}

/**
 * Fetches all child tickets for a specific parent ticket
 */
export async function getChildTickets(ticketId: string): Promise<Ticket[]> {
  try {
    const { data: dbTickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('parent_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tickets = await Promise.all(
      dbTickets.map(ticket => mapDbTicketToTicket(ticket))
    );

    return tickets;
  } catch (error) {
    console.error('Error fetching child tickets:', error);
    return [];
  }
}

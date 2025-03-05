
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/lib/types";
import { mapDbTicketToTicket } from "../utils";

/**
 * Searches for tickets matching a query string
 */
export async function searchTickets(query: string): Promise<Ticket[]> {
  try {
    const { data: dbTickets, error } = await supabase
      .from('tickets')
      .select('*')
      .or(`summary.ilike.%${query}%,description.ilike.%${query}%,key.ilike.%${query}%`);

    if (error) throw error;
    
    const tickets = await Promise.all(
      dbTickets.map(ticket => mapDbTicketToTicket(ticket))
    );
    
    return tickets;
  } catch (error) {
    console.error('Error searching tickets:', error);
    return [];
  }
}

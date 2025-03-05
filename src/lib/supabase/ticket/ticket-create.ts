
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/lib/types";
import { mapDbTicketToTicket } from "../utils";

/**
 * Creates a new ticket in the database
 */
export async function createTicket(newTicket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>): Promise<Ticket | null> {
  try {
    console.log('Creating new ticket in database:', newTicket.key);
    
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('id, key')
      .eq('key', newTicket.key);
    
    if (existingTickets && existingTickets.length > 0) {
      console.error('A ticket with this key already exists:', newTicket.key);
      return null;
    }
    
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        key: newTicket.key,
        summary: newTicket.summary,
        description: newTicket.description,
        status: newTicket.status,
        priority: newTicket.priority,
        issue_type: newTicket.issueType || 'task',
        assignee_id: newTicket.assignee?.id,
        reporter_id: newTicket.reporter.id,
        project_id: newTicket.project.id,
        parent_id: newTicket.parentId
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting ticket:', error);
      throw error;
    }
    
    return ticket ? await mapDbTicketToTicket(ticket) : null;
  } catch (error) {
    console.error('Error creating ticket:', error);
    return null;
  }
}

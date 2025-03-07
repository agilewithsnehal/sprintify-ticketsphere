
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/lib/types";
import { mapDbTicketToTicket } from "../utils";

/**
 * Creates a new ticket in the database
 */
export async function createTicket(newTicket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>): Promise<Ticket | null> {
  try {
    console.log('Creating new ticket in database:', newTicket.key, 'with status:', newTicket.status);
    
    // First, check if a ticket with this key already exists
    const { data: existingTickets, error: checkError } = await supabase
      .from('tickets')
      .select('id, key')
      .eq('key', newTicket.key);
    
    if (checkError) {
      console.error('Error checking for existing ticket:', checkError);
      return null;
    }
    
    if (existingTickets && existingTickets.length > 0) {
      console.error('A ticket with this key already exists:', newTicket.key);
      return null;
    }
    
    // Prepare the ticket data for insertion
    const ticketData = {
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
    };
    
    console.log('Inserting ticket with data:', JSON.stringify(ticketData));
    
    // Insert the new ticket
    const { data: insertedTicket, error: insertError } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select('*')
      .single();

    if (insertError) {
      console.error('Error inserting ticket:', insertError);
      return null;
    }
    
    if (!insertedTicket) {
      console.error('No ticket returned after insert');
      return null;
    }
    
    console.log('Ticket inserted successfully with ID:', insertedTicket.id);
    
    // Force a delay to ensure the database has time to fully process the insert
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Retrieve the ticket directly to ensure we get the latest data
    const { data: freshTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', insertedTicket.id)
      .single();
      
    if (fetchError || !freshTicket) {
      console.error('Error fetching inserted ticket:', fetchError);
      // Fall back to the inserted ticket data if we can't fetch the fresh data
      const mappedTicket = await mapDbTicketToTicket(insertedTicket);
      return mappedTicket;
    }
    
    // Map the database ticket to our application ticket type
    const mappedTicket = await mapDbTicketToTicket(freshTicket);
    console.log('Mapped ticket:', JSON.stringify(mappedTicket));
    
    // Broadcast a ticket creation event
    document.dispatchEvent(new CustomEvent('ticket-created', {
      detail: { ticket: mappedTicket }
    }));
    
    return mappedTicket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    return null;
  }
}

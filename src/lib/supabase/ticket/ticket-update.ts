
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/lib/types";
import { mapDbTicketToTicket } from "../utils";

/**
 * Updates an existing ticket in the database
 */
export async function updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  try {
    console.log(`Updating ticket ${ticketId} with:`, 
      JSON.stringify({
        status: updates.status,
        priority: updates.priority,
        summary: updates.summary ? updates.summary.substring(0, 20) + '...' : undefined
      })
    );
    
    const updateData: any = {};
    
    if (updates.summary !== undefined) updateData.summary = updates.summary;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.issueType !== undefined) updateData.issue_type = updates.issueType;
    if (updates.assignee !== undefined) updateData.assignee_id = updates.assignee?.id || null;
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
    
    // Always add updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Execute the update in the database
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select('*')
      .single();

    if (error) {
      console.error('Error in Supabase update:', error);
      throw error;
    }
    
    if (!ticket) {
      console.error('No ticket returned after update');
      return null;
    }
    
    console.log(`Successfully updated ticket ${ticketId} in database`);
    
    // Map the database ticket to our application ticket type and return it
    return await mapDbTicketToTicket(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return null;
  }
}

/**
 * Gets a ticket by ID from the database
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  try {
    console.log(`Fetching ticket ${ticketId}`);
    
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
    
    if (!ticket) {
      console.error('No ticket found with ID:', ticketId);
      return null;
    }
    
    // Map the database ticket to our application ticket type and return it
    return await mapDbTicketToTicket(ticket);
  } catch (error) {
    console.error('Error getting ticket by ID:', error);
    return null;
  }
}

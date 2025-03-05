
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/lib/types";
import { mapDbTicketToTicket } from "../utils";

/**
 * Updates an existing ticket in the database
 */
export async function updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  try {
    const updateData: any = {};
    
    if (updates.summary !== undefined) updateData.summary = updates.summary;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.issueType !== undefined) updateData.issue_type = updates.issueType;
    if (updates.assignee !== undefined) updateData.assignee_id = updates.assignee?.id || null;
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
    
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    
    return ticket ? await mapDbTicketToTicket(ticket) : null;
  } catch (error) {
    console.error('Error updating ticket:', error);
    return null;
  }
}

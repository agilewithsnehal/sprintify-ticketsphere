
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
    
    // If status is changing and we're not already in the middle of a parent update cascade
    // (to prevent recursion)
    if (updates.status !== undefined && !updates.fromParentUpdate) {
      // Always update all ancestors in the hierarchy when a status changes
      await updateParentHierarchyStatus(ticket.parent_id, updates.status as string);
    }
    
    // Map the database ticket to our application ticket type and return it
    return await mapDbTicketToTicket(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return null;
  }
}

/**
 * Recursively updates parent ticket statuses through the entire hierarchy chain
 * This ensures ALL parent tickets (epic, feature, story) change status when children change
 */
async function updateParentHierarchyStatus(parentId: string | null, newStatus: string): Promise<void> {
  if (!parentId) return;
  
  try {
    console.log(`Checking if parent ticket ${parentId} should be updated to status ${newStatus}`);
    
    // First, get the parent ticket
    const { data: parentTicket, error: parentError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', parentId)
      .single();
    
    if (parentError || !parentTicket) {
      console.error('Error fetching parent ticket:', parentError);
      return;
    }
    
    // For 'done' status, we need to verify all children are done
    // For other statuses, we can immediately update the parent
    if (newStatus === 'done') {
      // Get all immediate children of this parent
      const { data: childTickets, error: childrenError } = await supabase
        .from('tickets')
        .select('*')
        .eq('parent_id', parentId);
      
      if (childrenError) {
        console.error('Error fetching child tickets:', childrenError);
        return;
      }
      
      // Check if ALL children are done
      const allChildrenDone = childTickets.every(child => child.status === 'done');
      
      if (!allChildrenDone) {
        console.log(`Not updating parent ${parentId} to done - some children are not done yet`);
        return;
      }
      
      console.log(`All children of ${parentId} are done, updating parent to done`);
    }
    
    // Always update parent status to match the child's new status (except for 'done' which
    // requires the all-children-done check above)
    console.log(`Updating parent ticket ${parentId} status to ${newStatus}`);
    
    // Set fromParentUpdate flag to prevent infinite recursion
    await updateTicket(parentId, { 
      status: newStatus as any, 
      fromParentUpdate: true 
    });
    
    // Continue the chain by updating this parent's parent (if any)
    // This ensures the entire hierarchy gets updated (task → story → feature → epic)
    if (parentTicket.parent_id) {
      await updateParentHierarchyStatus(parentTicket.parent_id, newStatus);
    }
  } catch (error) {
    console.error('Error updating parent hierarchy status:', error);
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

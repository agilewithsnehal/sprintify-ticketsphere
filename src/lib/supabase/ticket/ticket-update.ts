
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Status } from "@/lib/types";
import { mapDbTicketToTicket } from "../utils";

// Status progression order for validation
const statusOrder: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];

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
    
    // If status is changing, perform additional validation
    if (updates.status && !updates.fromParentUpdate) {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      if (ticketError || !ticket) {
        console.error('Error fetching ticket for validation:', ticketError);
        return null;
      }
      
      // Check if we're moving forward in the workflow
      const currentStatusIndex = statusOrder.indexOf(ticket.status as Status);
      const newStatusIndex = statusOrder.indexOf(updates.status as Status);
      const isMovingForward = newStatusIndex > currentStatusIndex;
      
      // If this is a parent ticket (no parent_id) and moving forward
      if (!ticket.parent_id && isMovingForward) {
        // Get all children of this parent
        const { data: childTickets, error: childError } = await supabase
          .from('tickets')
          .select('*')
          .eq('parent_id', ticketId);
        
        if (childError) {
          console.error('Error fetching child tickets for validation:', childError);
          return null;
        }
        
        if (childTickets && childTickets.length > 0) {
          // For "done" status, all children must be done
          if (updates.status === 'done') {
            const pendingChildren = childTickets.filter(child => child.status !== 'done');
            
            if (pendingChildren.length > 0) {
              console.error('Cannot move parent to done: Some children are not done');
              throw new Error('All child tickets must be done before moving parent to done');
            }
          } else {
            // For other statuses, no child can be in an earlier status
            const childrenBehind = childTickets.filter(child => {
              const childStatusIndex = statusOrder.indexOf(child.status as Status);
              return childStatusIndex < newStatusIndex;
            });
            
            if (childrenBehind.length > 0) {
              console.error('Cannot move parent ahead of children');
              throw new Error('Cannot move parent ticket ahead of its children');
            }
          }
        }
      }
    }
    
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
    // (to prevent recursion), update all parents immediately
    if (updates.status !== undefined && !updates.fromParentUpdate) {
      // Always update all ancestors in the hierarchy when a status changes
      // We need to update the entire chain immediately
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
    
    // Special case for 'done' status, we need to verify all children are done
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
    } else {
      // For other statuses, make sure no child would be ahead of the parent
      const currentStatusIndex = statusOrder.indexOf(parentTicket.status as Status);
      const newStatusIndex = statusOrder.indexOf(newStatus as Status);
      
      // If we're moving the parent backward in the workflow (e.g., from review to in-progress)
      // This is always allowed since it won't place any children ahead of the parent
      if (newStatusIndex <= currentStatusIndex) {
        console.log(`Moving parent ${parentId} backward from ${parentTicket.status} to ${newStatus}`);
      } else {
        // If moving forward, validate no children are behind
        const { data: childTickets, error: childrenError } = await supabase
          .from('tickets')
          .select('*')
          .eq('parent_id', parentId);
        
        if (childrenError) {
          console.error('Error fetching child tickets:', childrenError);
          return;
        }
        
        // Check if ANY children would be behind the parent
        const childrenBehind = childTickets.filter(child => {
          const childStatusIndex = statusOrder.indexOf(child.status as Status);
          return childStatusIndex < newStatusIndex;
        });
        
        if (childrenBehind.length > 0) {
          console.log(`Not updating parent ${parentId} to ${newStatus} - some children would be left behind`);
          return;
        }
      }
    }
    
    // For all other statuses (or 'done' when all children are done),
    // immediately update the parent ticket's status
    console.log(`Updating parent ticket ${parentId} status to ${newStatus}`);
    
    // Update the parent ticket status directly in the database
    const { data: updatedParent, error: updateError } = await supabase
      .from('tickets')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parentId)
      .select('*')
      .single();
    
    if (updateError || !updatedParent) {
      console.error('Error updating parent ticket status:', updateError);
      return;
    }
    
    // Dispatch an event to notify the UI that a parent ticket has been updated
    // This allows the UI to update without requiring a full board refresh
    document.dispatchEvent(new CustomEvent('ticket-parent-updated', {
      detail: { 
        parentId: parentId, 
        newStatus: newStatus 
      }
    }));
    
    // Continue the chain by updating this parent's parent (if any)
    // This ensures the entire hierarchy gets updated (task → story → feature → epic)
    if (updatedParent.parent_id) {
      await updateParentHierarchyStatus(updatedParent.parent_id, newStatus);
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

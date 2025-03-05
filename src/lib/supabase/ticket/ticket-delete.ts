
import { supabase } from "@/integrations/supabase/client";
import { getChildTickets } from "./ticket-queries";

/**
 * Deletes a ticket from the database, with options for handling child tickets
 */
export async function deleteTicket(ticketId: string): Promise<boolean> {
  try {
    // Check if we should delete children
    const deleteWithChildren = localStorage.getItem('delete_with_children') === 'true';
    console.log('Delete with children:', deleteWithChildren);
    
    // First get any child tickets
    const childTickets = await getChildTickets(ticketId);
    
    if (deleteWithChildren && childTickets.length > 0) {
      console.log(`Deleting ${childTickets.length} child tickets`);
      
      // Delete all child tickets one by one
      for (const child of childTickets) {
        const { error: childDeleteError } = await supabase
          .from('tickets')
          .delete()
          .eq('id', child.id);
          
        if (childDeleteError) {
          console.error('Error deleting child ticket:', childDeleteError);
        }
      }
    } else if (childTickets.length > 0) {
      // Update any child tickets to remove the parent reference
      console.log('Removing parent reference from child tickets');
      const { error: childUpdateError } = await supabase
        .from('tickets')
        .update({ parent_id: null })
        .eq('parent_id', ticketId);
        
      if (childUpdateError) {
        console.error('Error removing parent references from child tickets:', childUpdateError);
      }
    }
    
    // Now delete the ticket
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) throw error;
    
    // Clean up local storage
    localStorage.removeItem('delete_with_children');
    
    return true;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    localStorage.removeItem('delete_with_children');
    return false;
  }
}


import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/lib/types";
import { mapDbTicketToTicket } from "./utils";

export const supabaseService = {
  async getTicketsByProjectId(projectId: string): Promise<Ticket[]> {
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
  },

  async getAllTickets(): Promise<Ticket[]> {
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
  },

  async getChildTickets(ticketId: string): Promise<Ticket[]> {
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
  },

  async createTicket(newTicket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>): Promise<Ticket | null> {
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
  },

  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket | null> {
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
  },

  async deleteTicket(ticketId: string): Promise<boolean> {
    try {
      // Check if we should delete children
      const deleteWithChildren = localStorage.getItem('delete_with_children') === 'true';
      console.log('Delete with children:', deleteWithChildren);
      
      // First get any child tickets
      const childTickets = await this.getChildTickets(ticketId);
      
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
  },

  async searchTickets(query: string): Promise<Ticket[]> {
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
  },
};

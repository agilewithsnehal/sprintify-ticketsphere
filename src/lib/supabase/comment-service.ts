
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/lib/types";

export const supabaseService = {
  async addComment(ticketId: string, content: string, authorId: string): Promise<Comment | null> {
    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          ticket_id: ticketId,
          content,
          author_id: authorId
        })
        .select()
        .single();

      if (error) throw error;
      
      if (!comment) return null;

      const { data: author } = await supabase
        .from('users')
        .select('*')
        .eq('id', comment.author_id)
        .single();

      await supabase
        .from('tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      return {
        id: comment.id,
        content: comment.content,
        createdAt: new Date(comment.created_at),
        author: {
          id: author.id,
          name: author.name,
          email: author.email,
          avatar: author.avatar,
          role: author.role as 'admin' | 'manager' | 'developer' | 'viewer'
        }
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  },
};

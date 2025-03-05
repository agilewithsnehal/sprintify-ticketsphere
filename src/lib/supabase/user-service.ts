
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/lib/types";

export const supabaseService = {
  async getCurrentUser(): Promise<User> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
    };
  },
};

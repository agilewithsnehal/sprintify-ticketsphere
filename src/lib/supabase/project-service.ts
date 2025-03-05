
import { supabase } from "@/integrations/supabase/client";
import { Project, User } from "@/lib/types";

export const supabaseService = {
  async getAllProjects(): Promise<Project[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projectsWithDetails = await Promise.all(
        projects.map(async (project) => {
          const { data: memberIds } = await supabase
            .from('project_members')
            .select('user_id')
            .eq('project_id', project.id);

          const memberPromises = memberIds?.map(async ({ user_id }) => {
            const { data } = await supabase
              .from('users')
              .select('*')
              .eq('id', user_id)
              .single();
            
            return data ? {
              id: data.id,
              name: data.name,
              email: data.email,
              avatar: data.avatar,
              role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
            } : null;
          }) || [];

          const members = (await Promise.all(memberPromises)).filter(Boolean) as User[];

          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            key: project.key,
            members,
            lead: members.find(m => m.role === 'admin') || members[0],
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.updated_at)
          };
        })
      );

      return projectsWithDetails;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (!project) return null;

      const { data: memberIds } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', project.id);

      const memberPromises = memberIds?.map(async ({ user_id }) => {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user_id)
          .single();
        
        return data ? {
          id: data.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
        } : null;
      }) || [];

      const members = (await Promise.all(memberPromises)).filter(Boolean) as User[];

      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        key: project.key,
        members,
        lead: members.find(m => m.role === 'admin') || members[0],
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at)
      };
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  },

  async createProject(newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project | null> {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name,
          description: newProject.description,
          key: newProject.key
        })
        .select()
        .single();

      if (error) throw error;
      if (!project) return null;
      
      const memberPromises = newProject.members.map(async (member) => {
        return supabase
          .from('project_members')
          .insert({
            project_id: project.id,
            user_id: member.id
          });
      });
      
      await Promise.all(memberPromises);
      
      return this.getProjectById(project.id);
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  },

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const { error: ticketsError } = await supabase
        .from('tickets')
        .delete()
        .eq('project_id', projectId);

      if (ticketsError) throw ticketsError;

      const { error: membersError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId);

      if (membersError) throw membersError;

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  },
};

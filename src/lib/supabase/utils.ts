
import { supabase } from "@/integrations/supabase/client";
import { Comment, Priority, Project, Status, Ticket, User, IssueType } from "@/lib/types";

export async function mapDbTicketToTicket(dbTicket: any): Promise<Ticket> {
  const { data: projectData } = await supabase
    .from('projects')
    .select('*')
    .eq('id', dbTicket.project_id)
    .single();
  
  let assignee: User | undefined = undefined;
  if (dbTicket.assignee_id) {
    const { data: assigneeData } = await supabase
      .from('users')
      .select('*')
      .eq('id', dbTicket.assignee_id)
      .single();
    
    if (assigneeData) {
      assignee = {
        id: assigneeData.id,
        name: assigneeData.name,
        email: assigneeData.email,
        avatar: assigneeData.avatar,
        role: assigneeData.role as 'admin' | 'manager' | 'developer' | 'viewer'
      };
    }
  }

  const { data: reporterData } = await supabase
    .from('users')
    .select('*')
    .eq('id', dbTicket.reporter_id)
    .single();

  const { data: memberIds } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', dbTicket.project_id);

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

  const { data: commentsData } = await supabase
    .from('comments')
    .select('*')
    .eq('ticket_id', dbTicket.id)
    .order('created_at', { ascending: true });

  const commentPromises = commentsData?.map(async (comment) => {
    const { data: authorData } = await supabase
      .from('users')
      .select('*')
      .eq('id', comment.author_id)
      .single();
    
    return {
      id: comment.id,
      content: comment.content,
      createdAt: new Date(comment.created_at),
      author: authorData ? {
        id: authorData.id,
        name: authorData.name,
        email: authorData.email,
        avatar: authorData.avatar,
        role: authorData.role as 'admin' | 'manager' | 'developer' | 'viewer'
      } : {
        id: reporterData.id,
        name: reporterData.name,
        email: reporterData.email,
        avatar: reporterData.avatar,
        role: reporterData.role as 'admin' | 'manager' | 'developer' | 'viewer'
      }
    };
  }) || [];

  const comments = await Promise.all(commentPromises);

  const project: Project = {
    id: projectData.id,
    name: projectData.name,
    description: projectData.description || '',
    key: projectData.key,
    members: members,
    lead: members.find(m => m.role === 'admin') || members[0],
    createdAt: new Date(projectData.created_at),
    updatedAt: new Date(projectData.updated_at)
  };

  return {
    id: dbTicket.id,
    key: dbTicket.key,
    summary: dbTicket.summary,
    description: dbTicket.description || '',
    status: dbTicket.status as Status,
    priority: dbTicket.priority as Priority,
    issueType: dbTicket.issue_type as IssueType || 'task',
    assignee: assignee,
    reporter: {
      id: reporterData.id,
      name: reporterData.name,
      email: reporterData.email,
      avatar: reporterData.avatar,
      role: reporterData.role as 'admin' | 'manager' | 'developer' | 'viewer'
    },
    project: project,
    createdAt: new Date(dbTicket.created_at),
    updatedAt: new Date(dbTicket.updated_at),
    comments: comments,
    parentId: dbTicket.parent_id || undefined
  };
}

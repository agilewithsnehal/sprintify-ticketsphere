
export type Priority = 'low' | 'medium' | 'high';

export type Status = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';

export type IssueType = 'epic' | 'feature' | 'story' | 'task';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'developer' | 'viewer';
};

export type Project = {
  id: string;
  name: string;
  description: string;
  key: string;
  lead: User;
  members: User[];
  createdAt: Date;
  updatedAt: Date;
};

export type Ticket = {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: Status;
  priority: Priority;
  issueType: IssueType;
  assignee?: User;
  reporter: User;
  project: Project;
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
  parentId?: string; // ID of the parent ticket (epic -> feature -> story -> task)
  children?: Ticket[]; // Child tickets
};

export type Comment = {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
};

export type Column = {
  id: Status;
  title: string;
  tickets: Ticket[];
};

export type Board = {
  id: string;
  name: string;
  columns: Column[];
  project: Project;
};

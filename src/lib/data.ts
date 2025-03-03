
import { User, Project, Ticket, Board, Status } from './types';

// Mock Users
export const users: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@clarity.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Sam Parker',
    email: 'sam@clarity.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'manager',
  },
  {
    id: '3',
    name: 'Taylor Chen',
    email: 'taylor@clarity.com',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'developer',
  },
  {
    id: '4',
    name: 'Morgan Smith',
    email: 'morgan@clarity.com',
    avatar: 'https://i.pravatar.cc/150?img=4',
    role: 'developer',
  },
];

// Mock Projects
export const projects: Project[] = [
  {
    id: '1',
    name: 'Clarity Design System',
    description: 'A comprehensive design system for all Clarity products',
    key: 'CDS',
    lead: users[0],
    members: users,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-04-10'),
  },
  {
    id: '2',
    name: 'Mobile App Redesign',
    description: 'Redesigning the mobile experience with focus on simplicity',
    key: 'MAR',
    lead: users[1],
    members: [users[1], users[2], users[3]],
    createdAt: new Date('2023-02-28'),
    updatedAt: new Date('2023-05-01'),
  },
];

// Mock Tickets
export const createMockTickets = (): Ticket[] => [
  {
    id: '1',
    key: `${projects[0].key}-1`,
    summary: 'Create component library documentation',
    description: 'Develop comprehensive documentation for all UI components',
    status: 'in-progress',
    priority: 'high',
    assignee: users[2],
    reporter: users[0],
    project: projects[0],
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2023-03-05'),
    comments: [
      {
        id: '1',
        author: users[0],
        content: 'Make sure to include usage examples for each component',
        createdAt: new Date('2023-03-02'),
      },
      {
        id: '2',
        author: users[2],
        content: 'Working on it. Will include code snippets as well',
        createdAt: new Date('2023-03-03'),
      },
    ],
  },
  {
    id: '2',
    key: `${projects[0].key}-2`,
    summary: 'Implement dark mode',
    description: 'Add dark mode support to all components in the design system',
    status: 'todo',
    priority: 'medium',
    assignee: users[3],
    reporter: users[1],
    project: projects[0],
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-03-05'),
    comments: [],
  },
  {
    id: '3',
    key: `${projects[0].key}-3`,
    summary: 'Accessibility audit',
    description: 'Conduct a thorough accessibility audit on all components',
    status: 'backlog',
    priority: 'high',
    assignee: users[1],
    reporter: users[0],
    project: projects[0],
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10'),
    comments: [],
  },
  {
    id: '4',
    key: `${projects[0].key}-4`,
    summary: 'Design token system',
    description: 'Create a consistent design token system for colors, spacing, and typography',
    status: 'review',
    priority: 'high',
    assignee: users[3],
    reporter: users[0],
    project: projects[0],
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-03-20'),
    comments: [],
  },
  {
    id: '5',
    key: `${projects[0].key}-5`,
    summary: 'Performance optimization',
    description: 'Optimize performance of component rendering and animations',
    status: 'done',
    priority: 'medium',
    assignee: users[2],
    reporter: users[1],
    project: projects[0],
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-15'),
    comments: [],
  },
  {
    id: '6',
    key: `${projects[1].key}-1`,
    summary: 'User research for mobile app',
    description: 'Conduct user interviews to gather feedback on current mobile experience',
    status: 'in-progress',
    priority: 'high',
    assignee: users[1],
    reporter: users[1],
    project: projects[1],
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2023-03-18'),
    comments: [],
  },
  {
    id: '7',
    key: `${projects[1].key}-2`,
    summary: 'Wireframe new navigation',
    description: 'Create wireframes for the new navigation system',
    status: 'done',
    priority: 'high',
    assignee: users[1],
    reporter: users[1],
    project: projects[1],
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2023-03-10'),
    comments: [],
  },
  {
    id: '8',
    key: `${projects[1].key}-3`,
    summary: 'Implement new onboarding flow',
    description: 'Develop the new user onboarding experience based on designs',
    status: 'todo',
    priority: 'medium',
    assignee: users[2],
    reporter: users[1],
    project: projects[1],
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2023-03-20'),
    comments: [],
  },
];

// Mock Board
export const createBoard = (projectId: string): Board => {
  const project = projects.find(p => p.id === projectId) || projects[0];
  const tickets = createMockTickets().filter(ticket => ticket.project.id === projectId);
  
  const columns: { id: Status; title: string; tickets: Ticket[] }[] = [
    { id: 'backlog', title: 'Backlog', tickets: [] },
    { id: 'todo', title: 'To Do', tickets: [] },
    { id: 'in-progress', title: 'In Progress', tickets: [] },
    { id: 'review', title: 'Review', tickets: [] },
    { id: 'done', title: 'Done', tickets: [] },
  ];
  
  // Distribute tickets to their respective columns
  tickets.forEach(ticket => {
    const column = columns.find(col => col.id === ticket.status);
    if (column) {
      column.tickets.push(ticket);
    }
  });
  
  return {
    id: `board-${projectId}`,
    name: `${project.name} Board`,
    columns,
    project,
  };
};

// Get all tickets
export const getAllTickets = (): Ticket[] => createMockTickets();

// Get tickets by project
export const getTicketsByProject = (projectId: string): Ticket[] => {
  return createMockTickets().filter(ticket => ticket.project.id === projectId);
};

// Get ticket by ID
export const getTicketById = (ticketId: string): Ticket | undefined => {
  return createMockTickets().find(ticket => ticket.id === ticketId);
};

// Get project by ID
export const getProjectById = (projectId: string): Project | undefined => {
  return projects.find(project => project.id === projectId);
};

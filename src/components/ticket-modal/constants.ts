
export const priorityColors = {
  low: 'text-green-600',
  medium: 'text-amber-600',
  high: 'text-red-600'
};

export const statusColors = {
  'backlog': 'text-zinc-600',
  'todo': 'text-blue-600',
  'in-progress': 'text-amber-600',
  'review': 'text-purple-600',
  'done': 'text-green-600'
};

export const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export const statusOptions = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' }
];

// Background colors for status badges
export const statusBgColors = {
  'backlog': 'bg-zinc-100',
  'todo': 'bg-blue-100',
  'in-progress': 'bg-amber-100',
  'review': 'bg-purple-100',
  'done': 'bg-green-100'
};

// Background colors for priority badges
export const priorityBgColors = {
  'low': 'bg-green-100',
  'medium': 'bg-amber-100',
  'high': 'bg-red-100'
};

// Issue type options
export const issueTypeOptions = [
  { value: 'epic', label: 'Epic' },
  { value: 'feature', label: 'Feature' },
  { value: 'story', label: 'Story' },
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' }
];

// Issue type colors
export const issueTypeColors = {
  'epic': 'text-purple-600',
  'feature': 'text-blue-600',
  'story': 'text-green-600',
  'task': 'text-gray-600',
  'bug': 'text-red-600'
};

// Issue type background colors
export const issueTypeBgColors = {
  'epic': 'bg-purple-100',
  'feature': 'bg-blue-100',
  'story': 'bg-green-100',
  'task': 'bg-gray-100',
  'bug': 'bg-red-100'
};

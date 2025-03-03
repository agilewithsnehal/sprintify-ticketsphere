
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const StatusColor: Record<string, string> = {
  'backlog': 'bg-slate-500/80 text-slate-900',
  'todo': 'bg-blue-500/80 text-blue-900',
  'in-progress': 'bg-amber-500/80 text-amber-900',
  'review': 'bg-purple-500/80 text-purple-900',
  'done': 'bg-green-500/80 text-green-900',
};


import { Ticket, Status } from './types';

// Calculate the cycle time (time from in-progress to done) in days
export const calculateCycleTime = (ticket: Ticket): number => {
  if (ticket.status !== 'done') return 0;
  
  // Using timestamps to estimate cycle time
  // In a real system, we'd track status changes in a history table
  
  // For now, use a simple approach: Take the time between created date and updated date
  // with a random factor to simulate the start of work
  const updatedAt = new Date(ticket.updatedAt);
  const createdAt = new Date(ticket.createdAt);
  
  // Assume work started somewhere between creation and completion
  const workStartEstimate = new Date(
    createdAt.getTime() + (updatedAt.getTime() - createdAt.getTime()) * 0.3
  );
  
  // Calculate days difference
  const cycleTimeMs = updatedAt.getTime() - workStartEstimate.getTime();
  const cycleTimeDays = cycleTimeMs / (1000 * 60 * 60 * 24);
  
  return Math.max(0.5, parseFloat(cycleTimeDays.toFixed(1)));
};

// Calculate the lead time (time from creation to done) in days
export const calculateLeadTime = (ticket: Ticket): number => {
  if (ticket.status !== 'done') return 0;
  
  const updatedAt = new Date(ticket.updatedAt);
  const createdAt = new Date(ticket.createdAt);
  
  // Calculate days difference
  const leadTimeMs = updatedAt.getTime() - createdAt.getTime();
  const leadTimeDays = leadTimeMs / (1000 * 60 * 60 * 24);
  
  return Math.max(0.5, parseFloat(leadTimeDays.toFixed(1)));
};

// Calculate throughput (number of tickets completed in a given time period)
export const calculateThroughput = (tickets: Ticket[], periodDays: number = 7): number => {
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  
  const completedInPeriod = tickets.filter(ticket => 
    ticket.status === 'done' && 
    new Date(ticket.updatedAt) >= periodStart
  );
  
  return completedInPeriod.length;
};

// Calculate work in progress (WIP)
export const calculateWIP = (tickets: Ticket[]): number => {
  return tickets.filter(ticket => ticket.status === 'in-progress').length;
};

// Calculate work item age (how long items have been in their current status)
export const calculateWorkItemAge = (ticket: Ticket): number => {
  if (ticket.status === 'done') return 0;
  
  const now = new Date();
  const updatedAt = new Date(ticket.updatedAt);
  
  const ageMs = now.getTime() - updatedAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  
  return parseFloat(ageDays.toFixed(1));
};

// Calculate flow efficiency
export const calculateFlowEfficiency = (tickets: Ticket[]): number => {
  if (tickets.length === 0) return 0;
  
  const completedTickets = tickets.filter(ticket => ticket.status === 'done');
  if (completedTickets.length === 0) return 0;
  
  const totalCycleTime = completedTickets.reduce((sum, ticket) => sum + calculateCycleTime(ticket), 0);
  const totalLeadTime = completedTickets.reduce((sum, ticket) => sum + calculateLeadTime(ticket), 0);
  
  // Flow efficiency = Value-add time (cycle time) / Total time (lead time)
  return totalLeadTime > 0 ? (totalCycleTime / totalLeadTime) * 100 : 0;
};

// Calculate flow distribution (percentage of tickets in each status)
export const calculateFlowDistribution = (tickets: Ticket[]): Record<Status, number> => {
  const result: Partial<Record<Status, number>> = {};
  const statusCounts = tickets.reduce((acc, ticket) => {
    const status = ticket.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<Status, number>);
  
  const allStatuses: Status[] = ['backlog', 'todo', 'in-progress', 'review', 'done'];
  allStatuses.forEach(status => {
    result[status] = (statusCounts[status] || 0) / tickets.length * 100;
  });
  
  return result as Record<Status, number>;
};

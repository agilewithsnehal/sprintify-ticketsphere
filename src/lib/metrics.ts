
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

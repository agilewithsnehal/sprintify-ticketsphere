
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabaseService } from '@/lib/supabase';
import { Ticket as TicketType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { StandaloneTicket } from '@/components/project';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TicketPage = () => {
  const { projectId, ticketId } = useParams<{ projectId: string; ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [childTickets, setChildTickets] = useState<TicketType[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'with_children' | 'keep_children'>('keep_children');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        if (!ticketId || ticketId === 'undefined') {
          console.error('Invalid ticketId provided:', ticketId);
          setError('Invalid ticket ID provided');
          setLoading(false);
          return;
        }

        console.log('Fetching ticket with ID:', ticketId);
        
        const tickets = await supabaseService.getAllTickets();
        const foundTicket = tickets.find(t => t.id === ticketId);
        
        if (!foundTicket) {
          console.error('Ticket not found with ID:', ticketId);
          setError('Ticket not found');
          setLoading(false);
          return;
        }

        setTicket(foundTicket);
        console.log('Ticket loaded:', foundTicket);

        // Check for child tickets
        const children = await supabaseService.getChildTickets(ticketId);
        setChildTickets(children);
        console.log('Child tickets:', children.length);

        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  const handleTicketUpdate = async (updatedTicket: TicketType) => {
    if (ticket && 
        updatedTicket.comments.length > ticket.comments.length && 
        updatedTicket.status === ticket.status && 
        updatedTicket.priority === ticket.priority && 
        updatedTicket.assignee?.id === ticket.assignee?.id) {
      const newComment = updatedTicket.comments[updatedTicket.comments.length - 1];
      setTicket(updatedTicket);
      toast.success('Comment added successfully');
      return;
    }

    const result = await supabaseService.updateTicket(updatedTicket.id, updatedTicket);
    if (result) {
      toast.success('Ticket updated successfully');
      setTicket(result);
    } else {
      toast.error('Failed to update ticket');
    }
  };

  const handleInitiateDelete = () => {
    if (childTickets.length > 0) {
      setDeleteConfirmOpen(true);
    } else {
      handleTicketDelete();
    }
  };

  const handleTicketDelete = async () => {
    if (!ticket) return;
    
    try {
      setIsDeleting(true);
      
      // Set local storage flag for delete behavior if we have children
      if (childTickets.length > 0) {
        localStorage.setItem('delete_with_children', deleteOption === 'with_children' ? 'true' : 'false');
      }
      
      const success = await supabaseService.deleteTicket(ticket.id);
      
      if (success) {
        toast.success('Ticket deleted successfully');
        handleBack();
      } else {
        toast.error('Failed to delete ticket');
        setIsDeleting(false);
        setDeleteConfirmOpen(false);
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleBack = () => {
    if (projectId) {
      navigate(`/board/${projectId}`);
    } else if (ticket?.project.id) {
      navigate(`/board/${ticket.project.id}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-pulse text-lg">Loading ticket...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !ticket) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="text-lg text-red-500">{error || 'Ticket not found'}</div>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
            {projectId && (
              <Button 
                variant="outline" 
                onClick={() => navigate(`/board/${projectId}`)}
                className="mt-2"
              >
                Back to Board
              </Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Board
          </Button>
        </div>
        
        <div className="bg-background rounded-lg shadow-sm border p-0">
          <StandaloneTicket
            ticket={ticket}
            onTicketUpdate={handleTicketUpdate}
            onTicketDelete={handleInitiateDelete}
            currentUser={currentUser}
          />
        </div>
        
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Ticket with Child Issues
              </AlertDialogTitle>
              <AlertDialogDescription>
                This ticket has {childTickets.length} child {childTickets.length === 1 ? 'issue' : 'issues'}. 
                How would you like to proceed?
                
                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="deleteOption" 
                      checked={deleteOption === 'keep_children'} 
                      onChange={() => setDeleteOption('keep_children')}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="font-medium">Keep child issues</p>
                      <p className="text-sm text-muted-foreground">
                        Child issues will be kept but will no longer be linked to this parent issue.
                      </p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="deleteOption" 
                      checked={deleteOption === 'with_children'} 
                      onChange={() => setDeleteOption('with_children')}
                      className="rounded border-gray-300 text-destructive focus:ring-destructive"
                    />
                    <div>
                      <p className="font-medium">Delete child issues</p>
                      <p className="text-sm text-muted-foreground">
                        This will permanently delete this ticket and all of its child issues.
                      </p>
                    </div>
                  </label>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleTicketDelete();
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : deleteOption === 'with_children' ? 
                  'Delete All Issues' : 'Delete and Keep Children'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default TicketPage;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabaseService } from '@/lib/supabase-service';
import { Ticket as TicketType, Comment } from '@/lib/types';
import TicketModal from '@/components/ticket-modal';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { StandaloneTicket } from '@/components/project';

const TicketPage = () => {
  const { projectId, ticketId } = useParams<{ projectId: string; ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        // Validate ticketId
        if (!ticketId || ticketId === 'undefined') {
          console.error('Invalid ticketId provided:', ticketId);
          setError('Invalid ticket ID provided');
          setLoading(false);
          return;
        }

        console.log('Fetching ticket with ID:', ticketId);
        
        // Get all tickets and find the one we need
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

        // Load current user
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
    try {
      // If adding a comment, we don't need to update the entire ticket
      if (ticket && 
          updatedTicket.comments.length > ticket.comments.length && 
          updatedTicket.status === ticket.status && 
          updatedTicket.priority === ticket.priority && 
          updatedTicket.assignee?.id === ticket.assignee?.id) {
        // The last comment is the new one
        const newComment = updatedTicket.comments[updatedTicket.comments.length - 1];
        // No need to call updateTicket, as the comment is already added to the database in the TicketModal
        setTicket(updatedTicket);
        toast.success('Comment added successfully');
        return;
      }

      // For other updates, proceed with updating the ticket
      const result = await supabaseService.updateTicket(updatedTicket.id, updatedTicket);
      if (result) {
        toast.success('Ticket updated successfully');
        setTicket(result);
      } else {
        toast.error('Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    }
  };

  const handleTicketDelete = async () => {
    if (!ticket) return;
    
    try {
      setIsDeleting(true);
      // Call the actual delete method from the supabase service
      const success = await supabaseService.deleteTicket(ticket.id);
      
      if (success) {
        toast.success('Ticket deleted successfully');
        handleBack();
      } else {
        toast.error('Failed to delete ticket');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
      setIsDeleting(false);
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
            onTicketDelete={handleTicketDelete}
            currentUser={currentUser}
          />
        </div>
      </div>
    </Layout>
  );
};

export default TicketPage;

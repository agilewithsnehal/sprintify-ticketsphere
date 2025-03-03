
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Ticket } from '@/lib/types';
import { MessageSquare, AlertCircle, Clock, CalendarIcon, Edit, X } from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
};

const statusColors = {
  'backlog': 'bg-gray-100 text-gray-800',
  'todo': 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  'review': 'bg-yellow-100 text-yellow-800',
  'done': 'bg-green-100 text-green-800',
};

const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, ticket }) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(ticket.createdAt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs font-medium">{ticket.key}</Badge>
                <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </Badge>
                <Badge variant="outline" className={`text-xs ${statusColors[ticket.status]}`}>
                  {ticket.status.replace(/-/g, ' ')}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogTitle className="text-xl font-medium mt-2 text-left">{ticket.summary}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-4 gap-6 p-6 overflow-y-auto max-h-[70vh]">
            <div className="col-span-3 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="text-sm whitespace-pre-line">
                  {ticket.description || 'No description provided.'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Comments ({ticket.comments.length})
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {ticket.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                        <AvatarFallback>{comment.author.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat('en-US', {
                              month: 'short',
                              day: 'numeric',
                            }).format(comment.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm mt-1">{comment.content}</div>
                      </div>
                    </div>
                  ))}
                  
                  {ticket.comments.length === 0 && (
                    <div className="text-sm text-muted-foreground">No comments yet.</div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Textarea
                    placeholder="Add a comment..."
                    className="w-full resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm">Comment</Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assignee</span>
                    <div className="flex items-center space-x-1">
                      {ticket.assignee ? (
                        <>
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                            <AvatarFallback>{ticket.assignee.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span>{ticket.assignee.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reporter</span>
                    <div className="flex items-center space-x-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={ticket.reporter.avatar} alt={ticket.reporter.name} />
                        <AvatarFallback>{ticket.reporter.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span>{ticket.reporter.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Priority</span>
                    <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className={`text-xs ${statusColors[ticket.status]}`}>
                      {ticket.status.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Edit className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <AlertCircle className="h-3.5 w-3.5 mr-2" />
                    Change status
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Clock className="h-3.5 w-3.5 mr-2" />
                    Log time
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal;

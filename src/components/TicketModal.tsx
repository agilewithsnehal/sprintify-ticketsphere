
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket, Priority, Status, User } from '@/lib/types';
import { MessageSquare, AlertCircle, Clock, CalendarIcon, Edit, X, Save, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onTicketUpdate: (updatedTicket: Ticket) => void;
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

const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, ticket, onTicketUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTicket, setEditedTicket] = useState<Ticket>(ticket);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(ticket.createdAt);

  const handleEditToggle = () => {
    if (isEditing) {
      // Discard changes and exit edit mode
      setEditedTicket(ticket);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (!editedTicket.summary.trim()) {
      toast.error('Ticket summary cannot be empty');
      return;
    }
    
    setIsSubmitting(true);

    // Update the ticket with a fresh timestamp
    const updatedTicket = {
      ...editedTicket,
      updatedAt: new Date()
    };

    // In a real app, you would make an API call here
    setTimeout(() => {
      onTicketUpdate(updatedTicket);
      setIsEditing(false);
      setIsSubmitting(false);
      toast.success('Ticket updated successfully');
    }, 500); // Simulate API delay
  };

  const handleInputChange = (field: keyof Ticket, value: any) => {
    setEditedTicket(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: `comment-${Date.now()}`,
      author: ticket.project.members[0], // Current user
      content: newComment.trim(),
      createdAt: new Date()
    };

    const updatedTicket = {
      ...ticket,
      comments: [...ticket.comments, comment],
      updatedAt: new Date()
    };

    onTicketUpdate(updatedTicket);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleStatusChange = (status: Status) => {
    const updatedTicket = {
      ...ticket,
      status,
      updatedAt: new Date()
    };
    
    onTicketUpdate(updatedTicket);
    toast.success(`Ticket moved to ${status.replace(/-/g, ' ')}`);
  };

  const handlePriorityChange = (priority: Priority) => {
    const updatedTicket = {
      ...ticket,
      priority,
      updatedAt: new Date()
    };
    
    onTicketUpdate(updatedTicket);
    toast.success(`Priority changed to ${priority}`);
  };

  const handleAssigneeChange = (userId: string) => {
    const assignee = userId 
      ? ticket.project.members.find(member => member.id === userId) 
      : undefined;
      
    const updatedTicket = {
      ...ticket,
      assignee,
      updatedAt: new Date()
    };
    
    onTicketUpdate(updatedTicket);
    toast.success(assignee ? `Assigned to ${assignee.name}` : 'Unassigned');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs font-medium">{ticket.key}</Badge>
                {!isEditing ? (
                  <>
                    <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${statusColors[ticket.status]}`}>
                      {ticket.status.replace(/-/g, ' ')}
                    </Badge>
                  </>
                ) : null}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isEditing ? (
              <div className="mt-2">
                <Input 
                  value={editedTicket.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  className="text-xl font-medium"
                  placeholder="Ticket summary"
                />
              </div>
            ) : (
              <DialogTitle className="text-xl font-medium mt-2 text-left">{ticket.summary}</DialogTitle>
            )}
          </DialogHeader>
          
          <div className="grid grid-cols-4 gap-6 p-6 overflow-y-auto max-h-[70vh]">
            <div className="col-span-3 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={handleEditToggle}
                  >
                    {isEditing ? <X className="h-3.5 w-3.5" /> : <Edit className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                
                {isEditing ? (
                  <Textarea
                    value={editedTicket.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full resize-none"
                    rows={5}
                    placeholder="Enter ticket description"
                  />
                ) : (
                  <div className="text-sm whitespace-pre-line">
                    {ticket.description || 'No description provided.'}
                  </div>
                )}
                
                {isEditing && (
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={handleSaveChanges} 
                      disabled={isSubmitting}
                      className="gap-1"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
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
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <Button 
                      size="sm" 
                      onClick={handleCommentSubmit}
                      disabled={!newComment.trim()}
                    >
                      Comment
                    </Button>
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
                    <div className="w-32">
                      <Select 
                        value={ticket.assignee?.id || ''} 
                        onValueChange={handleAssigneeChange}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Unassigned">
                            {ticket.assignee ? (
                              <div className="flex items-center space-x-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                                  <AvatarFallback>{ticket.assignee.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span>{ticket.assignee.name}</span>
                              </div>
                            ) : 'Unassigned'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {ticket.project.members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center space-x-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={member.avatar} alt={member.name} />
                                  <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <div className="w-32">
                      <Select 
                        value={ticket.priority} 
                        onValueChange={(value: Priority) => handlePriorityChange(value)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue>
                            <Badge variant="outline" className={`text-xs ${priorityColors[ticket.priority]}`}>
                              {ticket.priority}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <Badge variant="outline" className={`text-xs ${priorityColors.low}`}>
                              low
                            </Badge>
                          </SelectItem>
                          <SelectItem value="medium">
                            <Badge variant="outline" className={`text-xs ${priorityColors.medium}`}>
                              medium
                            </Badge>
                          </SelectItem>
                          <SelectItem value="high">
                            <Badge variant="outline" className={`text-xs ${priorityColors.high}`}>
                              high
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <div className="w-32">
                      <Select 
                        value={ticket.status} 
                        onValueChange={(value: Status) => handleStatusChange(value)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue>
                            <Badge variant="outline" className={`text-xs ${statusColors[ticket.status]}`}>
                              {ticket.status.replace(/-/g, ' ')}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog">
                            <Badge variant="outline" className={`text-xs ${statusColors.backlog}`}>
                              backlog
                            </Badge>
                          </SelectItem>
                          <SelectItem value="todo">
                            <Badge variant="outline" className={`text-xs ${statusColors.todo}`}>
                              to do
                            </Badge>
                          </SelectItem>
                          <SelectItem value="in-progress">
                            <Badge variant="outline" className={`text-xs ${statusColors["in-progress"]}`}>
                              in progress
                            </Badge>
                          </SelectItem>
                          <SelectItem value="review">
                            <Badge variant="outline" className={`text-xs ${statusColors.review}`}>
                              review
                            </Badge>
                          </SelectItem>
                          <SelectItem value="done">
                            <Badge variant="outline" className={`text-xs ${statusColors.done}`}>
                              done
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleEditToggle}
                  >
                    <Edit className="h-3.5 w-3.5 mr-2" />
                    {isEditing ? 'Cancel edit' : 'Edit'}
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

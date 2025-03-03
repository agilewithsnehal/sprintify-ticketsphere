
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, X, Save } from 'lucide-react';
import { Ticket } from '@/lib/types';

interface TicketDescriptionProps {
  ticket: Ticket;
  isEditing: boolean;
  editedTicket: Ticket;
  isSubmitting: boolean;
  handleEditToggle: () => void;
  handleSaveChanges: () => void;
  handleInputChange: (field: keyof Ticket, value: any) => void;
}

const TicketDescription: React.FC<TicketDescriptionProps> = ({
  ticket,
  isEditing,
  editedTicket,
  isSubmitting,
  handleEditToggle,
  handleSaveChanges,
  handleInputChange,
}) => {
  return (
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
  );
};

export default TicketDescription;

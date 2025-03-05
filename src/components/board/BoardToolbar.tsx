
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, StarIcon, ListFilter, ChevronDown, TicketPlus, BarChart3, ArrowLeft, Columns } from 'lucide-react';
import { Link } from 'react-router-dom';
import ColumnConfigurationModal from './ColumnConfigurationModal';
import { toast } from 'sonner';

interface BoardToolbarProps {
  boardName: string;
  projectId: string;
  onCreateTicket: () => void;
  onFilterClick: () => void;
  onGroupClick: () => void;
}

const BoardToolbar: React.FC<BoardToolbarProps> = ({ 
  boardName, 
  projectId,
  onCreateTicket,
  onFilterClick,
  onGroupClick
}) => {
  const [configureColumnsOpen, setConfigureColumnsOpen] = useState(false);
  
  // Default columns - in a real implementation, these would come from the board data
  const defaultColumns = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' }
  ];
  
  const handleSaveColumns = (columns: any[]) => {
    // In a real implementation, this would update the columns in the database
    console.log('Columns updated:', columns);
    toast.success('Column configuration saved');
  };
  
  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 mr-2"
          asChild
        >
          <Link to={`/project/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Project</span>
          </Link>
        </Button>

        <h2 className="text-xl font-semibold flex items-center">
          {boardName}
          <Button variant="ghost" size="icon" className="ml-1 h-7 w-7">
            <StarIcon className="h-4 w-4" />
          </Button>
        </h2>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="default" 
          size="sm" 
          className="gap-1"
          onClick={onCreateTicket}
        >
          <TicketPlus className="h-4 w-4" />
          <span>Create Ticket</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={() => setConfigureColumnsOpen(true)}
        >
          <Columns className="h-4 w-4" />
          <span>Configure Columns</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={onFilterClick}
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={onGroupClick}
        >
          <ListFilter className="h-4 w-4" />
          <span>Group</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          asChild
        >
          <Link to="/reports">
            <BarChart3 className="h-4 w-4" />
            <span>Reports</span>
          </Link>
        </Button>
      </div>
      
      <ColumnConfigurationModal
        isOpen={configureColumnsOpen}
        onOpenChange={setConfigureColumnsOpen}
        columns={defaultColumns}
        onSave={handleSaveColumns}
      />
    </div>
  );
};

export default BoardToolbar;

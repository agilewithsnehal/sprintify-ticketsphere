
import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter, StarIcon, ListFilter, ChevronDown, TicketPlus, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BoardToolbarProps {
  boardName: string;
  onCreateTicket: () => void;
  onFilterClick: () => void;
  onGroupClick: () => void;
}

const BoardToolbar: React.FC<BoardToolbarProps> = ({ 
  boardName, 
  onCreateTicket,
  onFilterClick,
  onGroupClick
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );
};

export default BoardToolbar;

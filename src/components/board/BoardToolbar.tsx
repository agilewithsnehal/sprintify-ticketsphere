
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, StarIcon, ListFilter, ChevronDown, TicketPlus, BarChart3, ArrowLeft, Columns } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ColumnConfigurationModal from './ColumnConfigurationModal';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase';
import { Column } from '@/lib/types';

interface BoardToolbarProps {
  boardName: string;
  projectId: string;
  columns: Column[];
  onColumnsUpdate: (columns: Column[]) => void;
  onCreateTicket: () => void;
  onFilterClick: () => void;
  onGroupClick: () => void;
}

const BoardToolbar: React.FC<BoardToolbarProps> = ({ 
  boardName, 
  projectId,
  columns,
  onColumnsUpdate,
  onCreateTicket,
  onFilterClick,
  onGroupClick
}) => {
  const [configureColumnsOpen, setConfigureColumnsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const location = useLocation();
  
  // Check if we're in the standalone board view or in the project view
  const isStandaloneBoard = location.pathname.startsWith('/board/');
  
  const handleSaveColumns = async (updatedColumns: Column[]) => {
    try {
      setIsSaving(true);
      
      // Call the service to update the columns in the database
      const success = await supabaseService.updateBoardColumns(projectId, updatedColumns);
      
      if (success) {
        // Update the local state
        onColumnsUpdate(updatedColumns);
        toast.success('Column configuration saved');
      } else {
        toast.error('Failed to save column configuration');
      }
    } catch (error) {
      console.error('Error saving columns:', error);
      toast.error('An error occurred while saving columns');
    } finally {
      setIsSaving(false);
      setConfigureColumnsOpen(false);
    }
  };
  
  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {isStandaloneBoard && (
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
        )}

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
        columns={columns}
        onSave={handleSaveColumns}
        isSaving={isSaving}
      />
    </div>
  );
};

export default BoardToolbar;

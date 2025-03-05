
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from 'react-beautiful-dnd';
import { GripVertical, X, Plus, CheckCircle, Edit, Check, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Column, Status } from '@/lib/types';

interface ColumnConfigurationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  onSave: (columns: Column[]) => void;
  isSaving?: boolean;
  onReset?: () => Promise<void>;
  isColumnConfigOpen?: boolean;
}

const ColumnConfigurationModal: React.FC<ColumnConfigurationModalProps> = ({
  isOpen,
  onOpenChange,
  columns: initialColumns,
  onSave,
  isSaving = false,
  onReset,
  isColumnConfigOpen
}) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [newColumnTitle, setNewColumnTitle] = useState('');

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setColumns(items);
  };

  const handleEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingTitle.trim()) {
      toast.error('Column title cannot be empty');
      return;
    }

    setColumns(columns.map(col => 
      col.id === id ? { ...col, title: editingTitle } : col
    ));
    setEditingId(null);
    setEditingTitle('');
  };

  const handleRemoveColumn = (id: string) => {
    if (columns.length <= 1) {
      toast.error('You must have at least one column');
      return;
    }
    setColumns(columns.filter(col => col.id !== id));
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) {
      toast.error('Column title cannot be empty');
      return;
    }

    // Use the first status as default for new columns
    const newId = 'todo' as Status;
    setColumns([...columns, { 
      id: newId, 
      title: newColumnTitle, 
      tickets: [] 
    }]);
    setNewColumnTitle('');
  };

  const handleSaveColumns = () => {
    onSave(columns);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Board Columns</DialogTitle>
          <DialogDescription>
            Drag to reorder columns, edit names, or add new columns.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {columns.map((column, index) => (
                    <Draggable 
                      key={column.id} 
                      draggableId={column.id} 
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center space-x-2 bg-secondary/50 p-2 rounded-md"
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab"
                          >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>

                          {editingId === column.id ? (
                            <div className="flex-1 flex items-center space-x-2">
                              <Input 
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="flex-1"
                                placeholder="Column title"
                                autoFocus
                              />
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleSaveEdit(column.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex-1 font-medium">{column.title}</div>
                          )}

                          {editingId !== column.id && (
                            <div className="flex items-center space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEdit(column.id, column.title)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRemoveColumn(column.id)}
                                disabled={isSaving}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="mt-4 flex items-center space-x-2">
            <Input
              placeholder="New column title"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              className="flex-1"
              disabled={isSaving}
            />
            <Button 
              variant="outline" 
              onClick={handleAddColumn}
              disabled={isSaving}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onReset}
              disabled={isSaving}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Default
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleSaveColumns}
              className="gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnConfigurationModal;

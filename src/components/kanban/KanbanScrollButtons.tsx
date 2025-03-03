
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface KanbanScrollButtonsProps {
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

const KanbanScrollButtons: React.FC<KanbanScrollButtonsProps> = ({
  onScrollLeft,
  onScrollRight
}) => {
  return (
    <>
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-md opacity-80 hover:opacity-100"
          onClick={onScrollLeft}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-md opacity-80 hover:opacity-100"
          onClick={onScrollRight}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
};

export default KanbanScrollButtons;

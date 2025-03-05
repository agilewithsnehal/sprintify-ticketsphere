
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface InvalidProjectIdProps {
  projectId: string | undefined;
}

const InvalidProjectId: React.FC<InvalidProjectIdProps> = ({ projectId }) => {
  const navigate = useNavigate();
  
  return (
    <div className="px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-2">Invalid Project ID</h2>
      <p className="text-muted-foreground mb-4">
        The project ID format is not valid. Please check the URL and try again.
      </p>
      <Button 
        className="px-4 py-2 bg-primary text-primary-foreground rounded"
        onClick={() => navigate('/')}
      >
        Back to Dashboard
      </Button>
    </div>
  );
};

export default InvalidProjectId;


import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ProjectNotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Project not found</h1>
      <p className="mt-2">The project you're looking for doesn't exist or you don't have access.</p>
      <Button onClick={() => navigate('/')} className="mt-4">Back to Dashboard</Button>
    </div>
  );
};

export default ProjectNotFound;


import React from 'react';

const ProjectLoadingState: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-secondary rounded-md w-1/4"></div>
        <div className="h-4 bg-secondary rounded-md w-1/2"></div>
        <div className="h-64 bg-secondary rounded-md w-full mt-8"></div>
      </div>
    </div>
  );
};

export default ProjectLoadingState;

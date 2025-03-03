
import React from 'react';

const BoardNotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <h2 className="text-xl font-semibold mb-2">Project not found</h2>
      <p className="text-muted-foreground">The requested project does not exist or you don't have access to it.</p>
    </div>
  );
};

export default BoardNotFound;


import React from 'react';

const BoardSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-pulse space-y-4 w-full max-w-3xl">
        <div className="h-8 bg-secondary rounded-md w-1/3"></div>
        <div className="h-4 bg-secondary rounded-md w-2/3"></div>
        <div className="flex space-x-4">
          <div className="h-24 bg-secondary rounded-md w-1/4"></div>
          <div className="h-24 bg-secondary rounded-md w-1/4"></div>
          <div className="h-24 bg-secondary rounded-md w-1/4"></div>
          <div className="h-24 bg-secondary rounded-md w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export default BoardSkeleton;

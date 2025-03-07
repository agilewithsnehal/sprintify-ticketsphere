
import React from 'react';
import { Link } from 'react-router-dom';
import { ModeToggle } from '@/components/ui/mode-toggle';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="border-b">
      <div className="h-16 flex items-center px-4 md:px-6 justify-between">
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl">Kanban</Link>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

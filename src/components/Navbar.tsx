
import React from 'react';
import { Link } from 'react-router-dom';
import { ModeToggle } from '@/components/ui/mode-toggle';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import { supabaseService } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

const Navbar = () => {
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await supabaseService.getCurrentUser(),
  });

  return (
    <nav className="border-b">
      <div className="h-16 flex items-center px-4 md:px-6 justify-between">
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl">Clarity</Link>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          <ModeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={currentUser?.avatar} alt={currentUser?.name || 'User'} />
                  <AvatarFallback className={`bg-${currentUser?.avatarColor || 'purple'}-500 text-white`}>
                    {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{currentUser?.name || 'User'}</span>
                  <span className="text-xs text-muted-foreground">{currentUser?.email || ''}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/')}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabaseService } from '@/lib/supabase';
import { User } from '@/lib/types';
import ProfileEditModal from '@/components/profile/ProfileEditModal';

const avatarColors = {
  'purple': '#9b87f5',
  'blue': '#0EA5E9',
  'green': '#10B981',
  'orange': '#F97316',
  'pink': '#D946EF',
  'gray': '#8E9196',
  'red': '#F43F5E',
  'yellow': '#F59E0B',
};

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (user: User | null) => {
    if (!user) return '#9b87f5'; // Default purple
    return avatarColors[user.avatarColor as keyof typeof avatarColors] || '#9b87f5';
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center">
            <motion.div 
              className="w-8 h-8 rounded-md bg-primary mr-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
            <h1 className="text-xl font-semibold">Clarity</h1>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link 
              to="/" 
              className={`transition-colors ${
                location.pathname === '/' 
                  ? 'text-foreground font-medium' 
                  : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/reports" 
              className={`transition-colors ${
                location.pathname === '/reports' 
                  ? 'text-foreground font-medium' 
                  : 'text-foreground/80 hover:text-foreground'
              }`}
            >
              Reports
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-secondary/50 pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-60"
            />
          </div>
          
          <Button size="icon" variant="ghost" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-white text-xs">
              3
            </Badge>
          </Button>
          
          <div 
            className="hidden md:flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <Avatar 
              className="h-8 w-8 border border-border"
              style={{ backgroundColor: getAvatarColor(currentUser) }}
            >
              <AvatarFallback className="text-black">
                {getInitials(currentUser?.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{currentUser?.name || 'Loading...'}</span>
          </div>
          
          <Button 
            size="icon" 
            variant="ghost"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {isMenuOpen && (
        <motion.div 
          className="md:hidden py-4 px-4 space-y-4 border-b border-border bg-background"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div 
            className="flex items-center space-x-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setIsProfileModalOpen(true);
              setIsMenuOpen(false);
            }}
          >
            <Avatar 
              className="h-8 w-8"
              style={{ backgroundColor: getAvatarColor(currentUser) }}
            >
              <AvatarFallback className="text-black">
                {getInitials(currentUser?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{currentUser?.name || 'Loading...'}</div>
              <div className="text-xs text-muted-foreground">{currentUser?.role || ''}</div>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-secondary/50 w-full pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          
          <nav className="flex flex-col space-y-2">
            <Link 
              to="/"
              className={`py-2 px-3 rounded-lg hover:bg-secondary/80 transition-colors ${
                location.pathname === '/' ? 'bg-secondary/80 text-foreground' : 'text-foreground/80'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/reports"
              className={`py-2 px-3 rounded-lg hover:bg-secondary/80 transition-colors ${
                location.pathname === '/reports' ? 'bg-secondary/80 text-foreground' : 'text-foreground/80'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Reports
            </Link>
          </nav>
        </motion.div>
      )}

      <ProfileEditModal
        user={currentUser}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdate={handleProfileUpdate}
      />
    </header>
  );
};

export default Navbar;

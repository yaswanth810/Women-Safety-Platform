import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Shield, Home, AlertTriangle, FileText, MessageSquare, BookOpen, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Layout = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', testId: 'nav-dashboard' },
    { path: '/sos', icon: AlertTriangle, label: 'SOS', testId: 'nav-sos' },
    { path: '/report', icon: FileText, label: 'Report', testId: 'nav-report' },
    { path: '/forum', icon: MessageSquare, label: 'Forum', testId: 'nav-forum' },
    { path: '/legal', icon: BookOpen, label: 'Legal', testId: 'nav-legal' },
  ];

  if (user.role === 'admin' || user.role === 'moderator') {
    navItems.push({ path: '/admin', icon: LayoutDashboard, label: 'Admin', testId: 'nav-admin' });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/dashboard')}
              data-testid="logo"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                SafeSpace
              </span>
            </div>

            {/* Nav Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                      : 'text-gray-700 hover:bg-rose-50'
                  }`}
                  data-testid={item.testId}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu-trigger">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="profile-menu-item">
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600" data-testid="logout-menu-item">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden pb-3">
            <div className="flex gap-2 overflow-x-auto">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1 whitespace-nowrap ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                      : ''
                  }`}
                  data-testid={`mobile-${item.testId}`}
                >
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
};

export default Layout;
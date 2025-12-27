import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Shield, 
    LayoutDashboard, 
    Wrench, 
    Users, 
    ClipboardList, 
    Calendar, 
    BarChart3,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/equipment', icon: Wrench, label: 'Equipment' },
    { to: '/teams', icon: Users, label: 'Teams' },
    { to: '/requests', icon: ClipboardList, label: 'Requests' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex" data-testid="app-layout">
            {/* Sidebar */}
            <aside className="sidebar w-64 fixed h-full flex flex-col" data-testid="sidebar">
                {/* Logo */}
                <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-orange-500" />
                        <span className="text-xl font-bold text-white tracking-tight">GearGuard</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                            data-testid={`nav-${item.label.toLowerCase()}`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-zinc-800">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center gap-3 p-2 rounded-sm hover:bg-zinc-800 transition-colors" data-testid="user-menu-trigger">
                                <Avatar className="w-9 h-9">
                                    <AvatarImage src={user?.avatar} alt={user?.name} />
                                    <AvatarFallback className="bg-orange-500/20 text-orange-500">
                                        {user?.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-zinc-500 capitalize">{user?.role}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-zinc-500" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                            <div className="px-2 py-1.5">
                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                <p className="text-xs text-zinc-500">{user?.email}</p>
                            </div>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem 
                                onClick={handleLogout}
                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                data-testid="logout-btn"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

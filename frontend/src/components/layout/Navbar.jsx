import React, { useState } from 'react';
import { Menu, Sun, Moon, LogOut, User, Bell, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full items-center justify-between border-b border-border-custom bg-white dark:bg-[#111827] px-6 transition-colors">
      {/* Search Input Bar */}
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-lg text-txt-secondary hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden cursor-pointer"
        >
          <Menu size={20} />
        </button>
        
        {/* Large Rounded Search Bar */}
        <form onSubmit={handleNavSearchSubmit} className="relative w-full max-w-md hidden md:block">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-txt-muted" />
          <input
            type="text"
            placeholder="Search students, rooms, fees..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="w-full rounded-full border border-border-custom bg-slate-50/50 dark:bg-zinc-900 py-2.5 pl-10 pr-12 text-xs text-txt-primary placeholder-txt-muted outline-none focus:border-blue-500 transition"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-100 dark:bg-zinc-800 text-[10px] text-txt-muted px-1.5 py-0.5 rounded font-mono border border-border-custom font-semibold select-none pointer-events-none">
            Ctrl+K
          </div>
        </form>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-5">
        {/* Notifications Icon */}
        <div className="relative cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">
          <Bell size={18} className="text-txt-secondary" />
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
            5
          </span>
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 cursor-pointer focus:outline-none"
          >
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
              alt="avatar" 
              className="h-8 w-8 rounded-full object-cover border border-border-custom"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-txt-primary leading-none">
                {user?.name || 'Hostel Manager'}
              </span>
              <span className="text-[10px] text-txt-muted font-semibold tracking-wide uppercase mt-1 block">
                Administrator
              </span>
            </div>
            <ChevronDown size={14} className="text-txt-muted hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setDropdownOpen(false)}
              />
              
              <div className="absolute right-0 mt-2.5 w-48 rounded-xl border border-border-custom bg-white dark:bg-[#111827] py-1 shadow-md z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-border-custom">
                  <p className="text-xs font-semibold text-txt-primary">{user?.name}</p>
                  <p className="text-[10px] text-txt-muted truncate">{user?.email}</p>
                </div>
                
                <button 
                  onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-txt-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white transition cursor-pointer"
                >
                  <User size={14} />
                  My Profile
                </button>

                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-400 transition cursor-pointer"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
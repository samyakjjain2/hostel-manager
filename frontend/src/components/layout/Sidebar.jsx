import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Bed, 
  Users, 
  GitPullRequest, 
  CreditCard, 
  History,
  AlertOctagon, 
  UserCheck, 
  ShieldAlert, 
  ClipboardList, 
  FileBarChart, 
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldAlert as ShieldIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const [openDropdown, setOpenDropdown] = useState({
    hostels: false,
    finance: false
  });

  const toggleDropdown = (key) => {
    setOpenDropdown(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      title: 'MAIN',
      items: [
        { 
          name: 'Hostel Management', 
          path: '/hostels', 
          icon: Building2,
          hasSubmenu: true,
          submenuKey: 'hostels',
          submenuItems: [
            { name: 'Hostels List', path: '/hostels' },
            { name: 'Add Hostel', path: '/hostels' }
          ]
        },
        { name: 'Room Management', path: '/rooms', icon: Bed },
        { name: 'Student Management', path: '/students', icon: Users },
        { name: 'Room Allocation', path: '/allocation', icon: GitPullRequest }
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Fee Management', path: '/fees', icon: CreditCard },
        { name: 'Payment History', path: '/fees', icon: History }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Complaint Management', path: '/complaints', icon: AlertOctagon },
        { name: 'Visitor Management', path: '/visitors', icon: UserCheck },
        { name: 'Staff Management', path: '/staff', icon: ShieldAlert },
        { name: 'Notice Board', path: '/notices', icon: ClipboardList }
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { name: 'Reports & Analytics', path: '/reports', icon: FileBarChart }
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { name: 'Settings', path: '/profile', icon: Settings }
      ]
    }
  ];

  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 z-40 w-[280px] bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-350 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 md:translate-x-0 flex flex-col justify-between overflow-y-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <ShieldIcon size={18} className="fill-white/10" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-white block tracking-tight leading-none">
                Aegis Portal
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide mt-1 block">
                Hostel Operations
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Link */}
        <div className="px-4 pt-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group cursor-pointer ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* Side Menu Sections */}
        <div className="px-4 py-4 space-y-5">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider px-3.5 uppercase">
                {section.title}
              </h5>
              
              <div className="space-y-0.5">
                {section.items.map((item, itemIdx) => {
                  if (item.hasSubmenu) {
                    const isDropdownOpen = openDropdown[item.submenuKey];
                    return (
                      <div key={itemIdx} className="space-y-1">
                        <button
                          onClick={() => toggleDropdown(item.submenuKey)}
                          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon size={16} />
                            <span>{item.name}</span>
                          </div>
                          {isDropdownOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {isDropdownOpen && (
                          <div className="pl-9 pr-2 py-1 space-y-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            {item.submenuItems.map((sub, subIdx) => {
                              const isCurrentActive = sub.path.includes('?') 
                                ? window.location.pathname + window.location.search === sub.path 
                                : window.location.pathname === sub.path && !window.location.search.includes('action=generate');
                              return (
                                <NavLink
                                  key={subIdx}
                                  to={sub.path}
                                  className={
                                    `block py-1.5 px-2 rounded-md text-[11px] font-semibold transition ${
                                      isCurrentActive
                                        ? 'text-blue-650 dark:text-blue-400 bg-slate-100 dark:bg-slate-800 font-bold'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-105 dark:hover:bg-slate-800'
                                    }`
                                  }
                                >
                                  {sub.name}
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-sm font-bold' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        }`
                      }
                    >
                      <item.icon size={16} className="shrink-0 transition-transform group-hover:scale-105" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] sticky bottom-0">
        <Link 
          to="/profile"
          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
              alt="avatar" 
              className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-800 shrink-0"
            />
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate leading-tight">{user?.name || 'Hostel Manager'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-semibold uppercase tracking-wider mt-0.5">
                Administrator
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
        </Link>
      </div>
    </aside>
  );
};
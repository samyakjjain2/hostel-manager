import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { RevenueChart } from '../../components/charts/DashboardCharts';
import { 
  Users, 
  Bed, 
  DoorClosed,
  FileText,
  AlertTriangle,
  UserCheck,
  Calendar, 
  ChevronRight, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  PlusCircle,
  DoorOpen,
  Receipt,
  FileBarChart,
  UserPlus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    formatSystemDate();
  }, []);

  const formatSystemDate = () => {
    const d = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(d.toLocaleDateString('en-US', options));
  };

  const fetchDashboardData = async () => {
    try {
      const [resStats, resRev, resLogs] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/dashboard/fee-trend`),
        axios.get(`${API_URL}/dashboard/activity`)
      ]);

      if (resStats.data.success) setStats(resStats.data.stats);
      if (resRev.data.success) setRevenueData(resRev.data.data);
      if (resLogs.data.success) setLogs(resLogs.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Students', 
      value: stats?.totalStudents || 0, 
      trend: '+12 this month', 
      isUp: true, 
      icon: Users, 
      iconBg: 'bg-blue-50 dark:bg-blue-950/20', 
      iconColor: 'text-blue-600 dark:text-blue-400' 
    },
    { 
      title: 'Occupied Beds', 
      value: stats?.occupiedBeds || 0, 
      trend: '+8 this month', 
      isUp: true, 
      icon: DoorClosed, 
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/20', 
      iconColor: 'text-emerald-600 dark:text-emerald-400' 
    },
    { 
      title: 'Vacant Beds', 
      value: stats?.vacantBeds || 0, 
      trend: '-4 this month', 
      isUp: false, 
      icon: Bed, 
      iconBg: 'bg-slate-50 dark:bg-slate-800/40', 
      iconColor: 'text-slate-500 dark:text-slate-400' 
    },
    { 
      title: 'Pending Fees', 
      value: `₹ ${stats?.pendingFees?.toLocaleString() || '0'}`, 
      trend: 'Split Collection', 
      isUp: true, 
      icon: FileText, 
      iconBg: 'bg-orange-50 dark:bg-orange-950/20', 
      iconColor: 'text-orange-600 dark:text-orange-400' 
    },
    { 
      title: 'Complaints Log', 
      value: String(stats?.pendingComplaints || 0).padStart(2, '0'), 
      trend: 'Support Tickets', 
      isUp: false, 
      icon: AlertTriangle, 
      iconBg: 'bg-rose-50 dark:bg-rose-950/20', 
      iconColor: 'text-rose-600 dark:text-rose-400' 
    },
    { 
      title: 'Today\'s Visitors', 
      value: stats?.todayVisitors || 0, 
      trend: 'Visitor Log', 
      isUp: true, 
      icon: UserCheck, 
      iconBg: 'bg-purple-50 dark:bg-purple-950/20', 
      iconColor: 'text-purple-600 dark:text-purple-400' 
    }
  ];

  const quickActions = [
    { name: 'Add Student', icon: UserPlus, path: '/students', color: 'hover:border-blue-500 hover:text-blue-600' },
    { name: 'Add Room', icon: PlusCircle, path: '/rooms', color: 'hover:border-emerald-500 hover:text-emerald-600' },
    { name: 'Collect Fee', icon: Receipt, path: '/fees', color: 'hover:border-orange-500 hover:text-orange-600' },
    { name: 'Visitor Entry', icon: DoorOpen, path: '/visitors', color: 'hover:border-purple-500 hover:text-purple-600' },
    { name: 'Generate Report', icon: FileBarChart, path: '/reports', color: 'hover:border-pink-500 hover:text-pink-600' },
    { name: 'Allocate Room', icon: Bed, path: '/allocation', color: 'hover:border-cyan-500 hover:text-cyan-600' }
  ];

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5">
            Good Morning, Warden 👋
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">Welcome to Pratibha Chayan Chatrawas portal.</p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 border border-blue-100 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 text-blue-650 dark:text-blue-400 font-semibold rounded-lg text-xs shadow-sm">
          <Calendar size={14} className="shrink-0" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Quick Actions Grid layout */}
      <div className="premium-card p-6 !rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border border-border-custom bg-white dark:bg-[#1e293b] text-txt-secondary cursor-pointer transition-all duration-150 active:scale-95 hover:-translate-y-0.5 ${action.color} hover:shadow-sm`}
            >
              <action.icon size={20} className="mb-2 shrink-0" />
              <span className="text-xs font-bold tracking-wide">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats row with exactly 16px radius (rounded-2xl) and 24px padding (p-6) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="premium-card p-6 !rounded-2xl flex flex-col justify-between h-36 hover:shadow-md transition cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.iconBg} ${card.iconColor}`}>
                <card.icon size={16} />
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                {card.value}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                {card.isUp ? (
                  <span className="text-emerald-500 flex items-center">
                    <ArrowUpRight size={12} />
                  </span>
                ) : (
                  <span className="text-rose-500 flex items-center">
                    <ArrowDownRight size={12} />
                  </span>
                )}
                <span className="text-slate-450 dark:text-zinc-500 font-semibold">{card.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: occupancies and fee trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Donut */}
        <div className="premium-card p-6 !rounded-2xl flex flex-col justify-between h-96">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2">
            Room Occupancy Overview
          </h3>
          
          <div className="relative flex items-center justify-center my-4">
            <div className="relative h-44 w-44 rounded-full border-[14px] border-slate-100 dark:border-zinc-800 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[14px] border-transparent border-t-blue-600 border-r-blue-600 border-b-blue-600 rotate-[45deg]" />
              <div className="text-center">
                <span className="text-2xl font-black text-slate-805 dark:text-white">
                  {stats?.occupancyRate !== undefined ? `${stats.occupancyRate}%` : '0%'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">Occupied</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-around text-xs border-t border-slate-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-full bg-blue-600" />
              <div>
                <span className="text-slate-700 dark:text-zinc-300 font-semibold block text-[11px]">Occupied Rooms</span>
                <span className="text-slate-400 font-medium">{stats?.occupiedBeds || 0} Beds</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-full bg-slate-200 dark:bg-zinc-800" />
              <div>
                <span className="text-slate-700 dark:text-zinc-300 font-semibold block text-[11px]">Vacant Rooms</span>
                <span className="text-slate-400 font-medium">{stats?.vacantBeds || 0} Beds</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collections trend chart */}
        <div className="premium-card p-6 !rounded-2xl flex flex-col justify-between h-96 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 mb-2">
            <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">
              Fee Collections Pipeline
            </h3>
          </div>

          <div className="h-[260px] w-full">
            <RevenueChart data={revenueData} />
          </div>
        </div>
      </div>

      {/* Bottom row: Activity logs & checklist details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent logs log */}
        <div className="premium-card p-6 !rounded-2xl flex flex-col justify-between h-96 lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-zinc-900">
            Recent System Activity
          </h3>

          <div className="space-y-4 py-2 max-h-[260px] overflow-y-auto pr-1 grow mt-2">
            {logs.slice(0, 5).map((log, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="relative flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-605 shrink-0 mt-1.5 shadow-sm" />
                  {i !== logs.length - 1 && <div className="w-[1px] bg-slate-100 dark:bg-zinc-800 grow" />}
                </div>
                <div>
                  <p className="text-slate-700 dark:text-zinc-300 font-medium">
                    <span className="text-slate-805 dark:text-white font-bold">{log.admin.name}</span> {log.detail}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {log.module}
                  </span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-slate-400 italic text-center py-12">No activity logged today.</p>
            )}
          </div>
        </div>

        {/* Support Card */}
        <div className="rounded-xl p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white flex flex-col justify-between h-96 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" className="h-full w-auto">
              <circle cx="100" cy="100" r="80" fill="white" />
            </svg>
          </div>

          <div className="space-y-2 relative z-10">
            <HelpCircle size={28} className="text-white/90" />
            <h3 className="text-base font-bold tracking-tight mt-4">Warden Help Desk</h3>
            <p className="text-xs text-blue-105 leading-relaxed font-semibold">
              Need assistance or technical troubleshooting? Reach out to support.
            </p>
          </div>

          <button className="w-full py-2.5 bg-white text-blue-650 hover:bg-slate-50 transition font-bold text-xs rounded-lg shadow-sm cursor-pointer relative z-10">
            Contact Support
          </button>
        </div>
      </div>

      {/* System Footer */}
      <footer className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-4 border-t border-slate-200/50 dark:border-zinc-900/40">
        <span>© 2025 Aegis Operations. All rights reserved.</span>
        <span>Version 1.0.0</span>
      </footer>
    </div>
  );
};

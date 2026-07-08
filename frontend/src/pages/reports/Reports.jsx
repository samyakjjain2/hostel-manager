import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { RevenueChart } from '../../components/charts/DashboardCharts';
import { FileBarChart, CreditCard, Building2, Users, ArrowUpRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [resStats, resRev] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/dashboard/fee-trend`)
      ]);
      if (resStats.data.success) setStats(resStats.data.stats);
      if (resRev.data.success) setRevenueData(resRev.data.data);
    } catch {
      toast.error('Failed to load reports trend logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
          <FileBarChart className="text-blue-600" size={22} /> Reports & Analytics
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
          Monitor occupancy ratio logs, monthly collection pipelines, and general metrics.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Summary metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="premium-card p-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Collections</span>
              <p className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">₹{(stats?.monthlyRevenue || 0).toLocaleString()}</p>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                <ArrowUpRight size={12} /> Active billing month revenue
              </span>
            </div>

            <div className="premium-card p-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupancy Ratio</span>
              <p className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">{stats?.occupancyRate || 0}%</p>
              <span className="text-[10px] text-slate-500 font-semibold block">{stats?.occupiedBeds || 0} of {stats?.totalBeds || 0} beds occupied</span>
            </div>

            <div className="premium-card p-5 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Complaints Log</span>
              <p className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">{stats?.pendingComplaints || 0}</p>
              <span className="text-[10px] text-orange-500 font-bold flex items-center gap-0.5">
                <CheckCircle size={12} /> Tickets pending resolution
              </span>
            </div>
          </div>

          {/* Revenue chart log card */}
          <div className="premium-card p-6">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6">
              Financial Collections Trend Overview
            </h3>
            <div className="h-[300px] w-full">
              <RevenueChart data={revenueData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

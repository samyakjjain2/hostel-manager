import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { User, Phone, Mail, Key } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  // Profile update state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  // Password reset state
  const [pwData, setPwData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile(profileData);
      if (res.success) {
        toast.success('Profile details saved successfully');
      }
    } catch {
      toast.error('Failed to save profile changes');
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) {
      toast.error('New password fields do not match');
      return;
    }

    try {
      const res = await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword: pwData.currentPassword,
        newPassword: pwData.newPassword
      });
      if (res.data.success) {
        toast.success('Password updated successfully');
        setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Manager Profile Settings</h1>
        <p className="text-slate-505 dark:text-zinc-400 text-xs mt-1">Configure profile details and account security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card details */}
        <div className="premium-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2">
            <User size={16} className="text-blue-500" /> Account Information
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-650 dark:text-zinc-405">Email Address (Read-only)</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  disabled 
                  value={user?.email || ''} 
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 py-2.5 pl-10 pr-4 text-slate-450 dark:text-zinc-500 outline-none cursor-not-allowed" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-655 dark:text-zinc-405">Full Name *</label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} 
                  className="w-full rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-655 dark:text-zinc-405">Contact Number</label>
              <div className="relative">
                <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={profileData.phone} 
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} 
                  className="w-full rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-955 py-2.5 pl-10 pr-4 text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                />
              </div>
            </div>

            <Button variant="gradient" type="submit" className="w-full cursor-pointer">Save Account Profile</Button>
          </form>
        </div>

        {/* Security Password settings */}
        <div className="premium-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2">
            <Key size={16} className="text-blue-500" /> Change Security Password
          </h3>

          <form onSubmit={handlePwSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-655 dark:text-zinc-405">Current Password *</label>
              <input 
                type="password" 
                required 
                value={pwData.currentPassword} 
                onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })} 
                className="w-full rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3.5 text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-655 dark:text-zinc-405">New Password *</label>
              <input 
                type="password" 
                required 
                value={pwData.newPassword} 
                onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })} 
                className="w-full rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3.5 text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-655 dark:text-zinc-405">Confirm New Password *</label>
              <input 
                type="password" 
                required 
                value={pwData.confirmPassword} 
                onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })} 
                className="w-full rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-955 py-2.5 px-3.5 text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>

            <Button variant="outline" type="submit" className="w-full cursor-pointer hover:bg-blue-600 hover:text-white hover:border-transparent">Update Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

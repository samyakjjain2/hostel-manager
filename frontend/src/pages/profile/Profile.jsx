import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { User, Phone, Mail, Key, Building2, Settings2, ToggleLeft, ToggleRight, IndianRupee, FileText } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const inputCls = "w-full rounded-lg border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3.5 text-slate-800 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm";
const labelCls = "block font-semibold text-slate-600 dark:text-zinc-400 mb-1 text-xs";
const cardCls = "premium-card p-5 space-y-4";
const sectionHeaderCls = "text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-800 pb-2";

export const Profile = () => {
  const { user, updateProfile } = useAuth();

  // --- Account info state ---
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  // --- Hostel & Invoice settings state ---
  const [settings, setSettings] = useState({
    hostelName: user?.hostelName || '',
    hostelAddress: user?.hostelAddress || '',
    hostelPhone: user?.hostelPhone || '',
    signatoryName: user?.signatoryName || '',
    enableDualAccounts: user?.enableDualAccounts ?? false,
    account1Name: user?.account1Name || 'Account 1',
    account2Name: user?.account2Name || 'Account 2',
    account1Prefix: user?.account1Prefix || 'PC',
    account2Prefix: user?.account2Prefix || 'RJ&A',
    account1DefaultAmount: user?.account1DefaultAmount ?? 3000,
    account2DefaultAmount: user?.account2DefaultAmount ?? 4500,
    defaultMonthlyAmount: user?.defaultMonthlyAmount ?? 7500,
    signPhoto: user?.signPhoto || ''
  });

  // Keep local states in sync when user loads from AuthContext
  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', phone: user.phone || '' });
      setSettings({
        hostelName: user.hostelName || '',
        hostelAddress: user.hostelAddress || '',
        hostelPhone: user.hostelPhone || '',
        signatoryName: user.signatoryName || '',
        enableDualAccounts: user.enableDualAccounts ?? false,
        account1Name: user.account1Name || 'Account 1',
        account2Name: user.account2Name || 'Account 2',
        account1Prefix: user.account1Prefix || 'PC',
        account2Prefix: user.account2Prefix || 'RJ&A',
        account1DefaultAmount: user.account1DefaultAmount ?? 3000,
        account2DefaultAmount: user.account2DefaultAmount ?? 4500,
        defaultMonthlyAmount: user.defaultMonthlyAmount ?? 7500,
        signPhoto: user.signPhoto || ''
      });
    }
  }, [user]);

  // --- Password state ---
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await updateProfile(profileData);
      if (res.success) toast.success('Account profile saved');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Original file is too large. Please select a smaller photo (under 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 100;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/png', 0.7);
        const base64SizeInBytes = Math.round((compressedBase64.length * 3) / 4);
        if (base64SizeInBytes > 50 * 1024) {
          const extraCompressed = canvas.toDataURL('image/jpeg', 0.5);
          setSettings(prev => ({ ...prev, signPhoto: extraCompressed }));
        } else {
          setSettings(prev => ({ ...prev, signPhoto: compressedBase64 }));
        }
        toast.success('Signature photo uploaded & auto-compressed');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await updateProfile(settings);
      if (res.success) toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    // BUG FIX: added minimum length validation
    if (pwData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setSavingPw(true);
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
    } finally {
      setSavingPw(false);
    }
  };

  const toggle = (field) => setSettings(s => ({ ...s, [field]: !s[field] }));

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Profile & Settings</h1>
        <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">Manage your account, hostel branding, and invoice configuration.</p>
      </div>

      {/* Row 1: Account Info + Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className={cardCls}>
          <h3 className={sectionHeaderCls}>
            <User size={15} className="text-blue-500" /> Account Information
          </h3>
          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div>
              <label className={labelCls}>Email Address (Read-only)</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="email" disabled value={user?.email || ''}
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 py-2.5 pl-10 pr-4 text-slate-400 dark:text-zinc-500 outline-none cursor-not-allowed text-xs sm:text-sm" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Full Name *</label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" required value={profileData.name}
                  onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                  className={`${inputCls} pl-10`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Contact Number</label>
              <div className="relative">
                <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  className={`${inputCls} pl-10`} />
              </div>
            </div>
            <Button variant="gradient" type="submit" disabled={savingProfile} className="w-full cursor-pointer">
              {savingProfile ? 'Saving…' : 'Save Account Profile'}
            </Button>
          </form>
        </div>

        {/* Change Password */}
        <div className={cardCls}>
          <h3 className={sectionHeaderCls}>
            <Key size={15} className="text-blue-500" /> Change Password
          </h3>
          <form onSubmit={handlePwSubmit} className="space-y-3">
            <div>
              <label className={labelCls}>Current Password *</label>
              <input type="password" required value={pwData.currentPassword}
                onChange={e => setPwData({ ...pwData, currentPassword: e.target.value })}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>New Password *</label>
              <input type="password" required value={pwData.newPassword}
                onChange={e => setPwData({ ...pwData, newPassword: e.target.value })}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password *</label>
              <input type="password" required value={pwData.confirmPassword}
                onChange={e => setPwData({ ...pwData, confirmPassword: e.target.value })}
                className={inputCls} />
            </div>
            <Button variant="outline" type="submit" disabled={savingPw} className="w-full cursor-pointer hover:bg-blue-600 hover:text-white hover:border-transparent">
              {savingPw ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>

      {/* Row 2: Hostel Settings (full width) */}
      <div className={cardCls}>
        <h3 className={sectionHeaderCls}>
          <Building2 size={15} className="text-emerald-500" /> Hostel Branding & Invoice Settings
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-500 -mt-2 mb-1">These values appear on printed receipts and invoices.</p>
        <form onSubmit={handleSettingsSubmit} className="space-y-5">

          {/* Hostel Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Hostel / Institution Name *</label>
              <input type="text" required value={settings.hostelName}
                onChange={e => setSettings({ ...settings, hostelName: e.target.value })}
                className={inputCls} placeholder="e.g. Pratibha Hostel" />
            </div>
            <div>
              <label className={labelCls}>Hostel Contact / Phone</label>
              <input type="text" value={settings.hostelPhone}
                onChange={e => setSettings({ ...settings, hostelPhone: e.target.value })}
                className={inputCls} placeholder="e.g. 9876543210" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Hostel Address</label>
              <textarea rows={2} value={settings.hostelAddress}
                onChange={e => setSettings({ ...settings, hostelAddress: e.target.value })}
                className={`${inputCls} resize-none`} placeholder="Full address for invoice header" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
              <div>
                <label className={labelCls}>Authorized Signatory Name</label>
                <input type="text" value={settings.signatoryName}
                  onChange={e => setSettings({ ...settings, signatoryName: e.target.value })}
                  className={inputCls} placeholder="Name appearing at bottom of receipt" />
              </div>
              <div>
                <label className={labelCls}>Upload Signature Photo (Max 50KB)</label>
                <div className="flex items-center gap-3 mt-1.5">
                  {settings.signPhoto ? (
                    <div className="relative border border-slate-200 dark:border-zinc-800 rounded-lg p-1 bg-white dark:bg-zinc-950 flex items-center justify-center h-[38px] w-[120px]">
                      <img src={settings.signPhoto} alt="signature preview" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, signPhoto: '' })}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-sm cursor-pointer"
                        style={{ fontSize: '10px', width: '15px', height: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-zinc-800 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Mode Toggle */}
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Settings2 size={14} className="text-purple-500" /> Split / Dual-Account Billing
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                  Enable this to split each fee bill across two separate accounts (e.g. institution + mess).
                </p>
              </div>
              <button type="button" onClick={() => toggle('enableDualAccounts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  settings.enableDualAccounts
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                }`}>
                {settings.enableDualAccounts
                  ? <><ToggleRight size={18} /> Split Billing ON</>
                  : <><ToggleLeft size={18} /> Split Billing OFF</>}
              </button>
            </div>
          </div>

          {/* Single Account Amount (shown when dual is OFF) */}
          {!settings.enableDualAccounts && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="font-semibold text-blue-700 dark:text-blue-300 text-xs mb-3 flex items-center gap-1.5">
                <IndianRupee size={13} /> Single Account Mode — Default Monthly Fee
              </p>
              <div>
                <label className={labelCls}>Default Monthly Rent Amount (₹)</label>
                <input type="number" min="0" value={settings.defaultMonthlyAmount}
                  onChange={e => setSettings({ ...settings, defaultMonthlyAmount: +e.target.value })}
                  className={inputCls} placeholder="e.g. 7500" />
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Used when generating monthly fees automatically.</p>
              </div>
            </div>
          )}

          {/* Dual Account Config (shown when dual is ON) */}
          {settings.enableDualAccounts && (
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-4">
              <p className="font-semibold text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1.5">
                <FileText size={13} /> Dual Account Mode — Configure Both Accounts
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account 1 */}
                <div className="space-y-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Account 1</p>
                  <div>
                    <label className={labelCls}>Account Name</label>
                    <input type="text" value={settings.account1Name}
                      onChange={e => setSettings({ ...settings, account1Name: e.target.value })}
                      className={inputCls} placeholder="e.g. Institution Fee" />
                  </div>
                  <div>
                    <label className={labelCls}>Receipt Prefix / Code</label>
                    <input type="text" value={settings.account1Prefix}
                      onChange={e => setSettings({ ...settings, account1Prefix: e.target.value })}
                      className={inputCls} placeholder="e.g. PC" />
                  </div>
                  <div>
                    <label className={labelCls}>Default Amount (₹)</label>
                    <input type="number" min="0" value={settings.account1DefaultAmount}
                      onChange={e => setSettings({ ...settings, account1DefaultAmount: +e.target.value })}
                      className={inputCls} />
                  </div>
                </div>

                {/* Account 2 */}
                <div className="space-y-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Account 2</p>
                  <div>
                    <label className={labelCls}>Account Name</label>
                    <input type="text" value={settings.account2Name}
                      onChange={e => setSettings({ ...settings, account2Name: e.target.value })}
                      className={inputCls} placeholder="e.g. Mess / Food" />
                  </div>
                  <div>
                    <label className={labelCls}>Receipt Prefix / Code</label>
                    <input type="text" value={settings.account2Prefix}
                      onChange={e => setSettings({ ...settings, account2Prefix: e.target.value })}
                      className={inputCls} placeholder="e.g. RJ&A" />
                  </div>
                  <div>
                    <label className={labelCls}>Default Amount (₹)</label>
                    <input type="number" min="0" value={settings.account2DefaultAmount}
                      onChange={e => setSettings({ ...settings, account2DefaultAmount: +e.target.value })}
                      className={inputCls} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-500">
                Total default split: ₹{(+settings.account1DefaultAmount + +settings.account2DefaultAmount).toLocaleString('en-IN')} per student/month
              </p>
            </div>
          )}

          <Button variant="gradient" type="submit" disabled={savingSettings} className="w-full cursor-pointer">
            {savingSettings ? 'Saving Settings…' : 'Save Hostel & Invoice Settings'}
          </Button>
        </form>
      </div>
    </div>
  );
};

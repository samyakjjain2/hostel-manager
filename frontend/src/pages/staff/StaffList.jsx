import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ShieldCheck, Plus, Search, Phone, Mail, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  // Search filter
  const [search, setSearch] = useState('');

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    role: 'Warden',
    phone: '',
    email: '',
    shift: 'Day Shift'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/staff`, {
        params: { search }
      });
      if (res.data.success) {
        setStaff(res.data.staff);
      }
    } catch {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/staff`, formData);
      if (res.data.success) {
        toast.success('Staff registered successfully');
        setAddModal(false);
        setFormData({ name: '', role: 'Warden', phone: '', email: '', shift: 'Day Shift' });
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff profile?')) return;
    try {
      const res = await axios.delete(`${API_URL}/staff/${id}`);
      if (res.data.success) {
        toast.success('Staff profile removed');
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove staff profile');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={22} /> Staff Directory
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            Manage administrative wardens, security checkpoint operators, and cooking staff.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> Add Staff Profile
        </Button>
      </div>

      {/* Filters bar */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff directory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStaff()}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 py-2.5 pl-9 pr-4 text-xs text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
          />
        </div>
        <Button variant="outline" className="w-full md:w-auto text-xs shrink-0 cursor-pointer" onClick={fetchStaff}>
          Apply Search
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : staff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((s) => (
            <div key={s.id} className="premium-card flex flex-col justify-between h-48 hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">{s.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge variant="primary">{s.role}</Badge>
                      <Badge variant="secondary">{s.shift}</Badge>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    title="Remove Staff"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="space-y-2 mt-4 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span>{s.phone}</span>
                  </div>
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/10 p-12 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Staff Profiles</h3>
          <p className="text-xs text-slate-500 mt-1">Register administrative staff to map security logs.</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Register Staff Member" footer={
        <>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="staff-form">Register Staff</Button>
        </>
      }>
        <form id="staff-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Full Name *</label>
              <input type="text" required placeholder="e.g. Ramesh Kumar" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Contact Number *</label>
              <input type="text" required placeholder="e.g. +91 98765 43213" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Staff Role / Duty *</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none">
                <option value="Warden">Warden</option>
                <option value="Assistant Warden">Assistant Warden</option>
                <option value="Security Guard">Security Guard</option>
                <option value="Mess Cook">Mess Cook</option>
                <option value="Sweeper">Sweeper</option>
                <option value="Electrician">Electrician</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Shift Type *</label>
              <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none">
                <option value="Day Shift">Day Shift (9 AM - 6 PM)</option>
                <option value="Night Shift">Night Shift (9 PM - 6 AM)</option>
                <option value="Full Time">Full Time Stay-In</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Email Address</label>
              <input type="email" placeholder="e.g. ramesh@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

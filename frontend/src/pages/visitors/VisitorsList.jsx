import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { UserCheck, Search, Plus, User, Calendar, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export const VisitorsList = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [students, setStudents] = useState([]);

  // Search filter
  const [search, setSearch] = useState('');

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relation: 'Parent',
    studentId: '',
    purpose: ''
  });

  useEffect(() => {
    fetchDropdowns();
    fetchVisitors();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 100 } });
      if (res.data.success) {
        setStudents(res.data.students);
        if (res.data.students.length > 0 && !formData.studentId) {
          setFormData(prev => ({ ...prev, studentId: res.data.students[0].id }));
        }
      }
    } catch {}
  };

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/visitors`, {
        params: { search }
      });
      if (res.data.success) {
        setVisitors(res.data.visitors);
      }
    } catch {
      toast.error('Failed to load visitor entry logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/visitors`, formData);
      if (res.data.success) {
        toast.success('Visitor checked in successfully');
        setAddModal(false);
        setFormData({ ...formData, name: '', phone: '', purpose: '' });
        fetchVisitors();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckout = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/visitors/${id}/checkout`);
      if (res.data.success) {
        toast.success('Visitor check-out logged successfully');
        fetchVisitors();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out update failed');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="text-blue-600" size={22} /> Visitors Ledger
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            Log visitor entries, verify parent contacts, and track checkout timings.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> Log Visitor Entry
        </Button>
      </div>

      {/* Filters bar */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search visitor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchVisitors()}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 py-2.5 pl-9 pr-4 text-xs text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
          />
        </div>
        <Button variant="outline" className="w-full md:w-auto text-xs shrink-0 cursor-pointer" onClick={fetchVisitors}>
          Filter Visitors
        </Button>
      </div>

      {/* Visitor Log Table */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : visitors.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                  <th className="p-4 font-semibold">Visitor Name</th>
                  <th className="p-4 font-semibold">Visited Student</th>
                  <th className="p-4 font-semibold">Purpose & Relation</th>
                  <th className="p-4 font-semibold">Time Interval</th>
                  <th className="p-4 font-semibold">Status State</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 text-slate-700 dark:text-zinc-300">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/10">
                    <td className="p-4">
                      <span className="text-slate-800 dark:text-white block font-bold">{v.name}</span>
                      <span className="text-[10px] text-slate-400 block">{v.phone}</span>
                    </td>
                    <td className="p-4 flex items-center gap-1.5 mt-2 font-bold text-slate-800 dark:text-white">
                      <User size={13} className="text-blue-600" /> {v.student?.name}
                    </td>
                    <td className="p-4">
                      <span className="text-slate-700 dark:text-zinc-350 font-semibold block">{v.purpose}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{v.relation}</span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-350 font-medium">
                      <Calendar size={13} className="inline mr-1 text-slate-400" />
                      <span>{new Date(v.checkIn).toLocaleString()} - {v.checkOut ? new Date(v.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still Inside'}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={v.status === 'CheckedIn' ? 'primary' : 'success'}>{v.status === 'CheckedIn' ? 'Checked In' : 'Checked Out'}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      {v.status === 'CheckedIn' ? (
                        <Button 
                          variant="outline" 
                          className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1"
                          onClick={() => handleCheckout(v.id)}
                        >
                          <LogOut size={12} /> Log Check-out
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-semibold italic">Checked-out</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/10 p-12 text-center">
          <UserCheck className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Visitor Log Entries</h3>
          <p className="text-xs text-slate-500 mt-1">Register visitor checkpoint logs using the sidebar button.</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Log Visitor Check-In" footer={
        <>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="visitor-form">Log Check-In</Button>
        </>
      }>
        <form id="visitor-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Visitor Full Name *</label>
              <input type="text" required placeholder="e.g. Mohan Sharma" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Contact Number *</label>
              <input type="text" required placeholder="e.g. +91 98765 43212" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Relationship *</label>
              <select value={formData.relation} onChange={(e) => setFormData({ ...formData, relation: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none">
                <option value="Parent">Parent / Father</option>
                <option value="Sibling">Sibling / Brother</option>
                <option value="Friend">Friend / Classmate</option>
                <option value="Other">Other Relative</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Select Student Visited *</label>
              <select value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 py-2.5 px-3 text-slate-850 dark:text-white outline-none">
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentNumber})</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-705 dark:text-zinc-400">Purpose of Visit *</label>
            <input type="text" required placeholder="e.g. Delivering home food / Parent meet" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none focus:border-blue-500" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AlertOctagon, Search, Plus, User, Info, MessageSquare, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export const ComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [students, setStudents] = useState([]);

  const [searchParams] = useSearchParams();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');

  useEffect(() => {
    setSelectedStatus(searchParams.get('status') || '');
  }, [searchParams]);

  // Add form state
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    description: '',
    priority: 'Medium'
  });

  // Action state
  const [resolveModal, setResolveModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolveData, setResolveData] = useState({ feedback: '' });

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchComplaints();
  // BUG FIX: added `search` to deps so typing triggers re-fetch
  }, [search, selectedStatus]);

  const fetchDropdowns = async () => {
    try {
      // BUG FIX: increased limit from 100 to 500
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 500 } });
      if (res.data.success) {
        setStudents(res.data.students);
        if (res.data.students.length > 0 && !formData.studentId) {
          setFormData(prev => ({ ...prev, studentId: res.data.students[0].id }));
        }
      }
    } catch {}
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/complaints`, {
        params: {
          search,
          status: selectedStatus
        }
      });
      if (res.data.success) {
        setComplaints(res.data.complaints);
      }
    } catch {
      toast.error('Failed to load complaints log');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/complaints`, formData);
      if (res.data.success) {
        toast.success('Complaint registered successfully');
        setAddModal(false);
        setFormData({ ...formData, title: '', description: '' });
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/complaints/${selectedComplaint.id}/resolve`, resolveData);
      if (res.data.success) {
        toast.success('Complaint status marked resolved');
        setResolveModal(false);
        setResolveData({ feedback: '' });
        fetchComplaints();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resolution update failed');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <AlertOctagon className="text-blue-600" size={22} /> Housekeeping & Complaints
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            Resolve structural complaints, student feedback, and maintenance tasks.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> File Complaint
        </Button>
      </div>

      {/* Filters bar */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchComplaints()}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 py-2.5 pl-9 pr-4 text-xs text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full md:w-44 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 py-2.5 px-3.5 text-xs text-slate-700 dark:text-white outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="InProgress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <Button variant="outline" className="w-full md:w-auto text-xs shrink-0 cursor-pointer" onClick={fetchComplaints}>
          Apply Filters
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : complaints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complaints.map((c) => (
            <div key={c.id} className="premium-card flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Ticket: #{c.id.slice(-6).toUpperCase()}</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide mt-0.5">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={c.priority === 'High' ? 'danger' : 'primary'}>{c.priority}</Badge>
                    <Badge variant={c.status === 'Resolved' ? 'success' : 'warning'}>
                      {c.status === 'InProgress' ? 'In Progress' : c.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-slate-550 dark:text-zinc-400 text-xs leading-relaxed">
                  {c.description}
                </p>

                <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="flex items-center gap-1">
                    <User size={13} className="text-blue-650" /> {c.student?.name}
                  </span>
                  <span>Registered: {new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {c.status !== 'Resolved' && (
                <div className="flex justify-end pt-4 mt-2">
                  <Button 
                    variant="outline" 
                    className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1"
                    onClick={() => { setSelectedComplaint(c); setResolveModal(true); }}
                  >
                    <Wrench size={12} /> Mark Resolve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/10 p-12 text-center">
          <AlertOctagon className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Complaints Logged</h3>
          <p className="text-xs text-slate-500 mt-1">Submit issues to track maintenance ticket states.</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="File Support Ticket" footer={
        <>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="complaint-form">File Complaint</Button>
        </>
      }>
        <form id="complaint-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Student Profile *</label>
              <select value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 py-2.5 px-3 text-slate-850 dark:text-white outline-none">
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentNumber})</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Priority level</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 py-2.5 px-3 text-slate-850 dark:text-white outline-none">
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-705 dark:text-zinc-400">Brief Title / Topic *</label>
            <input type="text" required placeholder="e.g. Toilet tap leak in 2nd Floor bathroom" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none focus:border-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-705 dark:text-zinc-400">Elaborated Description *</label>
            <textarea rows="3" required placeholder="Provide context of issue for the plumbing or electrician staff..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 py-2.5 px-3 text-slate-850 dark:text-white outline-none focus:border-blue-500" />
          </div>
        </form>
      </Modal>

      {/* Resolve Modal */}
      <Modal isOpen={resolveModal} onClose={() => setResolveModal(false)} title="Close Ticket" footer={
        <>
          <Button variant="secondary" onClick={() => setResolveModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="resolve-form">Submit Resolution</Button>
        </>
      }>
        <form id="resolve-form" onSubmit={handleResolve} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-705 dark:text-zinc-400">Resolution Feedback Comments *</label>
            <textarea rows="3" required placeholder="Describe what actions were performed to fix the issue..." value={resolveData.feedback} onChange={(e) => setResolveData({ ...resolveData, feedback: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 py-2.5 px-3 text-slate-850 dark:text-white outline-none focus:border-blue-500" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

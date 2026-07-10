import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Search, Plus, Eye, Phone, Home, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enrollmentNumber: '',
    parentName: '',
    parentPhone: '',
    address: ''
  });

  useEffect(() => {
    fetchStudents();
  // BUG FIX: added `search` to deps so search box triggers re-fetch
  }, [page, search, selectedStatus]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/students`, {
        params: {
          search,
          status: selectedStatus,
          page,
          limit: 10
        }
      });
      if (res.data.success) {
        setStudents(res.data.students);
        setTotalPages(res.data.pages);
      }
    } catch {
      toast.error('Failed to load students directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/students`, formData);
      if (res.data.success) {
        toast.success('Student registered successfully');
        setAddModal(false);
        setFormData({ name: '', email: '', phone: '', enrollmentNumber: '', parentName: '', parentPhone: '', address: '' });
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            Student Management
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            Maintain enrollment databases, guardian contacts, and status logs.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> Register Student
        </Button>
      </div>

      {/* Filter panel */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, email, roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 py-2.5 pl-9 pr-4 text-xs text-slate-700 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          className="w-full md:w-44 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 py-2.5 px-3.5 text-xs text-slate-700 dark:text-white outline-none focus:border-blue-500 font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="CheckedOut">Checked Out</option>
          <option value="Suspended">Suspended</option>
          <option value="Inactive">Inactive</option>
        </select>

        <Button variant="outline" className="w-full md:w-auto text-xs shrink-0 cursor-pointer" onClick={fetchStudents}>
          Filter Directory
        </Button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : students.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                  <th className="p-4 font-semibold">Student Identity</th>
                  <th className="p-4 font-semibold">Mobile Number</th>
                  <th className="p-4 font-semibold">Allocated Room</th>
                  <th className="p-4 font-semibold">Verification State</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 text-slate-700 dark:text-zinc-300">
                {students.map((student) => {
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/10">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-650 flex items-center justify-center font-bold text-xs uppercase">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-slate-800 dark:text-white block font-bold">{student.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{student.enrollmentNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 flex items-center gap-1.5 mt-2 text-slate-600 dark:text-slate-350">
                        <Phone size={13} className="text-slate-400" /> {student.phone || 'N/A'}
                      </td>
                      <td className="p-4">
                        {student.room ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-white">
                            <Home size={13} className="text-blue-600" />
                            Room {student.room.roomNumber} ({student.room.hostel?.name})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not Allocated</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            student.status === 'Active' 
                              ? 'success' 
                              : student.status === 'CheckedOut' 
                              ? 'secondary' 
                              : student.status === 'Suspended'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {student.status === 'CheckedOut' ? 'Checked Out' : student.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Link to={`/students/${student.id}`}>
                          <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1">
                            <Eye size={12} /> Profile Card
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/10 p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Students Found</h3>
          <p className="text-xs text-slate-500 mt-1">Register student profiles to initialize allocation workflows.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs font-semibold">
          <span className="text-slate-400">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} className="cursor-pointer">Previous</Button>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="cursor-pointer">Next</Button>
          </div>
        </div>
      )}

      {/* Register Student Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Register Student Profile"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="gradient" type="submit" form="student-form">Save Registry</Button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Enrollment / Registration Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. BT/CS/2023/145"
                value={formData.enrollmentNumber}
                onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Contact Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Father's / Guardian's Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mohan Sharma"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Guardian's Contact Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. +91 98765 43211"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-zinc-400">Correspondence Address</label>
            <textarea
              rows="2"
              placeholder="Full resident address coordinates..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none focus:border-blue-500"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

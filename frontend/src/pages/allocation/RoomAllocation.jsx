import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { GitPullRequest, Search, Home, Plus, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const RoomAllocation = () => {
  const [allocations, setAllocations] = useState([]);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const triggerConfirm = (title, message, action) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Form allocation state
  const [formData, setFormData] = useState({
    studentId: '',
    roomId: '',
    bedNumber: '1',
    startDate: ''
  });

  useEffect(() => {
    fetchAllocations();
    fetchStudents();
    fetchRooms();
  }, []);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/allocations`);
      if (res.data.success) {
        setAllocations(res.data.allocations);
      }
    } catch {
      toast.error('Failed to load stay allocations logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 100 } });
      if (res.data.success) {
        const unallocated = res.data.students.filter(s => !s.room);
        setStudents(unallocated);
        if (unallocated.length > 0) {
          setFormData(prev => ({ ...prev, studentId: unallocated[0].id }));
        } else {
          setFormData(prev => ({ ...prev, studentId: '' }));
        }
      }
    } catch {}
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/rooms`);
      if (res.data.success) {
        setRooms(res.data.rooms.filter(r => r.occupiedBeds < r.capacity));
        if (res.data.rooms.length > 0 && !formData.roomId) {
          setFormData(prev => ({ ...prev, roomId: res.data.rooms[0].id }));
        }
      }
    } catch {}
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!formData.startDate) {
      toast.error('Stay start date is required');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/allocations`, formData);
      if (res.data.success) {
        toast.success('Bed stay allocated successfully');
        fetchAllocations();
        fetchRooms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate bed stay');
    }
  };

  const handleDeallocate = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/allocations/${id}/checkout`);
      if (res.data.success) {
        toast.success('Check-out stay logged successfully');
        fetchAllocations();
        fetchRooms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed check-out update');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
          <GitPullRequest className="text-blue-600" size={22} /> Stay Allocations
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
          Map student profiles into unoccupied beds and update check-out logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form allocator card */}
        <div className="lg:col-span-1">
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2">
              Allocate New Bed Stays
            </h3>

            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-400">Select Student Member *</label>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none"
                >
                  {students.length === 0 ? (
                    <option value="" disabled>No unallocated students available</option>
                  ) : (
                    students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentNumber})</option>)
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-400">Select Available Room *</label>
                <select
                  required
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none"
                >
                  {rooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.hostel?.name}) - {r.type}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-zinc-400">Bed Identification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bed A"
                    value={formData.bedNumber}
                    onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-zinc-400">Start Stay Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="gradient" className="w-full py-2.5 font-bold cursor-pointer text-xs">
                  Save Bed Allocation
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Columns: Active Stay list table */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex h-[40vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : allocations.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/30 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                      <th className="p-4 font-semibold">Student Identity</th>
                      <th className="p-4 font-semibold">Allocated Bed / Room</th>
                      <th className="p-4 font-semibold">Stay Interval</th>
                      <th className="p-4 font-semibold">Status State</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 text-slate-700 dark:text-zinc-300">
                    {allocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/10">
                        <td className="p-4">
                          <span className="text-slate-800 dark:text-white block font-bold">{alloc.student?.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{alloc.student?.enrollmentNumber}</span>
                        </td>
                        <td className="p-4 font-semibold">
                          Room {alloc.room?.roomNumber} ({alloc.room?.hostel?.name})
                          <span className="block text-[10px] text-slate-400">Bed: {alloc.bedNo}</span>
                        </td>
                        <td className="p-4 flex items-center gap-1 mt-3.5 text-slate-600 dark:text-slate-350">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(alloc.checkIn).toLocaleDateString()} - {alloc.checkOut ? new Date(alloc.checkOut).toLocaleDateString() : 'Present'}</span>
                        </td>
                        <td className="p-4">
                          <Badge variant={alloc.status === 'Active' ? 'success' : 'secondary'}>{alloc.status}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          {alloc.status === 'Active' ? (
                            <Button 
                              variant="outline" 
                              className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              onClick={() => triggerConfirm(
                                'Checkout Bed Stay',
                                `Are you sure you want to end the stay allocation for ${alloc.student?.name || 'this student'} in Room ${alloc.room?.roomNumber || 'N/A'}?`,
                                () => handleDeallocate(alloc.id)
                              )}
                            >
                              Checkout Bed
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
              <GitPullRequest className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Stays Allocated</h3>
              <p className="text-xs text-slate-500 mt-1">Assign students to rooms from the sidebar form to populate allocation ledgers.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmModal.onConfirm}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
          {confirmModal.message}
        </p>
      </Modal>
    </div>
  );
};

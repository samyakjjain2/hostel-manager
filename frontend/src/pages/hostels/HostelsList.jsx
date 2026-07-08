import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Building2, Plus, BedDouble, ShieldCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const HostelsList = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'Boys', address: '', capacity: 100 });

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/hostels`);
      if (res.data.success) {
        setHostels(res.data.hostels);
      }
    } catch {
      toast.error('Failed to load hostels list');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/hostels`, formData);
      if (res.data.success) {
        toast.success('Hostel added successfully');
        setAddModal(false);
        setFormData({ name: '', type: 'Boys', address: '', capacity: 100 });
        fetchHostels();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add hostel');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hostel? All associated rooms and allocations will be removed.')) return;
    try {
      const res = await axios.delete(`${API_URL}/hostels/${id}`);
      if (res.data.success) {
        toast.success('Hostel deleted successfully');
        fetchHostels();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete hostel');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="text-blue-600" size={22} /> Hostel Inventory
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            Register and manage physical buildings, blocks, and institutional branches.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> Add Hostel Branch
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : hostels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostels.map((hostel) => (
            <div key={hostel.id} className="premium-card flex flex-col justify-between h-48 hover:shadow-md transition">
              <div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                      {hostel.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                      <ShieldCheck size={10} /> {hostel.type}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(hostel.id)} 
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                    title="Delete Hostel"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-xs mt-3.5 leading-relaxed truncate">
                  {hostel.address || 'No address specified'}
                </p>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-100 dark:border-zinc-800 pt-3.5 mt-2.5 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                <span className="flex items-center gap-1">
                  <BedDouble size={14} className="text-blue-600" />
                  Capacity: {hostel.capacity} Beds
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/10 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-450 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Hostels Registered</h3>
          <p className="text-xs text-slate-500 mt-1">Add your boys or girls hostel branches to start setting up rooms.</p>
        </div>
      )}

      {/* Add Hostel Modal */}
      <Modal 
        isOpen={addModal} 
        onClose={() => setAddModal(false)} 
        title="Add New Hostel Branch"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="gradient" type="submit" form="hostel-form">Save Branch</Button>
          </>
        }
      >
        <form id="hostel-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-zinc-400">Hostel Name *</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Pratibha Chayan Chatrawas" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none focus:border-blue-500" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Hostel Type *</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none"
              >
                <option value="Boys">Boys Hostel</option>
                <option value="Girls">Girls Hostel</option>
                <option value="Co-Ed">Co-Ed Hostel</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Capacity (Total Beds) *</label>
              <input 
                type="number" 
                required 
                min="1" 
                value={formData.capacity} 
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} 
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-800 dark:text-white outline-none" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-zinc-400">Address / Location</label>
            <textarea 
              rows="3" 
              placeholder="Full physical coordinates of building branch..." 
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

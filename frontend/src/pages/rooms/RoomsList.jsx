import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { DoorClosed, Plus, Users, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const RoomsList = () => {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);

  // Filters & Page state
  const [selectedHostel, setSelectedHostel] = useState('');
  const [roomType, setRoomType] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    roomNumber: '',
    hostelId: '',
    floor: 0,
    type: 'Double Sharing',
    monthlyRent: 7500,
    capacity: 2
  });

  useEffect(() => {
    fetchHostels();
    fetchRooms();
  }, [selectedHostel, roomType]);

  const fetchHostels = async () => {
    try {
      const res = await axios.get(`${API_URL}/hostels`);
      if (res.data.success) {
        setHostels(res.data.hostels);
        if (res.data.hostels.length > 0 && !formData.hostelId) {
          setFormData(prev => ({ ...prev, hostelId: res.data.hostels[0].id }));
        }
      }
    } catch {}
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/rooms`, {
        params: {
          hostelId: selectedHostel,
          type: roomType,
          limit: 100
        }
      });
      if (res.data.success) {
        setRooms(res.data.rooms);
      }
    } catch {
      toast.error('Failed to load rooms list');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure we convert numbers properly
      const payload = {
        ...formData,
        floor: parseInt(formData.floor) || 0,
        capacity: parseInt(formData.capacity) || 1,
        monthlyRent: 7500 // Rent is strictly fixed at 7500
      };

      const res = await axios.post(`${API_URL}/rooms`, payload);
      if (res.data.success) {
        toast.success('Room added successfully');
        setAddModal(false);
        setFormData({ ...formData, roomNumber: '' });
        fetchRooms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room? This cannot be undone.')) return;
    try {
      const res = await axios.delete(`${API_URL}/rooms/${id}`);
      if (res.data.success) {
        toast.success('Room deleted successfully');
        fetchRooms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <DoorClosed className="text-blue-600" size={22} /> Rooms Inventory
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            Configure room inventory, set rent brackets, and monitor occupancy states.
          </p>
        </div>
        <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs self-start" onClick={() => setAddModal(true)}>
          <Plus size={14} /> Add Room
        </Button>
      </div>

      {/* Filters bar */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-64 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hostel Branch</label>
          <select 
            value={selectedHostel} 
            onChange={(e) => setSelectedHostel(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 py-2 px-3 text-slate-800 dark:text-white outline-none"
          >
            <option value="">All Branches</option>
            {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        <div className="w-full md:w-64 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sharing/Room Type</label>
          <select 
            value={roomType} 
            onChange={(e) => setRoomType(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 py-2 px-3 text-slate-800 dark:text-white outline-none"
          >
            <option value="">All Types</option>
            <option value="Single Room">Single Room</option>
            <option value="Double Sharing">Double Sharing</option>
            <option value="Triple Sharing">Triple Sharing</option>
            <option value="Four Sharing">Four Sharing</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {rooms.map((room) => {
            const allocsCount = room.occupiedBeds || 0;
            const vacantBeds = Math.max(0, room.capacity - allocsCount);
            const isFull = vacantBeds === 0;

            return (
              <div key={room.id} className="premium-card flex flex-col justify-between h-48 hover:shadow-md transition">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                        {room.hostel?.name || 'Aegis Block'}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-1">
                        Room {room.roomNumber}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={isFull ? 'danger' : vacantBeds === room.capacity ? 'success' : 'primary'}>
                        {isFull ? 'Full' : `${vacantBeds} Beds Vacant`}
                      </Badge>
                      <button 
                        onClick={() => handleDelete(room.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                        title="Delete Room"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-500 dark:text-zinc-400 text-xs mt-3.5 flex items-center gap-1 font-semibold">
                    <Users size={14} className="text-blue-605 shrink-0" />
                    <span>Occupied: {allocsCount} / {room.capacity} Beds</span>
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3.5 mt-2 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400 font-bold">{room.type}</span>
                  <span className="text-slate-850 dark:text-white font-extrabold">₹{room.monthlyRent?.toLocaleString()} / mo</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/10 p-12 text-center">
          <DoorClosed className="mx-auto h-12 w-12 text-slate-450 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Rooms Set Up</h3>
          <p className="text-xs text-slate-500 mt-1">Add rooms, rent, and beds configuration to register room allocations.</p>
        </div>
      )}

      {/* Add Room Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Add New Room Setup"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button variant="gradient" type="submit" form="room-form">Create Room</Button>
          </>
        }
      >
        <form id="room-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Hostel Branch *</label>
              <select
                required
                value={formData.hostelId}
                onChange={(e) => setFormData({ ...formData, hostelId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none font-semibold"
              >
                {hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-400">Floor Level *</label>
              <select
                required
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none font-semibold"
              >
                <option value={0}>Ground Floor</option>
                <option value={1}>First Floor</option>
                <option value={2}>Second Floor</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Room Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. G1 or 101"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-805 dark:text-white outline-none font-semibold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-707 dark:text-zinc-400">Room Category *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-850 dark:text-white outline-none font-semibold"
              >
                <option value="Single Room">Single Room</option>
                <option value="Double Sharing">Double Sharing</option>
                <option value="Triple Sharing">Triple Sharing</option>
                <option value="Four Sharing">Four Sharing</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-705 dark:text-zinc-400">Beds Quantity (Capacity) *</label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3 text-slate-805 dark:text-white outline-none font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-400 dark:text-zinc-550">Monthly Rent (Fixed) *</label>
              <input
                type="text"
                readOnly
                value="₹ 7,500"
                className="w-full rounded-lg border border-slate-200 bg-slate-100/50 py-2.5 px-3 text-slate-500 outline-none font-bold select-none cursor-not-allowed"
                title="Rent is fixed at ₹7,500 for all rooms"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

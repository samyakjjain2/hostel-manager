import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Home, 
  CreditCard, 
  Calendar, 
  FileText, 
  Clock, 
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
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

  const activeAlloc = student?.allocations?.find(a => a.status === 'Active');

  const handleDirectCheckout = async () => {
    try {
      let success = false;
      if (activeAlloc) {
        const res = await axios.put(`${API_URL}/allocations/${activeAlloc.id}/checkout`);
        success = res.data.success;
      } else {
        const res = await axios.post(`${API_URL}/allocations/checkout`, { studentId: student.id });
        success = res.data.success;
      }
      if (success) {
        toast.success('Student check-out completed successfully');
        fetchStudentProfile();
      }
    } catch {
      toast.error('Failed to complete student check-out');
    }
  };

  const handleDeleteStudent = async () => {
    try {
      const res = await axios.delete(`${API_URL}/students/${student.id}`);
      if (res.data.success) {
        toast.success('Student profile deleted successfully');
        navigate('/students');
      }
    } catch {
      toast.error('Failed to delete student profile');
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  const fetchStudentProfile = async () => {
    setLoading(true);
    try {
      const [resStud, resFees] = await Promise.all([
        axios.get(`${API_URL}/students/${id}`),
        axios.get(`${API_URL}/fees`, { params: { studentId: id } }) // Filter by studentId in ledger
      ]);

      if (resStud.data.success) setStudent(resStud.data.student);
      if (resFees.data.success) setFees(resFees.data.fees.filter(f => f.studentId === id));
    } catch {
      toast.error('Failed to load student profile card');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center p-12 space-y-3">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Profile Not Found</h3>
        <Link to="/students">
          <Button variant="outline" className="mt-2 text-xs font-bold gap-1">
            <ArrowLeft size={14} /> Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      {/* Header Back bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/students">
            <button className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Resident Student Card</h1>
            <p className="text-slate-500 text-xs mt-0.5">Warden profile review for checking bed stays and monthly ledger splits.</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          {student.status === 'Active' && (
            <Button 
              variant="outline" 
              className="text-amber-600 border-amber-300 hover:bg-amber-50 text-xs font-bold shrink-0"
              onClick={() => triggerConfirm(
                'Checkout Student Stay',
                `Are you sure you want to log check-out for ${student.name}? This will free up their bed allocation in Room ${activeAlloc?.room?.roomNumber || 'N/A'}.`,
                handleDirectCheckout
              )}
            >
              Checkout Student Stay
            </Button>
          )}
          <Button 
            variant="danger" 
            className="text-xs font-bold shrink-0"
            onClick={() => triggerConfirm(
              'DELETE Student Profile',
              `Are you sure you want to permanently delete the profile of student ${student.name}? All related stay history, fee split invoices, and files will be permanently deleted. This action cannot be undone.`,
              handleDeleteStudent
            )}
          >
            Delete Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Information card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card text-center flex flex-col items-center py-8">
            <div className="h-24 w-24 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-650 flex items-center justify-center font-black text-3xl shadow-inner border border-blue-100 dark:border-blue-900/30">
              {student.name.charAt(0)}
            </div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white mt-4 tracking-tight uppercase">
              {student.name}
            </h2>
            <p className="text-slate-400 font-mono text-[10px] tracking-wide mt-1">
              ID: {student.enrollmentNumber}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
              <Badge variant="success">Resident Member</Badge>
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
            </div>

            <div className="w-full border-t border-slate-100 dark:border-zinc-800 pt-6 mt-6 space-y-3.5 text-left text-xs">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <span className="text-slate-700 dark:text-zinc-300 font-semibold truncate">{student.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />
                <span className="text-slate-700 dark:text-zinc-300 font-semibold">{student.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 items-start">
                <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <span className="text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">{student.address || 'No address registered'}</span>
              </div>
            </div>
          </div>

          {/* Room Allocation details */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <Home size={14} className="text-blue-600" /> Allocated Room Details
            </h3>

            {activeAlloc ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Hostel Branch:</span>
                  <span className="text-slate-800 dark:text-white font-bold">{activeAlloc.room?.hostel?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Room Number:</span>
                  <span className="text-slate-800 dark:text-white font-bold">Room {activeAlloc.room?.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Rent Plan:</span>
                  <span className="text-slate-800 dark:text-white font-extrabold">₹{activeAlloc.room?.monthlyRent?.toLocaleString() || '7,500'} / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Bed Allocated:</span>
                  <span className="text-slate-800 dark:text-white font-bold">Bed {activeAlloc.bedNo || '1'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Date of Stay:</span>
                  <span className="text-slate-800 dark:text-white font-bold">{activeAlloc.checkIn ? new Date(activeAlloc.checkIn).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 italic text-center py-4">No active stay allocation recorded.</p>
            )}
          </div>
        </div>

        {/* Right Columns: Financial Ledger details & timeline logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guardian Card information */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-650" /> Guardian Contacts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Father's / Guardian's Name</span>
                <p className="text-slate-800 dark:text-white font-bold text-sm">{student.parentName || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Guardian Phone</span>
                <p className="text-slate-800 dark:text-white font-bold text-sm">{student.parentPhone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* split Fee status log */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <CreditCard size={14} className="text-blue-600" /> Split Invoices Ledger
            </h3>

            {fees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                      <th className="pb-2 font-semibold">Bill Period</th>
                      <th className="pb-2 font-semibold">Account 1 (₹3,000)</th>
                      <th className="pb-2 font-semibold">Account 2 (₹4,500)</th>
                      <th className="pb-2 font-semibold">Total Amount</th>
                      <th className="pb-2 font-semibold text-right">Receipt Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 text-slate-700 dark:text-zinc-300">
                    {fees.map((fee) => (
                      <tr key={fee.id}>
                        <td className="py-3 font-semibold">{fee.month}/{fee.year}</td>
                        <td className="py-3 font-semibold">₹{fee.paidAccount1} / ₹{fee.amountAccount1}</td>
                        <td className="py-3 font-semibold">₹{fee.paidAccount2} / ₹{fee.amountAccount2}</td>
                        <td className="py-3 font-bold text-slate-850 dark:text-white">₹{fee.amount}</td>
                        <td className="py-3 text-right">
                          <Badge variant={fee.status === 'Paid' ? 'success' : 'danger'}>{fee.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 italic text-center py-4">No billing history details available.</p>
            )}
          </div>

          {/* Student Documents Checklist card */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <FileText size={14} className="text-blue-600" /> Registry Documents Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                <span className="text-slate-700 dark:text-zinc-300">Aadhaar Card / ID</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                <span className="text-slate-700 dark:text-zinc-300">College Admission Letter</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-150 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-900/40 text-slate-400">
                <Clock size={15} className="text-orange-500 shrink-0" />
                <span>Security Deposit Receipt</span>
              </div>
            </div>
          </div>
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
            <Button 
              variant={confirmModal.title.includes('DELETE') ? 'danger' : 'primary'} 
              onClick={confirmModal.onConfirm}
            >
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

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { CreditCard, Search, Plus, Settings, CheckCircle2, Printer } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const FeesList = () => {
  const { user } = useAuth();

  // --- Dynamic settings from admin profile ---
  const isDual = user?.enableDualAccounts ?? false;
  const acc1Name = user?.account1Name || 'Account 1';
  const acc2Name = user?.account2Name || 'Account 2';
  const acc1Prefix = user?.account1Prefix || 'PC';
  const acc2Prefix = user?.account2Prefix || 'RJ&A';
  const acc1Default = user?.account1DefaultAmount ?? 3000;
  const acc2Default = user?.account2DefaultAmount ?? 4500;
  const hostelName = user?.hostelName || 'Hostel';
  const hostelAddress = user?.hostelAddress || '';
  const hostelPhone = user?.hostelPhone || '';
  const signatoryName = user?.signatoryName || 'Authorized';

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [activeAccount, setActiveAccount] = useState(1);
  const [statsData, setStatsData] = useState({ breakdown: { UPI: 0, Cash: 0, "Debit Card": 0, "Credit Card": 0, "Bank Transfer": 0, Cheque: 0, Other: 0 }, totalCollected: 0 });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(searchParams.get('month') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');

  useEffect(() => {
    setSelectedStatus(searchParams.get('status') || '');
    setSelectedMonth(searchParams.get('month') || '');
    setSelectedYear(searchParams.get('year') || '');
    setPage(1);

    if (searchParams.get('action') === 'generate') {
      setGenModal(true);
    } else {
      setGenModal(false);
    }
  }, [searchParams]);

  // Modals
  const [genModal, setGenModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [printFee, setPrintFee] = useState(null);

  const [selectedFee, setSelectedFee] = useState(null);

  // Form states
  const [genData, setGenData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), dueDate: '' });
  const [addData, setAddData] = useState({ studentId: '', type: 'Monthly', amountAccount1: acc1Default, amountAccount2: acc2Default, month: new Date().getMonth() + 1, year: new Date().getFullYear(), dueDate: '' });
  const [payData, setPayData] = useState({ paidAmount: 0, paymentMode: 'UPI', transactionId: '', notes: '' });

  const [customInvoiceDate, setCustomInvoiceDate] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  useEffect(() => {
    if (printFee) {
      const defaultDate = printFee.paidAt 
        ? new Date(printFee.paidAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setCustomInvoiceDate(defaultDate);
      setIsEditingDate(false);
    }
  }, [printFee]);

  useEffect(() => {
    fetchDropdowns();
    fetchStats();
  }, []);

  // BUG FIX: added `search` to deps so typing in search actually triggers re-fetch
  useEffect(() => {
    fetchFees();
  }, [page, search, selectedStatus, selectedMonth, selectedYear, selectedPaymentMode, activeAccount]);

  const fetchDropdowns = async () => {
    try {
      // BUG FIX: increased limit from 100 to 500 so all students appear in dropdown
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 500 } });
      if (res.data.success) setStudents(res.data.students);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/fees/stats`);
      if (res.data.success) {
        setStatsData({
          breakdown: res.data.breakdown,
          totalCollected: res.data.totalCollected
        });
      }
    } catch {}
  };

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/fees`, {
        params: {
          search: search || undefined,
          status: selectedStatus || undefined,   // BUG FIX: send status to API (server-side filter)
          page,
          limit: 10,
          month: selectedMonth || undefined,
          year: selectedYear || undefined,
          paymentMode: selectedPaymentMode || undefined
        }
      });
      if (res.data.success) {
        setFees(res.data.fees);
        setTotalPages(res.data.pages);
      }
    } catch {
      toast.error('Failed to load fee ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleGenInvoices = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/fees/generate`, genData);
      if (res.data.success) {
        toast.success(res.data.message);
        setGenModal(false);
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    if ((parseFloat(addData.amountAccount1) || 0) + (parseFloat(addData.amountAccount2) || 0) <= 0) {
      toast.error('Total fee amount must be greater than 0');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/fees`, addData);
      if (res.data.success) {
        toast.success('Split fee record created successfully');
        setAddModal(false);
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const handlePayFee = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        paidAccount1: activeAccount === 1 ? parseFloat(payData.paidAmount) || 0 : 0,
        paidAccount2: activeAccount === 2 ? parseFloat(payData.paidAmount) || 0 : 0,
        // Also send paidAmount for single-account mode backend
        paidAmount: parseFloat(payData.paidAmount) || 0,
        discount: 0,
        fine: 0,
        paymentMode: payData.paymentMode,
        transactionId: payData.transactionId,
        notes: payData.notes
      };

      const res = await axios.put(`${API_URL}/fees/${selectedFee.id}/pay`, payload);
      if (res.data.success) {
        toast.success(`Account ${activeAccount} payment recorded successfully`);
        setPayModal(false);
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment update failed');
    }
  };

  const handleCancelPayment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this receipt? This will reset all payments on this bill back to 0.')) return;
    try {
      const res = await axios.put(`${API_URL}/fees/${id}/cancel-payment`);
      if (res.data.success) {
        toast.success('Receipt cancelled and billing reset to Pending');
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel receipt');
    }
  };

  const handleDeleteFee = async (id) => {
    if (!window.confirm('Are you sure you want to DELETE this fee record? This action cannot be undone.')) return;
    try {
      const res = await axios.delete(`${API_URL}/fees/${id}`);
      if (res.data.success) {
        toast.success('Fee record deleted successfully');
        fetchFees();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete fee record');
    }
  };

  const openPay = (fee) => {
    setSelectedFee(fee);
    // BUG FIX: use || 0 to prevent NaN when amountAccount1/paidAccount1 is null
    const balance = activeAccount === 1 
      ? (fee.amountAccount1 || 0) - (fee.paidAccount1 || 0) 
      : (fee.amountAccount2 || 0) - (fee.paidAccount2 || 0);
      
    setPayData({
      paidAmount: Math.max(0, balance),
      paymentMode: 'UPI',
      transactionId: '',
      notes: ''
    });
    setPayModal(true);
  };

  const openAdd = () => {
    if (students.length === 0) {
      toast.error('Register student profile first');
      return;
    }
    setAddData({
      studentId: students[0]?.id || '',
      type: 'Monthly',
      amountAccount1: acc1Default,
      amountAccount2: acc2Default,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      dueDate: ''
    });
    setAddModal(true);
  };

  const getHindiMonthName = (month) => {
    const hindiMonths = [
      'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
      'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
    ];
    return hindiMonths[month - 1] || 'माह';
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="text-blue-600" size={22} /> Finance Ledger
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            {isDual
              ? `Split billing: ${acc1Name} (₹${acc1Default.toLocaleString('en-IN')}) + ${acc2Name} (₹${acc2Default.toLocaleString('en-IN')})`
              : `Single account billing — Monthly fee: ₹${(user?.defaultMonthlyAmount ?? 7500).toLocaleString('en-IN')}`
            }
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5 cursor-pointer text-xs" onClick={openAdd}>
            <Plus size={14} /> {isDual ? 'Add Split Fee' : 'Create Invoice'}
          </Button>
        </div>
      </div>

      {/* Payment Summary Cards breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Card */}
        <div 
          onClick={() => { setSelectedPaymentMode(''); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-blue-500 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === '' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Total Collected</p>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mt-1">₹{statsData.totalCollected.toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">₹</div>
        </div>

        {/* UPI Card */}
        <div 
          onClick={() => { setSelectedPaymentMode(selectedPaymentMode === 'UPI' ? '' : 'UPI'); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-emerald-500 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === 'UPI' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">UPI / QR Code</p>
            <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-450 mt-1">₹{statsData.breakdown.UPI.toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-905/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">UPI</div>
        </div>

        {/* Cash Card */}
        <div 
          onClick={() => { setSelectedPaymentMode(selectedPaymentMode === 'Cash' ? '' : 'Cash'); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-amber-500 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === 'Cash' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cash Payments</p>
            <h3 className="text-lg font-black text-amber-600 dark:text-amber-450 mt-1">₹{statsData.breakdown.Cash.toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-905/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">CASH</div>
        </div>

        {/* Cards (Debit/Credit) */}
        <div 
          onClick={() => { setSelectedPaymentMode(selectedPaymentMode === 'Debit Card,Credit Card' ? '' : 'Debit Card,Credit Card'); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-indigo-500 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === 'Debit Card,Credit Card' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Card Payments</p>
            <h3 className="text-lg font-black text-indigo-655 dark:text-indigo-400 mt-1">₹{(statsData.breakdown["Debit Card"] + statsData.breakdown["Credit Card"]).toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-905/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px]">CARD</div>
        </div>

        {/* Bank / Others */}
        <div 
          onClick={() => { setSelectedPaymentMode(selectedPaymentMode === 'Bank Transfer,Cheque,Other' ? '' : 'Bank Transfer,Cheque,Other'); setPage(1); }}
          className={`premium-card p-4 flex items-center justify-between border-l-4 border-slate-400 cursor-pointer select-none transition-all duration-200 hover:scale-[1.02] ${
            selectedPaymentMode === 'Bank Transfer,Cheque,Other' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm'
          }`}
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Bank / Cheque / Other</p>
            <h3 className="text-lg font-black text-slate-700 dark:text-zinc-300 mt-1">₹{(statsData.breakdown["Bank Transfer"] + statsData.breakdown.Cheque + statsData.breakdown.Other).toLocaleString('en-IN')}</h3>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center font-bold text-xs">BANK</div>
        </div>
      </div>

      {/* Account Switch Tabs Navigation */}
      <div className="flex border-b border-slate-200 pt-2">
        <button
          onClick={() => { setActiveAccount(1); setPage(1); }}
          className={`px-6 py-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeAccount === 1 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          {isDual ? `${acc1Name} Ledger (₹${acc1Default.toLocaleString('en-IN')})` : 'Fee Ledger'}
        </button>
        {isDual && (
        <button
          onClick={() => { setActiveAccount(2); setPage(1); }}
          className={`px-6 py-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeAccount === 2 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          {acc2Name} Ledger (₹{acc2Default.toLocaleString('en-IN')})
        </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchFees()}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          className="w-full md:w-36 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }}
          className="w-full md:w-36 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none font-semibold"
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Year (e.g. 2026)"
          value={selectedYear}
          onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
          className="w-full md:w-28 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none font-semibold"
        />

        <Button variant="outline" className="w-full md:w-auto text-xs shrink-0 cursor-pointer font-bold" onClick={fetchFees}>
          Apply Filters
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : fees.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 bg-slate-50/50">
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Student Identity</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Billing Month</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Total Bill Amount</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Amount Paid</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Balance Due</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {fees.map((fee) => {
                  const billAmt = activeAccount === 1 ? fee.amountAccount1 : fee.amountAccount2;
                  const paidAmt = activeAccount === 1 ? fee.paidAccount1 : fee.paidAccount2;
                  const balance = Math.max(0, billAmt - paidAmt);
                  
                  // Bug fix: 0 >= 0 was returning true (unpaid ₹0 bills showing as Settled)
                  // Now requires billAmt > 0 to be considered Paid
                  const isPaid = billAmt > 0 && paidAmt >= billAmt;
                  const isPartial = paidAmt > 0 && paidAmt < billAmt;
                  const statusLabel = isPaid ? 'Paid' : isPartial ? 'Partial' : 'Pending';

                  return (
                    <tr key={fee.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <span className="text-slate-800 block font-bold">{fee.student?.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono font-semibold">{fee.student?.enrollmentNumber}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {fee.month ? `${new Date(0, fee.month - 1).toLocaleString('default', { month: 'short' })} ${fee.year}` : 'N/A'}
                      </td>
                      <td className="p-4 font-bold text-slate-800">₹{billAmt?.toLocaleString()}</td>
                      <td className="p-4 font-bold text-emerald-600">₹{paidAmt?.toLocaleString()}</td>
                      <td className="p-4 font-bold text-rose-500">₹{balance?.toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant={
                          statusLabel === 'Paid' ? 'success' : statusLabel === 'Partial' ? 'primary' : 'danger'
                        }>{statusLabel}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2 flex-wrap">
                          {!isPaid ? (
                            <Button variant="outline" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1" onClick={() => openPay(fee)}>
                              <CreditCard size={12} /> Pay Due
                            </Button>
                          ) : (
                            <span className="text-emerald-600 font-bold inline-flex items-center gap-1 mr-2 text-[11px]">
                              <CheckCircle2 size={12} /> Settled
                            </span>
                          )}
                          <Button variant="secondary" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-slate-200" onClick={() => setPrintFee(fee)}>
                            <Printer size={12} /> Receipt
                          </Button>
                          {paidAmt > 0 && (
                            <Button variant="danger" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-transparent" onClick={() => handleCancelPayment(fee.id)}>
                              Cancel Receipt
                            </Button>
                          )}
                          {!isPaid && (
                            <Button variant="danger" className="text-[10px] px-2.5 py-1.5 cursor-pointer font-bold gap-1 border border-transparent" onClick={() => handleDeleteFee(fee.id)}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Invoices Ledger</h3>
          <p className="text-xs text-slate-500 mt-1">Record split invoices or trigger automatic billing runs to list entries.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs font-semibold">
          <span className="text-slate-400">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} className="cursor-pointer font-bold">Previous</Button>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="cursor-pointer font-bold">Next</Button>
          </div>
        </div>
      )}

      {/* Auto-generate Modal */}
      <Modal 
        isOpen={genModal} 
        onClose={() => {
          setGenModal(false);
          if (searchParams.get('action') === 'generate') {
            navigate('/fees');
          }
        }} 
        title="Auto-Generate Monthly Bills" 
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => {
                setGenModal(false);
                if (searchParams.get('action') === 'generate') {
                  navigate('/fees');
                }
              }}
            >
              Cancel
            </Button>
            <Button variant="gradient" type="submit" form="generate-form">Trigger Billing Run</Button>
          </>
        }
      >
        <form id="generate-form" onSubmit={handleGenInvoices} className="space-y-4 text-xs font-semibold">
          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
            {isDual
              ? `This will generate split billing for all active residents: ${acc1Name} (₹${acc1Default.toLocaleString('en-IN')}) + ${acc2Name} (₹${acc2Default.toLocaleString('en-IN')}) = ₹${(acc1Default + acc2Default).toLocaleString('en-IN')} total.`
              : `This will generate a single monthly fee of ₹${(user?.defaultMonthlyAmount ?? 7500).toLocaleString('en-IN')} for all active residents.`
            }
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Billing Month *</label>
              <select value={genData.month} onChange={(e) => setGenData({ ...genData, month: parseInt(e.target.value) || 1 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold">
                {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Billing Year *</label>
              <input type="number" required value={genData.year} onChange={(e) => setGenData({ ...genData, year: parseInt(e.target.value) || 2025 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Payment Due Date *</label>
            <input type="date" required value={genData.dueDate} onChange={(e) => setGenData({ ...genData, dueDate: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold" />
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={payModal} onClose={() => setPayModal(false)} title={`Record ${isDual ? (activeAccount === 1 ? acc1Name : acc2Name) : 'Fee'} Payment`} footer={
        <>
          <Button variant="secondary" onClick={() => setPayModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="pay-form">Save Payment</Button>
        </>
      }>
        <form id="pay-form" onSubmit={handlePayFee} className="space-y-4 text-xs font-semibold">
          {selectedFee && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-150 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Student Name:</span>
                <span className="text-slate-800 font-bold">{selectedFee.student?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Account Sheet:</span>
                <span className="text-blue-600 font-bold">{isDual ? (activeAccount === 1 ? acc1Name : acc2Name) : 'Fee'} Ledger</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Bill Rate:</span>
                <span className="text-slate-800 font-bold">
                  ₹{activeAccount === 1 ? selectedFee.amountAccount1 : selectedFee.amountAccount2}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Amount Already Paid:</span>
                <span className="text-emerald-600 font-bold">
                  ₹{activeAccount === 1 ? selectedFee.paidAccount1 : selectedFee.paidAccount2}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Payment Mode</label>
              <select value={payData.paymentMode} onChange={(e) => setPayData({ ...payData, paymentMode: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold">
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Payment Amount (₹) *</label>
              <input 
                type="number" 
                required 
                min="1" 
                max={
                  selectedFee 
                    ? (activeAccount === 1 
                        ? selectedFee.amountAccount1 - selectedFee.paidAccount1 
                        : selectedFee.amountAccount2 - selectedFee.paidAccount2) 
                    : 10000
                }
                value={payData.paidAmount} 
                onChange={(e) => setPayData({ ...payData, paidAmount: parseFloat(e.target.value) || 0 })} 
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-bold" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Transaction/Reference ID</label>
              <input type="text" placeholder="UPI Ref / Txn ID" value={payData.transactionId} onChange={(e) => setPayData({ ...payData, transactionId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-mono placeholder-slate-400" />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Remarks / Notes</label>
              <input type="text" placeholder="e.g. Paid online by parent" value={payData.notes} onChange={(e) => setPayData({ ...payData, notes: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none placeholder-slate-400" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Individual Fee Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title={isDual ? 'Record Custom Split Fee' : 'Create Custom Invoice'} footer={
        <>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="add-fee-form">{isDual ? 'Create Split Fee' : 'Create Invoice'}</Button>
        </>
      }>
        <form id="add-fee-form" onSubmit={handleAddFee} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Select Resident Student *</label>
            <select value={addData.studentId} onChange={(e) => setAddData({ ...addData, studentId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentNumber})</option>)}
            </select>
          </div>

          <div className={`grid grid-cols-1 ${isDual ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Fee Category *</label>
              <select value={addData.type} onChange={(e) => setAddData({ ...addData, type: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
                <option value="Monthly">Monthly Rent</option>
                <option value="Caution Money">Caution Money</option>
                <option value="Security">Security Deposit</option>
                <option value="Mess">Mess Fee</option>
                <option value="Other">Other Miscellaneous</option>
              </select>
            </div>

            {isDual ? (
              <>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">{acc1Name} Portion (₹) *</label>
                  <input type="number" required min="0" value={addData.amountAccount1} onChange={(e) => setAddData({ ...addData, amountAccount1: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">{acc2Name} Portion (₹) *</label>
                  <input type="number" required min="0" value={addData.amountAccount2} onChange={(e) => setAddData({ ...addData, amountAccount2: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-bold" />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Invoice Amount (₹) *</label>
                <input type="number" required min="1" value={addData.amountAccount1} onChange={(e) => setAddData({ ...addData, amountAccount1: parseFloat(e.target.value) || 0, amountAccount2: 0 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-bold" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Billing Month *</label>
              <select value={addData.month} onChange={(e) => setAddData({ ...addData, month: parseInt(e.target.value) || 1 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold">
                {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Billing Year *</label>
              <input type="number" required value={addData.year} onChange={(e) => setAddData({ ...addData, year: parseInt(e.target.value) || new Date().getFullYear() })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-800 outline-none font-semibold" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Due Date *</label>
            <input type="date" required value={addData.dueDate} onChange={(e) => setAddData({ ...addData, dueDate: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none" />
          </div>
        </form>
      </Modal>

      {/* Receipt Print Modal */}
      {printFee && (
        <Modal 
          isOpen={!!printFee} 
          onClose={() => setPrintFee(null)} 
          title="Print Invoice Receipt"
          footer={
            <>
              <Button variant="secondary" onClick={() => setPrintFee(null)}>Close</Button>
              <Button variant="gradient" onClick={() => window.print()} className="gap-1.5 cursor-pointer">
                <Printer size={14} /> Print / Save PDF
              </Button>
            </>
          }
        >
          {/* Custom style overrides for print overlay */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-receipt, #printable-receipt * {
                visibility: visible !important;
              }
              #printable-receipt {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: 1px solid #000000 !important;
                box-shadow: none !important;
                padding: 24px !important;
                margin: 0 !important;
                color: #000000 !important;
                background: #ffffff !important;
              }
              /* Strip flex layout & constraints from all parent wrappers during print */
              .fixed, .relative, div {
                position: static !important;
                display: block !important;
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: transparent !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          {/* Styled Receipt Container info */}
          <div className="p-1 bg-slate-50 rounded-xl border border-slate-200 no-print mb-4">
            <p className="text-[11px] text-slate-500 font-semibold p-2 text-center">
              A print-ready invoice sheet is pre-configured. Click "Print / Save PDF" to open system printing.
            </p>
          </div>

          <div id="printable-receipt" className="bg-white text-black font-sans mx-auto text-left" style={{ maxWidth: '700px', padding: '32px 40px', fontFamily: 'Arial, sans-serif' }}>

            {/* Row 1: RECEIPT title alone at top right */}
            <div style={{ textAlign: 'right', marginBottom: '8px' }}>
              <span style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '3px', color: '#000' }}>RECEIPT</span>
            </div>

            {/* Row 2: Hostel info (left) + Invoice details (right) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              {/* Left: Hostel Name + Address */}
              <div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#000', lineHeight: '1.2', fontFamily: 'Arial, sans-serif' }}>{hostelName}</div>
                <div style={{ fontSize: '11px', color: '#333', marginTop: '4px', lineHeight: '1.6' }}>
                  {hostelAddress && hostelAddress.split(',').map((line, i) => (
                    <span key={i}>{line.trim()}{i < hostelAddress.split(',').length - 1 ? ',' : ''}<br /></span>
                  ))}
                  {hostelPhone && <>Tel: {hostelPhone}</>}
                </div>
              </div>
              {/* Right: Invoice No + Date */}
              <div style={{ fontSize: '12px', color: '#000', textAlign: 'left', lineHeight: '1.8' }}>
                <div>
                  <span style={{ fontWeight: '600' }}>invoice No :</span>
                  <span style={{ marginLeft: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>
                    {(isDual ? (activeAccount === 1 ? acc1Prefix : acc2Prefix) : acc1Prefix)}-{printFee.id.slice(-4).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: '600' }}>invoice Date :</span>
                  <span style={{ marginLeft: '8px', fontWeight: '700' }}>
                    {isEditingDate ? (
                      <input
                        type="date"
                        value={customInvoiceDate}
                        onChange={(e) => setCustomInvoiceDate(e.target.value)}
                        className="no-print"
                        style={{ border: '1px solid #ccc', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', background: '#fff', color: '#000' }}
                        autoFocus
                      />
                    ) : (
                      formatDisplayDate(customInvoiceDate)
                    )}
                  </span>
                  <button
                    onClick={() => setIsEditingDate(!isEditingDate)}
                    className="no-print"
                    style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                    title="Edit Invoice Date"
                  >
                    {isEditingDate ? '💾' : '✏️'}
                  </button>
                </div>
              </div>
            </div>

            {/* BILL TO Box */}
            <div style={{ border: '1.5px solid #000', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', fontWeight: '700', color: '#000', lineHeight: '1.5' }}>
              BILL TO : {printFee.student?.enrollmentNumber || 'N/A'}-{printFee.student?.name || 'N/A'}{' '}
              {printFee.student?.parentName
                ? (printFee.student.parentName.trim().startsWith('श्री')
                  ? `पिता ${printFee.student.parentName}`
                  : `पिता श्री ${printFee.student.parentName}`)
                : ''}
              {printFee.student?.address ? ` ( ${printFee.student.address} )` : ''}
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e8e8e8', fontWeight: '800' }}>
                  <th style={{ border: '1.5px solid #000', padding: '8px 10px', textAlign: 'center', width: '60px' }}>Srno.</th>
                  <th style={{ border: '1.5px solid #000', padding: '8px 10px', textAlign: 'center' }}>Description</th>
                  <th style={{ border: '1.5px solid #000', padding: '8px 10px', textAlign: 'center', width: '60px' }}>Qty</th>
                  <th style={{ border: '1.5px solid #000', padding: '8px 10px', textAlign: 'right', width: '100px' }}>Price</th>
                  <th style={{ border: '1.5px solid #000', padding: '8px 10px', textAlign: 'right', width: '100px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ fontWeight: '700' }}>
                  <td style={{ border: '1.5px solid #000', padding: '10px', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1.5px solid #000', padding: '10px', textAlign: 'center' }}>
                    {printFee.type === 'Monthly'
                      ? `${getHindiMonthName(printFee.month)} ${printFee.year}`
                      : (printFee.type === 'Caution Money' ? 'Caution Money / कॉशन मनी' : printFee.type)}
                  </td>
                  <td style={{ border: '1.5px solid #000', padding: '10px', textAlign: 'center' }}>1</td>
                  <td style={{ border: '1.5px solid #000', padding: '10px', textAlign: 'right' }}>
                    ₹{(activeAccount === 1 ? printFee.amountAccount1 : printFee.amountAccount2)?.toLocaleString('en-IN')}.00
                  </td>
                  <td style={{ border: '1.5px solid #000', padding: '10px', textAlign: 'right' }}>
                    ₹{(activeAccount === 1 ? printFee.amountAccount1 : printFee.amountAccount2)?.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals — right aligned */}
            <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: '700', marginBottom: '16px', paddingRight: '2px' }}>
              <div style={{ marginBottom: '3px' }}>Total Amount: ₹{(activeAccount === 1 ? printFee.amountAccount1 : printFee.amountAccount2)?.toLocaleString('en-IN')}.00</div>
              <div style={{ marginBottom: '3px' }}>Subtotal: ₹{(activeAccount === 1 ? printFee.amountAccount1 : printFee.amountAccount2)?.toLocaleString('en-IN')}.00</div>
              <div>Amount Paid: ₹{(activeAccount === 1 ? printFee.paidAccount1 : printFee.paidAccount2)?.toLocaleString('en-IN')}.00</div>
            </div>

            {/* Bottom Bar — left: txn info | vertical line | right: signature */}
            <div style={{ display: 'flex', borderTop: '1.5px solid #000', paddingTop: '12px', marginTop: '4px' }}>
              {/* Left: Transaction info */}
              <div style={{ flex: 1, fontSize: '11px', fontWeight: '700', color: '#222', paddingRight: '16px' }}>
                <div>
                  {printFee.transactionId ? `ID-${printFee.transactionId}` : `Txn: N/A`}
                  ---{formatDisplayDate(customInvoiceDate)}
                </div>
                <div style={{ marginTop: '3px', color: '#555' }}>
                  Mode: {printFee.paymentMode || 'N/A'}
                </div>
                <div style={{ marginTop: '3px', color: '#555' }}>
                  Acc: {isDual ? (activeAccount === 1 ? acc1Name : acc2Name) : acc1Name}
                </div>
              </div>

              {/* Vertical divider */}
              <div style={{ width: '1.5px', backgroundColor: '#000', margin: '0 16px' }} />

              {/* Right: Signature */}
              <div style={{ textAlign: 'right', minWidth: '160px' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '22px', fontWeight: '700', color: '#1a3a8f', transform: 'rotate(-3deg)', display: 'inline-block', marginBottom: '2px' }}>
                  {signatoryName}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#000', textTransform: 'uppercase', marginTop: '2px' }}>
                  For {hostelName}.
                </div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#666', letterSpacing: '1px' }}>
                  Signature.
                </div>
              </div>
            </div>

          </div>

        </Modal>
      )}
    </div>
  );
};

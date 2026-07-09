import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { CreditCard, Search, Plus, Settings, CheckCircle2, Printer } from 'lucide-react';
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

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  useEffect(() => {
    if (printFee) {
      const defaultDate = printFee.paidAt 
        ? new Date(printFee.paidAt).toLocaleDateString('en-GB') 
        : new Date().toLocaleDateString('en-GB');
      setCustomInvoiceDate(defaultDate);
      setIsEditingDate(false);
    }
  }, [printFee]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchFees();
  }, [page, selectedStatus, activeAccount]);

  const fetchDropdowns = async () => {
    try {
      const res = await axios.get(`${API_URL}/students`, { params: { limit: 100 } });
      if (res.data.success) setStudents(res.data.students);
    } catch {}
  };

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/fees`, {
        params: {
          search,
          page,
          limit: 10
        }
      });
      if (res.data.success) {
        let filteredFees = res.data.fees;
        if (selectedStatus) {
          filteredFees = filteredFees.filter(fee => {
            if (activeAccount === 1) {
              const status1 = fee.paidAccount1 >= fee.amountAccount1 ? 'Paid' : fee.paidAccount1 > 0 ? 'Partial' : 'Pending';
              return status1 === selectedStatus;
            } else {
              const status2 = fee.paidAccount2 >= fee.amountAccount2 ? 'Paid' : fee.paidAccount2 > 0 ? 'Partial' : 'Pending';
              return status2 === selectedStatus;
            }
          });
        }
        setFees(filteredFees);
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
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/fees`, addData);
      if (res.data.success) {
        toast.success('Split fee record created successfully');
        setAddModal(false);
        fetchFees();
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
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment update failed');
    }
  };

  const openPay = (fee) => {
    setSelectedFee(fee);
    const balance = activeAccount === 1 
      ? fee.amountAccount1 - fee.paidAccount1 
      : fee.amountAccount2 - fee.paidAccount2;
      
    setPayData({
      paidAmount: balance,
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
          <Button variant="gradient" className="gap-1.5 cursor-pointer text-xs" onClick={() => setGenModal(true)}>
            <Settings size={14} /> Auto-Generate Bills
          </Button>
          {isDual && (
            <Button variant="outline" className="gap-1.5 cursor-pointer text-xs" onClick={openAdd}>
              <Plus size={14} /> Add Split Fee
            </Button>
          )}
        </div>
      </div>

      {/* Account Switch Tabs Navigation */}
      <div className="flex border-b border-slate-200">
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
          className="w-full md:w-44 rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-xs text-slate-700 outline-none font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
        </select>

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
                  
                  // Calculate independent account billing status
                  const isPaid = paidAmt >= billAmt;
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
                        <div className="flex justify-end items-center gap-2">
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
      <Modal isOpen={genModal} onClose={() => setGenModal(false)} title="Auto-Generate Monthly Bills" footer={
        <>
          <Button variant="secondary" onClick={() => setGenModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="generate-form">Trigger Billing Run</Button>
        </>
      }>
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
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Record Custom Split Fee" footer={
        <>
          <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
          <Button variant="gradient" type="submit" form="add-fee-form">Create Split Fee</Button>
        </>
      }>
        <form id="add-fee-form" onSubmit={handleAddFee} className="space-y-4 text-xs font-semibold">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Select Resident Student *</label>
            <select value={addData.studentId} onChange={(e) => setAddData({ ...addData, studentId: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-semibold">
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentNumber})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Account 1 Portion (₹) *</label>
              <input type="number" required min="1" value={addData.amountAccount1} onChange={(e) => setAddData({ ...addData, amountAccount1: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-bold" />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Account 2 Portion (₹) *</label>
              <input type="number" required min="1" value={addData.amountAccount2} onChange={(e) => setAddData({ ...addData, amountAccount2: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Due Date *</label>
              <input type="date" required value={addData.dueDate} onChange={(e) => setAddData({ ...addData, dueDate: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-slate-805 outline-none" />
            </div>
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

          <div id="printable-receipt" className="border border-black p-6 bg-white text-black font-sans mx-auto text-left" style={{ maxWidth: '640px' }}>
            {/* Top Layout */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h2 className="text-base font-black tracking-tight" style={{ fontSize: '18px', fontWeight: '900', color: '#000000' }}>{hostelName}</h2>
                <div className="text-[10px] font-bold text-slate-700 leading-normal" style={{ whiteSpace: 'pre-line' }}>
                  {hostelAddress && <>{hostelAddress}<br /></>}
                  {hostelPhone && <>Tel: {hostelPhone}</>}
                </div>
              </div>
              <div className="text-right space-y-4">
                <div className="text-xl font-black tracking-wider text-black">RECEIPT</div>
                <div className="text-[11px] font-bold text-slate-800 space-y-1">
                  <div>invoice No : <span className="font-mono">{(activeAccount === 1 ? acc1Prefix : acc2Prefix)}-{printFee.id.slice(-4).toUpperCase()}</span></div>
                  <div>
                    invoice Date : <span>
                      {isEditingDate ? (
                        <input 
                          type="text" 
                          value={customInvoiceDate} 
                          onChange={(e) => setCustomInvoiceDate(e.target.value)} 
                          className="border border-slate-300 px-1 py-0.5 rounded text-[10px] w-20 no-print text-black inline-block"
                          autoFocus
                        />
                      ) : (
                        customInvoiceDate
                      )}
                    </span>
                    <button 
                      onClick={() => setIsEditingDate(!isEditingDate)} 
                      className="ml-1 text-blue-600 hover:text-blue-800 no-print cursor-pointer"
                      title="Edit Invoice Date"
                    >
                      {isEditingDate ? '💾' : '✏️'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To Box */}
            <div className="border border-black p-3 mb-6 font-bold text-[11px] leading-relaxed text-black bg-slate-50/50">
              BILL TO : {printFee.student?.enrollmentNumber || 'N/A'}-{printFee.student?.name || 'N/A'} {printFee.student?.parentName ? (printFee.student.parentName.trim().startsWith('श्री') ? `पिता ${printFee.student.parentName}` : `पिता श्री ${printFee.student.parentName}`) : ''} {printFee.student?.address ? `( ${printFee.student.address} )` : ''}
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-black text-[11px] mb-6">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-black">
                  <th className="border border-black p-2 text-center w-12">Srno.</th>
                  <th className="border border-black p-2 text-left">Description</th>
                  <th className="border border-black p-2 text-center w-12">Qty</th>
                  <th className="border border-black p-2 text-right w-24">Price</th>
                  <th className="border border-black p-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold">
                  <td className="border border-black p-2 text-center">1</td>
                  <td className="border border-black p-2 text-left">
                    {printFee.type === 'Monthly' 
                      ? `${getHindiMonthName(printFee.month)} ${printFee.year}` 
                      : (printFee.type === 'Caution Money' ? 'Caution Money / कॉशन मनी' : printFee.type)}
                  </td>
                  <td className="border border-black p-2 text-center">1</td>
                  <td className="border border-black p-2 text-right">₹{(activeAccount === 1 ? printFee.amountAccount1 : printFee.amountAccount2)?.toLocaleString('en-IN')}.00</td>
                  <td className="border border-black p-2 text-right">₹{(activeAccount === 1 ? printFee.amountAccount1 : printFee.amountAccount2)?.toLocaleString('en-IN')}.00</td>
                </tr>
              </tbody>
            </table>

            {/* Totals & Signature layout */}
            <div className="grid grid-cols-2 gap-4 items-end pt-2">
              <div className="text-[10px] font-bold text-slate-800 pb-2 space-y-1">
                <div>Txn ID: <span className="font-mono">{printFee.transactionId || 'N/A'}</span></div>
                <div>Payment Mode: <span className="font-mono">{printFee.paymentMode || 'N/A'}</span></div>
                <div>Date: <span>{customInvoiceDate}</span></div>
              </div>
              <div className="space-y-4 text-right">
                <div className="inline-block space-y-1 font-bold text-[11px] text-right" style={{ minWidth: '180px' }}>
                  <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span>Total Amount:</span>
                    <span>₹{(activeAccount === 1 ? printFee.amountAccount1 : printFee.amountAccount2)?.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 py-1">
                    <span>Subtotal:</span>
                    <span>₹{(activeAccount === 1 ? printFee.amountAccount1 : printFee.amountAccount2)?.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="flex justify-between pt-1 text-slate-900" style={{ fontSize: '12px' }}>
                    <span>Amount Paid:</span>
                    <span>₹{(activeAccount === 1 ? printFee.paidAccount1 : printFee.paidAccount2)?.toLocaleString('en-IN')}.00</span>
                  </div>
                </div>

                <div className="pt-4 pr-2">
                  <div className="text-right">
                    <span className="font-serif italic text-blue-700 text-lg font-bold block" style={{ fontFamily: 'Georgia, serif', transform: 'rotate(-2deg)' }}>{signatoryName}</span>
                    <div className="text-[10px] font-black text-slate-800 mt-1 uppercase">For {hostelName}.</div>
                    <div className="text-[9px] font-bold text-slate-500 tracking-wider">Signature.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

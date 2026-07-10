const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Fees', action, detail, userId } }); } catch {}
};

// GET /api/fees
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, studentId, search, month, year, paymentMode, page = 1, limit = 20 } = req.query;
    const where = { adminId: req.admin.id };
    
    if (status) where.status = status;        // BUG1 FIX: was missing
    if (studentId) where.studentId = studentId;
    if (month) where.month = +month;
    if (year) where.year = +year;
    
    if (paymentMode) {
      if (paymentMode.includes(',')) {
        where.paymentMode = { in: paymentMode.split(',') };
      } else {
        where.paymentMode = paymentMode;
      }
    }
    if (search) {
      where.student = {
        adminId: req.admin.id,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { enrollmentNumber: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        skip: (page - 1) * +limit,
        take: +limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, name: true, enrollmentNumber: true, parentName: true, address: true } }
        }
      }),
      prisma.fee.count({ where })
    ]);

    res.json({
      success: true,
      fees,
      total,
      page: +page,
      pages: Math.ceil(total / +limit)
    });
  } catch (err) { next(err); }
});

// GET /api/fees/stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const stats = await prisma.fee.groupBy({
      by: ['paymentMode'],
      _sum: {
        paidAmount: true,
        paidAccount1: true,
        paidAccount2: true
      },
      where: {
        adminId: req.admin.id,
        paidAmount: { gt: 0 }
      }
    });

    const breakdown = {
      UPI: 0,
      Cash: 0,
      "Debit Card": 0,
      "Credit Card": 0,
      "Bank Transfer": 0,
      Cheque: 0,
      Other: 0
    };

    let totalCollected = 0;
    stats.forEach(item => {
      const mode = item.paymentMode || 'Other';
      const amt = item._sum.paidAmount || 0;
      if (breakdown[mode] !== undefined) {
        breakdown[mode] = amt;
      } else {
        breakdown["Other"] = (breakdown["Other"] || 0) + amt;
      }
      totalCollected += amt;
    });

    res.json({ success: true, breakdown, totalCollected });
  } catch (err) { next(err); }
});

// GET /api/fees/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const fee = await prisma.fee.findFirst({
      where: { id: req.params.id, adminId: req.admin.id },
      include: {
        student: {
          include: {
            room: { include: { hostel: true } }
          }
        }
      }
    });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    res.json({ success: true, fee });
  } catch (err) { next(err); }
});

// POST /api/fees/generate
router.post('/generate', protect, async (req, res, next) => {
  try {
    const { month, year, dueDate } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and Year are required' });
    }

    // Get admin settings to load default amounts
    const adminSettings = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    const isDual = adminSettings?.enableDualAccounts ?? false;
    const amount1 = adminSettings?.account1DefaultAmount ?? 3000;
    const amount2 = adminSettings?.account2DefaultAmount ?? 4500;
    const singleAmount = adminSettings?.defaultMonthlyAmount ?? 7500;

    // Get all active students allocated to a room under this admin
    const activeStudents = await prisma.student.findMany({
      where: { status: 'Active', roomId: { not: null }, adminId: req.admin.id }
    });

    let count = 0;
    const records = [];

    for (const student of activeStudents) {
      const existingFee = await prisma.fee.findFirst({
        where: {
          studentId: student.id,
          type: 'Monthly',
          month: +month,
          year: +year,
          adminId: req.admin.id
        }
      });

      if (!existingFee) {
        records.push({
          studentId: student.id,
          adminId: req.admin.id,
          type: 'Monthly',
          month: +month,
          year: +year,
          amount: isDual ? (amount1 + amount2) : singleAmount,
          amountAccount1: isDual ? amount1 : singleAmount,
          amountAccount2: isDual ? amount2 : 0,
          paidAccount1: 0,
          paidAccount2: 0,
          paidAmount: 0,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'Pending'
        });
        count++;
      }
    }

    if (records.length > 0) {
      await prisma.fee.createMany({ data: records });
      await log('Generated', `Generated monthly bills for ${count} students for month ${month}/${year}`, req.admin.id);
    }

    res.json({ success: true, count, message: `Successfully generated ${count} fee records.` });
  } catch (err) { next(err); }
});

// POST /api/fees
router.post('/', protect, async (req, res, next) => {
  try {
    const { studentId, type, amountAccount1, amountAccount2, amount: inputAmount, month, year, dueDate } = req.body;
    
    // Get admin settings to check if dual accounts enabled
    const adminSettings = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    const isDual = adminSettings?.enableDualAccounts ?? false;

    let finalAmount = 0;
    let finalAmt1 = 0;
    let finalAmt2 = 0;

    if (isDual) {
      finalAmt1 = amountAccount1 !== undefined ? +amountAccount1 : (adminSettings?.account1DefaultAmount ?? 3000);
      finalAmt2 = amountAccount2 !== undefined ? +amountAccount2 : (adminSettings?.account2DefaultAmount ?? 4500);
      finalAmount = finalAmt1 + finalAmt2;
    } else {
      // Single account: read from amountAccount1 OR amount field (whichever is sent)
      finalAmount = amountAccount1 !== undefined ? +amountAccount1
                  : inputAmount !== undefined ? +inputAmount
                  : (adminSettings?.defaultMonthlyAmount ?? 7500);
      // Store in amountAccount1 so the fee table can display it correctly
      finalAmt1 = finalAmount;
      finalAmt2 = 0;
    }

    const fee = await prisma.fee.create({
      data: {
        studentId,
        adminId: req.admin.id,
        type,
        month: +month || null,
        year: +year || null,
        amount: finalAmount,
        amountAccount1: finalAmt1,
        amountAccount2: finalAmt2,
        paidAccount1: 0,
        paidAccount2: 0,
        paidAmount: 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'Pending'
      }
    });
    await log('Created', `Created fee record ID ${fee.id} for student ID ${fee.studentId}`, req.admin.id);
    res.status(201).json({ success: true, fee });
  } catch (err) { next(err); }
});

// PUT /api/fees/:id/pay
router.put('/:id/pay', protect, async (req, res, next) => {
  try {
    const { paidAccount1, paidAccount2, paidAmount: inputPaidAmount, discount, fine, paymentMode, transactionId, notes } = req.body;
    
    const fee = await prisma.fee.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const adminSettings = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    const isDual = adminSettings?.enableDualAccounts ?? false;

    let newPaidAccount1 = fee.paidAccount1;
    let newPaidAccount2 = fee.paidAccount2;
    let newPaidAmount = fee.paidAmount;

    if (isDual) {
      newPaidAccount1 += (+paidAccount1 || 0);
      newPaidAccount2 += (+paidAccount2 || 0);
      newPaidAmount = newPaidAccount1 + newPaidAccount2;
    } else {
      newPaidAmount += (+inputPaidAmount || 0);
      // Also update paidAccount1 so the fee table (which reads paidAccount1) shows correctly
      newPaidAccount1 = newPaidAmount;
    }

    const totalAmount = fee.amount + (+fine || 0) - (+discount || 0);

    let status = 'Pending';
    if (isDual) {
      if (newPaidAccount1 >= fee.amountAccount1 && newPaidAccount2 >= fee.amountAccount2) {
        status = 'Paid';
      } else if (newPaidAccount1 > 0 || newPaidAccount2 > 0) {
        status = 'Partial';
      }
    } else {
      if (newPaidAmount >= totalAmount) {
        status = 'Paid';
      } else if (newPaidAmount > 0) {
        status = 'Partial';
      }
    }

    const receiptNumber = 'REC-' + Date.now().toString().slice(-8).toUpperCase();

    const updated = await prisma.fee.update({
      where: { id: req.params.id },
      data: {
        paidAccount1: newPaidAccount1,
        paidAccount2: newPaidAccount2,
        paidAmount: newPaidAmount,
        discount: fee.discount + (+discount || 0),
        fine: fee.fine + (+fine || 0),
        paymentMode,
        transactionId,
        notes,
        status,
        receiptNumber: fee.receiptNumber || receiptNumber,
        paidAt: new Date()
      }
    });

    await log('Paid', `Processed payment for record ID ${fee.id}`, req.admin.id);
    res.json({ success: true, fee: updated });
  } catch (err) { next(err); }
});

// PUT /api/fees/:id/cancel-payment
router.put('/:id/cancel-payment', protect, async (req, res, next) => {
  try {
    const fee = await prisma.fee.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const updated = await prisma.fee.update({
      where: { id: req.params.id },
      data: {
        paidAccount1: 0,
        paidAccount2: 0,
        paidAmount: 0,
        paymentMode: null,
        transactionId: null,
        receiptNumber: null,
        status: 'Pending',
        paidAt: null
      }
    });

    await log('Cancelled', `Receipt cancelled for fee record ID ${fee.id}`, req.admin.id);
    res.json({ success: true, fee: updated, message: 'Receipt cancelled and payment reset successfully' });
  } catch (err) { next(err); }
});

// DELETE /api/fees/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.fee.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Fee record not found' });

    await prisma.fee.delete({ where: { id: req.params.id } });
    await log('Deleted', `Deleted fee record ID ${req.params.id}`, req.admin.id);
    res.json({ success: true, message: 'Fee record deleted' });
  } catch (err) { next(err); }
});

module.exports = router;

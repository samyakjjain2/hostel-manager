const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Fees', action, detail, userId } }); } catch {}
};

// GET /api/fees
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, studentId, search, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (search) {
      where.student = {
        name: { contains: search }
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

// GET /api/fees/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const fee = await prisma.fee.findUnique({
      where: { id: req.params.id },
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

    // Get all active students allocated to a room
    const activeStudents = await prisma.student.findMany({
      where: { status: 'Active', roomId: { not: null } }
    });

    let count = 0;
    const records = [];

    for (const student of activeStudents) {
      const existingFee = await prisma.fee.findFirst({
        where: {
          studentId: student.id,
          type: 'Monthly',
          month: +month,
          year: +year
        }
      });

      if (!existingFee) {
        records.push({
          studentId: student.id,
          type: 'Monthly',
          month: +month,
          year: +year,
          amount: 7500,
          amountAccount1: 3000,
          amountAccount2: 4500,
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
      await log('Generated', `Generated monthly split bills for ${count} students for month ${month}/${year}`, req.admin.id);
    }

    res.json({ success: true, count, message: `Successfully generated ${count} fee records.` });
  } catch (err) { next(err); }
});

// POST /api/fees (Create individual fee card)
router.post('/', protect, async (req, res, next) => {
  try {
    const { studentId, type, amountAccount1 = 3000, amountAccount2 = 4500, month, year, dueDate } = req.body;
    
    const amount = (+amountAccount1 || 0) + (+amountAccount2 || 0);

    const fee = await prisma.fee.create({
      data: {
        studentId,
        type,
        month: +month || null,
        year: +year || null,
        amount,
        amountAccount1: +amountAccount1,
        amountAccount2: +amountAccount2,
        paidAccount1: 0,
        paidAccount2: 0,
        paidAmount: 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'Pending'
      }
    });
    await log('Created', `Created split fee record ID ${fee.id} for student ID ${fee.studentId}`, req.admin.id);
    res.status(201).json({ success: true, fee });
  } catch (err) { next(err); }
});

// PUT /api/fees/:id/pay
router.put('/:id/pay', protect, async (req, res, next) => {
  try {
    const { paidAccount1, paidAccount2, discount, fine, paymentMode, transactionId, notes } = req.body;
    const fee = await prisma.fee.findUnique({ where: { id: req.params.id } });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const newPaidAccount1 = fee.paidAccount1 + (+paidAccount1 || 0);
    const newPaidAccount2 = fee.paidAccount2 + (+paidAccount2 || 0);
    const totalPaid = newPaidAccount1 + newPaidAccount2;
    const totalAmount = fee.amount + (+fine || 0) - (+discount || 0);

    let status = 'Pending';
    if (newPaidAccount1 >= fee.amountAccount1 && newPaidAccount2 >= fee.amountAccount2) {
      status = 'Paid';
    } else if (newPaidAccount1 > 0 || newPaidAccount2 > 0) {
      status = 'Partial';
    }

    const receiptNumber = 'REC-' + Date.now().toString().slice(-8).toUpperCase();

    const updated = await prisma.fee.update({
      where: { id: req.params.id },
      data: {
        paidAccount1: newPaidAccount1,
        paidAccount2: newPaidAccount2,
        paidAmount: totalPaid,
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

    await log('Paid', `Processed split payment for record ID ${fee.id}`, req.admin.id);
    res.json({ success: true, fee: updated });
  } catch (err) { next(err); }
});

// DELETE /api/fees/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    await prisma.fee.delete({ where: { id: req.params.id } });
    await log('Deleted', `Deleted fee record ID ${req.params.id}`, req.admin.id);
    res.json({ success: true, message: 'Fee record deleted' });
  } catch (err) { next(err); }
});

module.exports = router;

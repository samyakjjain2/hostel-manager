const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Visitors', action, detail, userId } }); } catch {}
};

// GET /api/visitors
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, status, studentId } = req.query;
    const where = { adminId: req.admin.id };

    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' }, adminId: req.admin.id } }
      ];
    }

    const visitors = await prisma.visitor.findMany({
      where,
      orderBy: { checkIn: 'desc' },
      include: {
        student: { select: { name: true, room: { select: { roomNumber: true } } } }
      }
    });

    res.json({ success: true, visitors });
  } catch (err) { next(err); }
});

// POST /api/visitors OR /api/visitors/checkin
const createVisitor = async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({ where: { id: req.body.studentId, adminId: req.admin.id } });
    if (!student) return res.status(400).json({ success: false, message: 'Invalid Student ID' });

    const visitor = await prisma.visitor.create({
      data: {
        ...req.body,
        checkIn: new Date(),
        status: 'CheckedIn',
        adminId: req.admin.id
      }
    });
    await log('CheckIn', `Visitor ${visitor.name} checked in to meet student ID ${visitor.studentId}`, req.admin.id);
    res.status(201).json({ success: true, visitor });
  } catch (err) { next(err); }
};

router.post('/', protect, createVisitor);
router.post('/checkin', protect, createVisitor);

// PUT /api/visitors/:id/checkout
router.put('/:id/checkout', protect, async (req, res, next) => {
  try {
    const exists = await prisma.visitor.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Visitor record not found' });

    const visitor = await prisma.visitor.update({
      where: { id: req.params.id },
      data: {
        checkOut: new Date(),
        status: 'CheckedOut'
      }
    });
    await log('CheckOut', `Visitor ${visitor.name} checked out`, req.admin.id);
    res.json({ success: true, visitor });
  } catch (err) { next(err); }
});

module.exports = router;

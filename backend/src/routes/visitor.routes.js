const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Visitors', action, detail, userId } }); } catch {}
};

// GET /api/visitors
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, status, studentId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { student: { name: { contains: search } } }
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
    const visitor = await prisma.visitor.create({
      data: {
        ...req.body,
        checkIn: new Date(),
        status: 'CheckedIn'
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

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

// GET /api/reports/occupancy
router.get('/occupancy', protect, async (req, res, next) => {
  try {
    const report = await prisma.room.findMany({
      where: { adminId: req.admin.id },
      include: {
        hostel: { select: { name: true } },
        students: { select: { name: true, enrollmentNumber: true } }
      },
      orderBy: { roomNumber: 'asc' }
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
});

// GET /api/reports/fees
router.get('/fees', protect, async (req, res, next) => {
  try {
    const report = await prisma.fee.findMany({
      where: { adminId: req.admin.id },
      include: {
        student: { select: { name: true, enrollmentNumber: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
});

// GET /api/reports/complaints
router.get('/complaints', protect, async (req, res, next) => {
  try {
    const report = await prisma.complaint.findMany({
      where: { adminId: req.admin.id },
      include: {
        student: { select: { name: true, enrollmentNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
});

// GET /api/reports/visitors
router.get('/visitors', protect, async (req, res, next) => {
  try {
    const report = await prisma.visitor.findMany({
      where: { adminId: req.admin.id },
      include: {
        student: { select: { name: true, enrollmentNumber: true } }
      },
      orderBy: { checkIn: 'desc' }
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
});

module.exports = router;

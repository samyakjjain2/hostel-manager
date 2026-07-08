const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/reports/occupancy
router.get('/occupancy', protect, async (req, res, next) => {
  try {
    const report = await prisma.room.findMany({
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
      include: {
        student: { select: { name: true, enrollmentNumber: true } }
      },
      orderBy: { checkIn: 'desc' }
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
});

module.exports = router;

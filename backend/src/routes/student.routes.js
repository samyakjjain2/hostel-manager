const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Students', action, detail, userId } }); } catch {}
};

// GET /api/students
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, hostelId, roomId, status, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { enrollmentNumber: { contains: search } }
      ];
    }
    if (hostelId) where.hostelId = hostelId;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: (page - 1) * +limit,
        take: +limit,
        orderBy: { name: 'asc' },
        include: {
          room: { select: { roomNumber: true, hostel: { select: { name: true } } } }
        }
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      success: true,
      students,
      total,
      page: +page,
      pages: Math.ceil(total / +limit)
    });
  } catch (err) { next(err); }
});

// GET /api/students/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        room: { select: { id: true, roomNumber: true, hostelId: true, hostel: { select: { name: true } } } },
        allocations: { orderBy: { checkIn: 'desc' } },
        fees: { orderBy: { createdAt: 'desc' } },
        complaints: { orderBy: { createdAt: 'desc' } },
        visitors: { orderBy: { checkIn: 'desc' } }
      }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) { next(err); }
});

// POST /api/students
router.post('/', protect, async (req, res, next) => {
  try {
    const { email, enrollmentNumber } = req.body;
    
    // Check unique email and enrollment
    if (email) {
      const existingEmail = await prisma.student.findUnique({ where: { email } });
      if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    if (enrollmentNumber) {
      const existingEnroll = await prisma.student.findUnique({ where: { enrollmentNumber } });
      if (existingEnroll) return res.status(400).json({ success: false, message: 'Enrollment number already exists' });
    }

    const student = await prisma.student.create({ data: req.body });
    await log('Created', `Added student: ${student.name}`, req.admin.id);
    res.status(201).json({ success: true, student });
  } catch (err) { next(err); }
});

// PUT /api/students/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { email, enrollmentNumber } = req.body;
    
    // Check unique validations (except current student)
    if (email) {
      const existingEmail = await prisma.student.findFirst({ where: { email, NOT: { id: req.params.id } } });
      if (existingEmail) return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    if (enrollmentNumber) {
      const existingEnroll = await prisma.student.findFirst({ where: { enrollmentNumber, NOT: { id: req.params.id } } });
      if (existingEnroll) return res.status(400).json({ success: false, message: 'Enrollment number already in use' });
    }

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: req.body
    });
    await log('Updated', `Updated student: ${student.name}`, req.admin.id);
    res.json({ success: true, student });
  } catch (err) { next(err); }
});

// DELETE /api/students/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    // If student is currently occupying a room, decrement bed count
    if (student.roomId) {
      await prisma.room.update({
        where: { id: student.roomId },
        data: { occupiedBeds: { decrement: 1 } }
      });
    }

    await prisma.student.delete({ where: { id: req.params.id } });
    await log('Deleted', `Deleted student: ${student.name}`, req.admin.id);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const log = async (action, detail, userId) => { try { await prisma.activityLog.create({ data: { module: 'Rooms', action, detail, userId } }); } catch {} };

router.get('/', protect, async (req, res, next) => {
  try {
    const { hostelId, floor, type, status, search, page = 1, limit = 20 } = req.query;
    const where = { adminId: req.admin.id };
    if (hostelId) where.hostelId = hostelId;
    if (floor) where.floor = +floor;
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) where.roomNumber = { contains: search, mode: 'insensitive' };
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({ where, skip: (page-1)*+limit, take: +limit, orderBy: { roomNumber: 'asc' }, include: { hostel: { select: { name: true } } } }),
      prisma.room.count({ where })
    ]);
    res.json({ success: true, rooms, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) { next(err); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const room = await prisma.room.findFirst({ where: { id: req.params.id, adminId: req.admin.id }, include: { hostel: true, students: { select: { id: true, name: true, photo: true, phone: true, status: true } } } });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, room });
  } catch (err) { next(err); }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const room = await prisma.room.create({ data: { ...req.body, adminId: req.admin.id } });
    await log('Created', `Added room ${room.roomNumber}`, req.admin.id);
    res.status(201).json({ success: true, room });
  } catch (err) { next(err); }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.room.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Room not found' });

    const room = await prisma.room.update({ where: { id: req.params.id }, data: req.body });
    await log('Updated', `Updated room ${room.roomNumber}`, req.admin.id);
    res.json({ success: true, room });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const room = await prisma.room.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (room.occupiedBeds > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete room with active occupants. Please check-out or transfer the students first.' });
    }

    await prisma.room.delete({ where: { id: req.params.id } });
    await log('Deleted', `Deleted room ${room.roomNumber}`, req.admin.id);
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

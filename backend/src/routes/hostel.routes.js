const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');

const prisma = new PrismaClient();

const logActivity = async (module, action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module, action, detail, userId } }); } catch {}
};

router.get('/', protect, async (req, res, next) => {
  try {
    const { search, type, status, page = 1, limit = 20 } = req.query;
    const where = { adminId: req.admin.id };
    if (search) where.name = { contains: search };
    if (type) where.type = type;
    if (status) where.status = status;
    const [hostels, total] = await Promise.all([
      prisma.hostel.findMany({ where, skip: (page - 1) * limit, take: +limit, orderBy: { createdAt: 'desc' }, include: { _count: { select: { rooms: true } } } }),
      prisma.hostel.count({ where })
    ]);
    res.json({ success: true, hostels, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const hostel = await prisma.hostel.findFirst({ where: { id: req.params.id, adminId: req.admin.id }, include: { rooms: true } });
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });
    res.json({ success: true, hostel });
  } catch (err) { next(err); }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const hostel = await prisma.hostel.create({ data: { ...req.body, adminId: req.admin.id } });
    await logActivity('Hostels', 'Created', `Added hostel: ${hostel.name}`, req.admin.id);
    res.status(201).json({ success: true, hostel });
  } catch (err) { next(err); }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.hostel.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const hostel = await prisma.hostel.update({ where: { id: req.params.id }, data: req.body });
    await logActivity('Hostels', 'Updated', `Updated hostel: ${hostel.name}`, req.admin.id);
    res.json({ success: true, hostel });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const hostel = await prisma.hostel.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    await prisma.hostel.delete({ where: { id: req.params.id } });
    await logActivity('Hostels', 'Deleted', `Deleted hostel: ${hostel.name}`, req.admin.id);
    res.json({ success: true, message: 'Hostel deleted' });
  } catch (err) { next(err); }
});

module.exports = router;

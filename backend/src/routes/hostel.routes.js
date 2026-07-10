const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const logActivity = async (module, action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module, action, detail, userId } }); } catch {}
};

router.get('/', protect, async (req, res, next) => {
  try {
    const { search, type, status, page = 1, limit = 20 } = req.query;
    const where = { adminId: req.admin.id };
    if (search) where.name = { contains: search, mode: 'insensitive' };
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
    const { name, type, address, floors, totalRooms, capacity, warden, contact, description, rules, status } = req.body;
    const hostel = await prisma.hostel.create({ 
      data: { 
        name,
        type,
        address,
        floors: parseInt(floors) || 1,
        totalRooms: parseInt(totalRooms) || 0,
        capacity: parseInt(capacity) || 0,
        warden,
        contact,
        description,
        rules,
        status: status || 'Active',
        adminId: req.admin.id 
      } 
    });
    await logActivity('Hostels', 'Created', `Added hostel: ${hostel.name}`, req.admin.id);
    res.status(201).json({ success: true, hostel });
  } catch (err) { next(err); }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.hostel.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Hostel not found' });

    const { name, type, address, floors, totalRooms, capacity, warden, contact, description, rules, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (address !== undefined) updateData.address = address;
    if (floors !== undefined) updateData.floors = parseInt(floors) || 0;
    if (totalRooms !== undefined) updateData.totalRooms = parseInt(totalRooms) || 0;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity) || 0;
    if (warden !== undefined) updateData.warden = warden;
    if (contact !== undefined) updateData.contact = contact;
    if (description !== undefined) updateData.description = description;
    if (rules !== undefined) updateData.rules = rules;
    if (status !== undefined) updateData.status = status;

    const hostel = await prisma.hostel.update({ where: { id: req.params.id }, data: updateData });
    await logActivity('Hostels', 'Updated', `Updated hostel: ${hostel.name}`, req.admin.id);
    res.json({ success: true, hostel });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const hostel = await prisma.hostel.findFirst({ where: { id: req.params.id, adminId: req.admin.id }, include: { _count: { select: { rooms: true } } } });
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found' });

    if (hostel._count.rooms > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete hostel branch with registered rooms. Please delete all rooms in this hostel first.' });
    }

    await prisma.hostel.delete({ where: { id: req.params.id } });
    await logActivity('Hostels', 'Deleted', `Deleted hostel: ${hostel.name}`, req.admin.id);
    res.json({ success: true, message: 'Hostel deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

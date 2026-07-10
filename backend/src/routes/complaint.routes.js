const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Complaints', action, detail, userId } }); } catch {}
};

// GET /api/complaints
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, priority, category, search } = req.query;
    const where = { adminId: req.admin.id };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' }, adminId: req.admin.id } }
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, room: { select: { roomNumber: true } } } }
      }
    });

    res.json({ success: true, complaints });
  } catch (err) { next(err); }
});

// POST /api/complaints
router.post('/', protect, async (req, res, next) => {
  try {
    const { studentId, title, description, category, priority, status } = req.body;
    const student = await prisma.student.findFirst({ where: { id: studentId, adminId: req.admin.id } });
    if (!student) return res.status(400).json({ success: false, message: 'Invalid Student ID' });

    const complaint = await prisma.complaint.create({ 
      data: { 
        studentId,
        title,
        description,
        category: category || 'General',
        priority: priority || 'Medium',
        status: status || 'Pending',
        adminId: req.admin.id 
      } 
    });
    await log('Created', `Registered complaint: "${complaint.title}"`, req.admin.id);
    res.status(201).json({ success: true, complaint });
  } catch (err) { next(err); }
});

// PUT /api/complaints/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.complaint.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const { status, assignedTo, notes } = req.body;
    
    const data = { status, assignedTo, notes };
    if (status === 'Resolved') {
      data.resolvedAt = new Date();
    }

    const complaint = await prisma.complaint.update({
      where: { id: req.params.id },
      data
    });
    
    await log('Updated', `Updated status of complaint "${complaint.title}" to ${status}`, req.admin.id);
    res.json({ success: true, complaint });
  } catch (err) { next(err); }
});

// PUT /api/complaints/:id/resolve
router.put('/:id/resolve', protect, async (req, res, next) => {
  try {
    const exists = await prisma.complaint.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const { feedback } = req.body;
    const complaint = await prisma.complaint.update({
      where: { id: req.params.id },
      data: {
        status: 'Resolved',
        notes: feedback || null,
        resolvedAt: new Date()
      }
    });
    await log('Updated', `Resolved complaint "${complaint.title}"`, req.admin.id);
    res.json({ success: true, complaint });
  } catch (err) { next(err); }
});

// DELETE /api/complaints/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.complaint.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Complaint not found' });

    await prisma.complaint.delete({ where: { id: req.params.id } });
    await log('Deleted', `Deleted complaint record ID ${req.params.id}`, req.admin.id);
    res.json({ success: true, message: 'Complaint deleted' });
  } catch (err) { next(err); }
});

module.exports = router;

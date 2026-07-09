const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Notices', action, detail, userId } }); } catch {}
};

// GET /api/notices
router.get('/', protect, async (req, res, next) => {
  try {
    const { category, pinned } = req.query;
    const where = { createdBy: req.admin.id };

    if (category) where.category = category;
    if (pinned) where.pinned = pinned === 'true';

    const notices = await prisma.notice.findMany({
      where,
      orderBy: [
        { pinned: 'desc' },
        { publishedAt: 'desc' }
      ],
      include: {
        admin: { select: { name: true } }
      }
    });

    res.json({ success: true, notices });
  } catch (err) { next(err); }
});

// POST /api/notices
router.post('/', protect, async (req, res, next) => {
  try {
    const notice = await prisma.notice.create({
      data: {
        ...req.body,
        createdBy: req.admin.id
      }
    });
    await log('Created', `Notice announcement published: "${notice.title}"`, req.admin.id);
    res.status(201).json({ success: true, notice });
  } catch (err) { next(err); }
});

// PUT /api/notices/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.notice.findFirst({ where: { id: req.params.id, createdBy: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Notice not found' });

    const notice = await prisma.notice.update({
      where: { id: req.params.id },
      data: req.body
    });
    await log('Updated', `Notice announcement updated: "${notice.title}"`, req.admin.id);
    res.json({ success: true, notice });
  } catch (err) { next(err); }
});

// PATCH /api/notices/:id/pin
router.patch('/:id/pin', protect, async (req, res, next) => {
  try {
    const exists = await prisma.notice.findFirst({ where: { id: req.params.id, createdBy: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Notice not found' });

    const { pinned } = req.body;
    const notice = await prisma.notice.update({
      where: { id: req.params.id },
      data: { pinned }
    });
    res.json({ success: true, notice });
  } catch (err) { next(err); }
});

// DELETE /api/notices/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.notice.findFirst({ where: { id: req.params.id, createdBy: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Notice not found' });

    await prisma.notice.delete({ where: { id: req.params.id } });
    await log('Deleted', `Notice announcement deleted ID ${req.params.id}`, req.admin.id);
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Notices', action, detail, userId } }); } catch {}
};

// GET /api/notices
router.get('/', protect, async (req, res, next) => {
  try {
    const { category, pinned, search } = req.query;
    const where = { createdBy: req.admin.id };

    if (category) where.category = category;
    if (pinned) where.pinned = pinned === 'true';
    // BUG FIX: was ignoring `search` param — now filters by title/content
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

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
    const { title, content, category, pinned, expiresAt } = req.body;
    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category: category || 'General',
        pinned: !!pinned,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
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

    const { title, content, category, pinned, expiresAt } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (pinned !== undefined) updateData.pinned = !!pinned;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const notice = await prisma.notice.update({
      where: { id: req.params.id },
      data: updateData
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

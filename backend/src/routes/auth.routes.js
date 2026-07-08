const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');

const prisma = new PrismaClient();

const signToken = (id, email, name) =>
  jwt.sign({ id, email, name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = signToken(admin.id, admin.email, admin.name);
    res.json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email, avatar: admin.avatar } });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id }, select: { id: true, name: true, email: true, avatar: true, phone: true } });
    res.json({ success: true, admin });
  } catch (err) { next(err); }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const admin = await prisma.admin.update({ where: { id: req.admin.id }, data: { name, phone }, select: { id: true, name: true, email: true, phone: true, avatar: true } });
    res.json({ success: true, admin });
  } catch (err) { next(err); }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({ where: { id: req.admin.id }, data: { passwordHash: hash } });
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

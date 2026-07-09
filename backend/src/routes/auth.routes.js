const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');

const prisma = new PrismaClient();

const signToken = (id, email, name) =>
  jwt.sign({ id, email, name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({
      data: { name, email, passwordHash, phone: phone || null }
    });
    delete admin.passwordHash;
    const token = signToken(admin.id, admin.email, admin.name);
    res.status(201).json({ success: true, token, admin });
  } catch (err) { next(err); }
});

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
    delete admin.passwordHash;
    res.json({ success: true, token, admin });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    if (admin) delete admin.passwordHash;
    res.json({ success: true, admin });
  } catch (err) { next(err); }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const {
      name,
      phone,
      hostelName,
      hostelAddress,
      hostelPhone,
      signatoryName,
      enableDualAccounts,
      account1Name,
      account2Name,
      account1Prefix,
      account2Prefix,
      account1DefaultAmount,
      account2DefaultAmount,
      defaultMonthlyAmount
    } = req.body;

    const data = { name, phone };
    if (hostelName !== undefined) data.hostelName = hostelName;
    if (hostelAddress !== undefined) data.hostelAddress = hostelAddress;
    if (hostelPhone !== undefined) data.hostelPhone = hostelPhone;
    if (signatoryName !== undefined) data.signatoryName = signatoryName;
    if (enableDualAccounts !== undefined) data.enableDualAccounts = !!enableDualAccounts;
    if (account1Name !== undefined) data.account1Name = account1Name;
    if (account2Name !== undefined) data.account2Name = account2Name;
    if (account1Prefix !== undefined) data.account1Prefix = account1Prefix;
    if (account2Prefix !== undefined) data.account2Prefix = account2Prefix;
    if (account1DefaultAmount !== undefined) data.account1DefaultAmount = parseFloat(account1DefaultAmount) || 0;
    if (account2DefaultAmount !== undefined) data.account2DefaultAmount = parseFloat(account2DefaultAmount) || 0;
    if (defaultMonthlyAmount !== undefined) data.defaultMonthlyAmount = parseFloat(defaultMonthlyAmount) || 0;

    const admin = await prisma.admin.update({
      where: { id: req.admin.id },
      data
    });
    delete admin.passwordHash;
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

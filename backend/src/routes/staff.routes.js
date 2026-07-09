const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const parseSalary = (val) => {
  if (val === undefined) return undefined;
  if (val === null || val === '') return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? undefined : parsed;
};

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Staff', action, detail, userId } }); } catch {}
};

// Helper to map staff DB model properties to frontend keys
const mapStaffResponse = (s) => ({
  ...s,
  role: s.designation,
  shift: s.department
});

// GET /api/staff
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, designation, status } = req.query;
    const where = { adminId: req.admin.id };

    if (designation) where.designation = designation;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } }
      ];
    }

    const staff = await prisma.staff.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, staff: staff.map(mapStaffResponse) });
  } catch (err) { next(err); }
});

// POST /api/staff
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, email, phone, role, shift, designation, department, salary, address, status } = req.body;
    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        phone,
        designation: role !== undefined ? role : designation,
        department: shift !== undefined ? shift : department,
        salary: parseSalary(salary),
        address,
        status,
        adminId: req.admin.id
      }
    });
    await log('Created', `Added staff member: ${staff.name} (${staff.designation})`, req.admin.id);
    res.status(201).json({ success: true, staff: mapStaffResponse(staff) });
  } catch (err) { next(err); }
});

// PUT /api/staff/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.staff.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Staff member not found' });

    const { name, email, phone, role, shift, designation, department, salary, address, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (address !== undefined) updateData.address = address;
    if (salary !== undefined) updateData.salary = parseSalary(salary);
    
    const finalDesignation = role !== undefined ? role : designation;
    if (finalDesignation !== undefined) updateData.designation = finalDesignation;
    
    const finalDepartment = shift !== undefined ? shift : department;
    if (finalDepartment !== undefined) updateData.department = finalDepartment;

    const staff = await prisma.staff.update({
      where: { id: req.params.id },
      data: updateData
    });
    await log('Updated', `Updated staff details: ${staff.name}`, req.admin.id);
    res.json({ success: true, staff: mapStaffResponse(staff) });
  } catch (err) { next(err); }
});

// DELETE /api/staff/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const staff = await prisma.staff.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });

    await prisma.staff.delete({ where: { id: req.params.id } });
    await log('Deleted', `Deleted staff member: ${staff.name}`, req.admin.id);
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

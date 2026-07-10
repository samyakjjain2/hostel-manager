const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Students', action, detail, userId } }); } catch {}
};

// GET /api/students
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, hostelId, roomId, status, page = 1, limit = 20 } = req.query;
    const where = { adminId: req.admin.id };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { enrollmentNumber: { contains: search, mode: 'insensitive' } }
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
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, adminId: req.admin.id },
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
    
    // Check unique email and enrollment within this admin's scope
    if (email) {
      const existingEmail = await prisma.student.findFirst({ where: { email, adminId: req.admin.id } });
      if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    if (enrollmentNumber) {
      const existingEnroll = await prisma.student.findFirst({ where: { enrollmentNumber, adminId: req.admin.id } });
      if (existingEnroll) return res.status(400).json({ success: false, message: 'Enrollment number already exists' });
    }

    const { 
      name, email, phone, dateOfBirth, gender, college, course, year,
      enrollmentNumber, address, city, state, parentName, parentPhone, parentEmail,
      emergencyContact, admissionDate, status, notes
    } = req.body;

    const student = await prisma.student.create({ 
      data: { 
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || 'Male',
        college,
        course,
        year,
        enrollmentNumber,
        address,
        city,
        state,
        parentName,
        parentPhone,
        parentEmail,
        emergencyContact,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        status: status || 'Active',
        notes,
        adminId: req.admin.id 
      } 
    });
    await log('Created', `Added student: ${student.name}`, req.admin.id);
    res.status(201).json({ success: true, student });
  } catch (err) { next(err); }
});

// PUT /api/students/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.student.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Student not found' });

    const { email, enrollmentNumber } = req.body;
    
    // Check unique validations (except current student) within this admin's scope
    if (email) {
      const existingEmail = await prisma.student.findFirst({ where: { email, adminId: req.admin.id, NOT: { id: req.params.id } } });
      if (existingEmail) return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    if (enrollmentNumber) {
      const existingEnroll = await prisma.student.findFirst({ where: { enrollmentNumber, adminId: req.admin.id, NOT: { id: req.params.id } } });
      if (existingEnroll) return res.status(400).json({ success: false, message: 'Enrollment number already in use' });
    }

    const {
      name, email, phone, enrollmentNumber, course, gender, dateOfBirth,
      parentName, parentPhone, address, photo, bloodGroup, aadharNumber,
      admissionDate, status, notes
    } = req.body;

    // BUG FIX: whitelist permitted fields — never allow adminId/roomId/hostelId via API
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (enrollmentNumber !== undefined) updateData.enrollmentNumber = enrollmentNumber;
    if (course !== undefined) updateData.course = course;
    if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (parentName !== undefined) updateData.parentName = parentName;
    if (parentPhone !== undefined) updateData.parentPhone = parentPhone;
    if (address !== undefined) updateData.address = address;
    if (photo !== undefined) updateData.photo = photo;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (aadharNumber !== undefined) updateData.aadharNumber = aadharNumber;
    if (admissionDate !== undefined) updateData.admissionDate = admissionDate ? new Date(admissionDate) : null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: updateData
    });
    await log('Updated', `Updated student: ${student.name}`, req.admin.id);
    res.json({ success: true, student });
  } catch (err) { next(err); }
});

// DELETE /api/students/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    // If student is currently occupying a room, decrement bed count safely
    if (student.roomId) {
      // BUG FIX: use updateMany with gt:0 guard to prevent negative bed count
      await prisma.room.updateMany({
        where: { id: student.roomId, adminId: req.admin.id, occupiedBeds: { gt: 0 } },
        data: { occupiedBeds: { decrement: 1 } }
      });
    }

    await prisma.student.delete({ where: { id: req.params.id } });
    await log('Deleted', `Deleted student: ${student.name}`, req.admin.id);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

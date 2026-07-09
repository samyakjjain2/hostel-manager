const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Allocations', action, detail, userId } }); } catch {}
};

// GET /api/allocations OR /api/allocations/history
router.get('/', protect, async (req, res, next) => {
  try {
    const allocations = await prisma.roomAllocation.findMany({
      where: { adminId: req.admin.id },
      orderBy: { checkIn: 'desc' },
      include: {
        student: { select: { name: true, email: true, enrollmentNumber: true } },
        room: { select: { roomNumber: true, hostel: { select: { name: true } } } }
      }
    });
    res.json({ success: true, allocations });
  } catch (err) { next(err); }
});

router.get('/history', protect, async (req, res, next) => {
  try {
    const allocations = await prisma.roomAllocation.findMany({
      where: { adminId: req.admin.id },
      orderBy: { checkIn: 'desc' },
      include: {
        student: { select: { name: true, email: true, enrollmentNumber: true } },
        room: { select: { roomNumber: true, hostel: { select: { name: true } } } }
      }
    });
    res.json({ success: true, allocations });
  } catch (err) { next(err); }
});

// POST /api/allocations OR /api/allocations/allocate
router.post('/', protect, async (req, res, next) => {
  try {
    const { studentId, roomId } = req.body;
    const bedNoInput = req.body.bedNo !== undefined ? req.body.bedNo : req.body.bedNumber;
    const bedNo = parseInt(bedNoInput) || 1;

    if (!studentId || !roomId || !bedNo) {
      return res.status(400).json({ success: false, message: 'Student ID, Room ID, and Bed Number are required' });
    }

    const [student, room] = await Promise.all([
      prisma.student.findFirst({ where: { id: studentId, adminId: req.admin.id } }),
      prisma.room.findFirst({ where: { id: roomId, adminId: req.admin.id }, include: { hostel: true } })
    ]);

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (student.roomId) return res.status(400).json({ success: false, message: 'Student is already allocated to a room' });
    if (room.occupiedBeds >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is already at full capacity' });
    }

    // Allocate student
    await prisma.$transaction([
      prisma.student.update({
        where: { id: studentId },
        data: { roomId, hostelId: room.hostelId, bedNo }
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { occupiedBeds: { increment: 1 } }
      }),
      prisma.roomAllocation.create({
        data: { studentId, roomId, bedNo, checkIn: new Date(), status: 'Active', adminId: req.admin.id }
      })
    ]);

    await log('Allocated', `Allocated student ${student.name} to Room ${room.roomNumber} (${room.hostel.name})`, req.admin.id);
    res.json({ success: true, message: 'Room allocated successfully' });
  } catch (err) { next(err); }
});

router.post('/allocate', protect, async (req, res, next) => {
  try {
    const { studentId, roomId, bedNo } = req.body;
    if (!studentId || !roomId || !bedNo) {
      return res.status(400).json({ success: false, message: 'Student ID, Room ID, and Bed Number are required' });
    }

    const [student, room] = await Promise.all([
      prisma.student.findFirst({ where: { id: studentId, adminId: req.admin.id } }),
      prisma.room.findFirst({ where: { id: roomId, adminId: req.admin.id }, include: { hostel: true } })
    ]);

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (student.roomId) return res.status(400).json({ success: false, message: 'Student is already allocated to a room' });
    if (room.occupiedBeds >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is already at full capacity' });
    }

    // Allocate student
    await prisma.$transaction([
      prisma.student.update({
        where: { id: studentId },
        data: { roomId, hostelId: room.hostelId, bedNo }
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { occupiedBeds: { increment: 1 } }
      }),
      prisma.roomAllocation.create({
        data: { studentId, roomId, bedNo, checkIn: new Date(), status: 'Active', adminId: req.admin.id }
      })
    ]);

    await log('Allocated', `Allocated student ${student.name} to Room ${room.roomNumber} (${room.hostel.name})`, req.admin.id);
    res.json({ success: true, message: 'Room allocated successfully' });
  } catch (err) { next(err); }
});

// POST /api/allocations/transfer
router.post('/transfer', protect, async (req, res, next) => {
  try {
    const { studentId, targetRoomId, targetBedNo } = req.body;
    if (!studentId || !targetRoomId || !targetBedNo) {
      return res.status(400).json({ success: false, message: 'Student ID, target Room ID, and target Bed No are required' });
    }

    const [student, targetRoom] = await Promise.all([
      prisma.student.findFirst({ where: { id: studentId, adminId: req.admin.id } }),
      prisma.room.findFirst({ where: { id: targetRoomId, adminId: req.admin.id }, include: { hostel: true } })
    ]);

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!targetRoom) return res.status(404).json({ success: false, message: 'Target room not found' });
    if (!student.roomId) return res.status(400).json({ success: false, message: 'Student is not currently allocated to any room' });
    if (student.roomId === targetRoomId) return res.status(400).json({ success: false, message: 'Target room is the same as current room' });
    if (targetRoom.occupiedBeds >= targetRoom.capacity) {
      return res.status(400).json({ success: false, message: 'Target room is at full capacity' });
    }

    const currentRoomId = student.roomId;

    // Transfer transactions
    await prisma.$transaction([
      // Close current active allocation
      prisma.roomAllocation.updateMany({
        where: { studentId, roomId: currentRoomId, status: 'Active', adminId: req.admin.id },
        data: { checkOut: new Date(), status: 'CheckedOut' }
      }),
      // Decrement occupied beds of current room
      prisma.room.update({
        where: { id: currentRoomId },
        data: { occupiedBeds: { decrement: 1 } }
      }),
      // Update student details
      prisma.student.update({
        where: { id: studentId },
        data: { roomId: targetRoomId, hostelId: targetRoom.hostelId, bedNo: targetBedNo }
      }),
      // Increment occupied beds of target room
      prisma.room.update({
        where: { id: targetRoomId },
        data: { occupiedBeds: { increment: 1 } }
      }),
      // Create new active allocation
      prisma.roomAllocation.create({
        data: { studentId, roomId: targetRoomId, bedNo: targetBedNo, checkIn: new Date(), status: 'Active', adminId: req.admin.id }
      })
    ]);

    await log('Transferred', `Transferred student ${student.name} to Room ${targetRoom.roomNumber} (${targetRoom.hostel.name})`, req.admin.id);
    res.json({ success: true, message: 'Room transferred successfully' });
  } catch (err) { next(err); }
});

// POST /api/allocations/checkout
router.post('/checkout', protect, async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'Student ID is required' });

    const student = await prisma.student.findFirst({ where: { id: studentId, adminId: req.admin.id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!student.roomId) return res.status(400).json({ success: false, message: 'Student is not currently allocated to any room' });

    const roomId = student.roomId;

    await prisma.$transaction([
      // Close allocation
      prisma.roomAllocation.updateMany({
        where: { studentId, roomId, status: 'Active', adminId: req.admin.id },
        data: { checkOut: new Date(), status: 'CheckedOut' }
      }),
      // Update room occupied bed count
      prisma.room.update({
        where: { id: roomId },
        data: { occupiedBeds: { decrement: 1 } }
      }),
      // Clear student's room assignment and change status
      prisma.student.update({
        where: { id: studentId },
        data: { roomId: null, hostelId: null, bedNo: null, status: 'CheckedOut' }
      })
    ]);

    await log('CheckedOut', `Checked out student ${student.name}`, req.admin.id);
    res.json({ success: true, message: 'Student checked out successfully' });
  } catch (err) { next(err); }
});

// PUT /api/allocations/:id/checkout
router.put('/:id/checkout', protect, async (req, res, next) => {
  try {
    const allocation = await prisma.roomAllocation.findFirst({
      where: { id: req.params.id, adminId: req.admin.id }
    });
    if (!allocation) return res.status(404).json({ success: false, message: 'Allocation not found' });
    if (allocation.status === 'CheckedOut') {
      return res.status(400).json({ success: false, message: 'Allocation is already checked out' });
    }

    const { studentId, roomId } = allocation;

    await prisma.$transaction([
      // Close allocation
      prisma.roomAllocation.update({
        where: { id: req.params.id },
        data: { checkOut: new Date(), status: 'CheckedOut' }
      }),
      // Update room occupied bed count
      prisma.room.update({
        where: { id: roomId },
        data: { occupiedBeds: { decrement: 1 } }
      }),
      // Clear student's room assignment and change status
      prisma.student.update({
        where: { id: studentId },
        data: { roomId: null, hostelId: null, bedNo: null, status: 'CheckedOut' }
      })
    ]);

    const student = await prisma.student.findFirst({ where: { id: studentId, adminId: req.admin.id } });
    await log('CheckedOut', `Checked out student ${student?.name || 'Student'}`, req.admin.id);
    res.json({ success: true, message: 'Student checked out successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

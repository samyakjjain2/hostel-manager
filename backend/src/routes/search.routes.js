const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/search?q=query
router.get('/', protect, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        results: { students: [], rooms: [], staff: [], complaints: [] }
      });
    }

    const searchQuery = q.trim();

    // Query in parallel
    const [students, rooms, staff, complaints] = await Promise.all([
      // 1. Search Students
      prisma.student.findMany({
        where: {
          adminId: req.admin.id,
          OR: [
            { name: { contains: searchQuery } },
            { enrollmentNumber: { contains: searchQuery } },
            { email: { contains: searchQuery } },
            { phone: { contains: searchQuery } }
          ]
        },
        include: {
          room: { include: { hostel: true } },
          fees: { take: 5, orderBy: { createdAt: 'desc' } },
          complaints: { take: 5, orderBy: { createdAt: 'desc' } }
        },
        take: 10
      }),

      // 2. Search Rooms
      prisma.room.findMany({
        where: {
          adminId: req.admin.id,
          roomNumber: { contains: searchQuery }
        },
        include: {
          hostel: true,
          students: true
        },
        take: 10
      }),

      // 3. Search Staff
      prisma.staff.findMany({
        where: {
          adminId: req.admin.id,
          OR: [
            { name: { contains: searchQuery } },
            { designation: { contains: searchQuery } }
          ]
        },
        take: 10
      }),

      // 4. Search Complaints
      prisma.complaint.findMany({
        where: {
          adminId: req.admin.id,
          OR: [
            { title: { contains: searchQuery } },
            { description: { contains: searchQuery } }
          ]
        },
        include: {
          student: true
        },
        take: 10
      })
    ]);

    res.json({
      success: true,
      results: {
        students,
        rooms,
        staff,
        complaints
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

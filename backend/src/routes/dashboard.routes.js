const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { protect } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const adminId = req.admin.id;
    const [
      totalStudents, activeStudents, totalRooms, totalStaff,
      pendingFees, pendingComplaints, todayVisitors, recentStudents,
      hostels, rooms, monthlyRevenue
    ] = await Promise.all([
      prisma.student.count({ where: { adminId } }),
      prisma.student.count({ where: { status: 'Active', adminId } }),
      prisma.room.count({ where: { adminId } }),
      prisma.staff.count({ where: { status: 'Active', adminId } }),
      prisma.fee.aggregate({ _sum: { amount: true, paidAmount: true }, where: { status: { in: ['Pending', 'Overdue'] }, adminId } }),
      prisma.complaint.count({ where: { status: { in: ['Pending', 'InProgress'] }, adminId } }),
      prisma.visitor.count({ where: { status: 'CheckedIn', adminId, checkIn: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      prisma.student.findMany({ where: { adminId }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, photo: true, course: true, admissionDate: true, status: true } }),
      prisma.hostel.findMany({ where: { adminId }, include: { _count: { select: { rooms: true } } } }),
      prisma.room.findMany({ where: { adminId }, select: { capacity: true, occupiedBeds: true, status: true } }),
      prisma.fee.aggregate({ _sum: { paidAmount: true }, where: { status: 'Paid', adminId, paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } })
    ]);

    const totalBeds = rooms.reduce((s, r) => s + r.capacity, 0);
    const occupiedBeds = rooms.reduce((s, r) => s + r.occupiedBeds, 0);
    const vacantBeds = totalBeds - occupiedBeds;

    res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        totalRooms,
        totalStaff,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        pendingFees: (pendingFees._sum.amount || 0) - (pendingFees._sum.paidAmount || 0),
        pendingComplaints,
        todayVisitors,
        monthlyRevenue: monthlyRevenue._sum.paidAmount || 0,
        hostelCount: hostels.length,
        recentStudents
      }
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/activity
router.get('/activity', protect, async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.admin.id },
      take: 20, orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true } } }
    });
    res.json({ success: true, logs });
  } catch (err) { next(err); }
});

// GET /api/dashboard/occupancy-chart
router.get('/occupancy-chart', protect, async (req, res, next) => {
  try {
    const hostels = await prisma.hostel.findMany({
      where: { adminId: req.admin.id },
      include: { rooms: { select: { capacity: true, occupiedBeds: true } } }
    });
    const data = hostels.map(h => ({
      name: h.name,
      capacity: h.rooms.reduce((s, r) => s + r.capacity, 0),
      occupied: h.rooms.reduce((s, r) => s + r.occupiedBeds, 0)
    }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/dashboard/fee-trend
router.get('/fee-trend', protect, async (req, res, next) => {
  try {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear(), label: d.toLocaleString('default', { month: 'short', year: '2-digit' }) };
    }).reverse();

    const data = await Promise.all(months.map(async ({ month, year, label }) => {
      const agg = await prisma.fee.aggregate({
        _sum: { paidAmount: true },
        where: { month, year, status: 'Paid', adminId: req.admin.id }
      });
      return { label, amount: agg._sum.paidAmount || 0 };
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;

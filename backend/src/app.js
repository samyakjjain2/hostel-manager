const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth.routes');
const hostelRoutes = require('./routes/hostel.routes');
const roomRoutes = require('./routes/room.routes');
const studentRoutes = require('./routes/student.routes');
const allocationRoutes = require('./routes/allocation.routes');
const feeRoutes = require('./routes/fee.routes');
const complaintRoutes = require('./routes/complaint.routes');
const visitorRoutes = require('./routes/visitor.routes');
const staffRoutes = require('./routes/staff.routes');
const noticeRoutes = require('./routes/notice.routes');
const reportRoutes = require('./routes/report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const searchRoutes = require('./routes/search.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded photos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static assets from frontend/dist
// Use process.cwd() since start command runs from repo root
const frontendDistPath = path.join(process.cwd(), 'frontend', 'dist');
console.log(`📂 Frontend dist path: ${frontendDistPath}`);
console.log(`📂 Frontend dist exists: ${fs.existsSync(frontendDistPath)}`);
if (fs.existsSync(frontendDistPath)) {
  console.log(`📂 Frontend dist contents: ${fs.readdirSync(frontendDistPath).join(', ')}`);
}
app.use(express.static(frontendDistPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);

// Fallback all non-API requests to React SPA frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;

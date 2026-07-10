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

// Serve frontend static assets
// In production, build copies dist → backend/public. In dev, try frontend/dist.
const publicPath = path.join(__dirname, '..', 'public');
const devDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
const frontendDistPath = fs.existsSync(publicPath) ? publicPath : devDistPath;
console.log(`📂 Serving frontend from: ${frontendDistPath}`);
console.log(`📂 Path exists: ${fs.existsSync(frontendDistPath)}`);
if (fs.existsSync(frontendDistPath)) {
  console.log(`📂 Contents: ${fs.readdirSync(frontendDistPath).join(', ')}`);
  app.use(express.static(frontendDistPath));
}

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
  const indexPath = path.join(frontendDistPath, 'index.html');
  // BUG FIX: guard against crash when dist hasn't been built yet
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ success: false, message: 'Frontend not built. Run npm run build in frontend.' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;

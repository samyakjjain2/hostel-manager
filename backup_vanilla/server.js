// server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static frontend from root folder

const prisma = new PrismaClient();
let useDbFallback = false;

// Default In-Memory DB state for fallback if DB is not connected
const FALLBACK_DB = {
  users: [
    { email: 'manager@aegis.com', password: 'manager123', name: 'Hostel Manager', role: 'ADMIN' },
    { email: 'admin@aegis.com', password: 'password123', name: 'Admin User', role: 'ADMIN' }
  ],
  hostels: [
    { id: 'hostel-a', name: 'Boys Hostel Alpha', type: 'Boys', floors: 3, capacity: 60, warden: 'Mr. Rajesh Sharma', contact: '+91 98765 43210' },
    { id: 'hostel-b', name: 'Girls Hostel Beta', type: 'Girls', floors: 3, capacity: 60, warden: 'Dr. Sunita Deshmukh', contact: '+91 98765 43211' },
    { id: 'hostel-c', name: 'PG Wing Gamma', type: 'Co-ed', floors: 2, capacity: 20, warden: 'Mr. Arvind Gupta', contact: '+91 98765 43212' }
  ],
  rooms: [
    { id: 'r-a-101', hostelId: 'hostel-a', roomNumber: '101', floor: 1, type: 'Single', rent: 6000, status: 'Available', beds: 1 },
    { id: 'r-a-102', hostelId: 'hostel-a', roomNumber: '102', floor: 1, type: 'Double', rent: 4500, status: 'Available', beds: 2 },
    { id: 'r-a-103', hostelId: 'hostel-a', roomNumber: '103', floor: 1, type: 'Triple', rent: 3000, status: 'Available', beds: 3 },
    { id: 'r-a-201', hostelId: 'hostel-a', roomNumber: '201', floor: 2, type: 'Single', rent: 6000, status: 'Available', beds: 1 },
    { id: 'r-a-202', hostelId: 'hostel-a', roomNumber: '202', floor: 2, type: 'Double', rent: 4500, status: 'Maintenance', beds: 2 },
    { id: 'r-a-301', hostelId: 'hostel-a', roomNumber: '301', floor: 3, type: 'Double', rent: 4500, status: 'Available', beds: 2 },
    { id: 'r-b-101', hostelId: 'hostel-b', roomNumber: '101', floor: 1, type: 'Single', rent: 6500, status: 'Available', beds: 1 },
    { id: 'r-b-102', hostelId: 'hostel-b', roomNumber: '102', floor: 1, type: 'Double', rent: 4800, status: 'Available', beds: 2 },
    { id: 'r-b-103', hostelId: 'hostel-b', roomNumber: '103', floor: 1, type: 'Triple', rent: 3200, status: 'Available', beds: 3 },
    { id: 'r-b-201', hostelId: 'hostel-b', roomNumber: '201', floor: 2, type: 'Double', rent: 4800, status: 'Available', beds: 2 },
    { id: 'r-c-101', hostelId: 'hostel-c', roomNumber: '101', floor: 1, type: 'Single', rent: 8000, status: 'Available', beds: 1 },
    { id: 'r-c-102', hostelId: 'hostel-c', roomNumber: '102', floor: 1, type: 'Double', rent: 5500, status: 'Available', beds: 2 }
  ],
  students: [
    { id: 'std-1001', name: 'Aditya Verma', email: 'aditya.verma@example.com', phone: '+91 99112 23344', gender: 'Male', collegeId: 'CS23B1002', hostelId: 'hostel-a', roomId: 'r-a-103', bedNo: 1, status: 'Active', parentName: 'Ramesh Verma', parentPhone: '+91 99112 23300', feeStatus: 'Paid' },
    { id: 'std-1002', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', phone: '+91 99223 34455', gender: 'Male', collegeId: 'EE23B2015', hostelId: 'hostel-a', roomId: 'r-a-103', bedNo: 2, status: 'Active', parentName: 'Anil Mehta', parentPhone: '+91 99223 34400', feeStatus: 'Pending' },
    { id: 'std-1003', name: 'Kabir Singh', email: 'kabir.singh@example.com', phone: '+91 99334 45566', gender: 'Male', collegeId: 'ME22B3020', hostelId: 'hostel-a', roomId: 'r-a-103', bedNo: 3, status: 'Active', parentName: 'Jaswant Singh', parentPhone: '+91 99334 45500', feeStatus: 'Overdue' },
    { id: 'std-1004', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '+91 99445 56677', gender: 'Female', collegeId: 'EC23B4009', hostelId: 'hostel-b', roomId: 'r-b-101', bedNo: 1, status: 'Active', parentName: 'Srinivasan Iyer', parentPhone: '+91 99445 56600', feeStatus: 'Paid' },
    { id: 'std-1005', name: 'Sneha Patel', email: 'sneha.patel@example.com', phone: '+91 99556 67788', gender: 'Female', collegeId: 'CS22B1045', hostelId: 'hostel-b', roomId: 'r-b-102', bedNo: 1, status: 'Active', parentName: 'Vijay Patel', parentPhone: '+91 99556 67700', feeStatus: 'Paid' },
    { id: 'std-1006', name: 'Arjun Nair', email: 'arjun.nair@example.com', phone: '+91 99667 78899', gender: 'Male', collegeId: 'CE23B5011', hostelId: 'hostel-a', roomId: 'r-a-102', bedNo: 1, status: 'Active', parentName: 'Madhavan Nair', parentPhone: '+91 99667 78800', feeStatus: 'Pending' },
    { id: 'std-1007', name: 'Divya Sharma', email: 'divya.sharma@example.com', phone: '+91 99778 89900', gender: 'Female', collegeId: 'IT23B6022', hostelId: 'hostel-b', roomId: 'r-b-103', bedNo: 1, status: 'Active', parentName: 'Prakash Sharma', parentPhone: '+91 99778 89901', feeStatus: 'Paid' },
    { id: 'std-1008', name: 'Vikram Malhotra', email: 'vikram.malhotra@example.com', phone: '+91 99889 90011', gender: 'Male', collegeId: 'CH22B7005', hostelId: 'hostel-c', roomId: 'r-c-102', bedNo: 1, status: 'Active', parentName: 'Sanjay Malhotra', parentPhone: '+91 99889 90000', feeStatus: 'Paid' },
    { id: 'std-1009', name: 'Priya Sen', email: 'priya.sen@example.com', phone: '+91 99990 01122', gender: 'Female', collegeId: 'CS24M1001', hostelId: 'hostel-c', roomId: 'r-c-102', bedNo: 2, status: 'Active', parentName: 'Gaurav Sen', parentPhone: '+91 99990 01100', feeStatus: 'Pending' },
    { id: 'std-1010', name: 'Rahul Joshi', email: 'rahul.joshi@example.com', phone: '+91 99001 12233', gender: 'Male', collegeId: 'EE22B2050', hostelId: null, roomId: null, bedNo: null, status: 'Active', parentName: 'Satish Joshi', parentPhone: '+91 99001 12200', feeStatus: 'Pending' }
  ],
  fees: [
    { id: 'inv-2001', studentId: 'std-1001', amount: 6000, dueDate: '2026-07-05', paidDate: '2026-07-02', status: 'Paid', term: 'July 2026 Room Rent' },
    { id: 'inv-2002', studentId: 'std-1002', amount: 3000, dueDate: '2026-07-05', paidDate: null, status: 'Pending', term: 'July 2026 Room Rent' },
    { id: 'inv-2003', studentId: 'std-1003', amount: 3000, dueDate: '2026-06-05', paidDate: null, status: 'Overdue', term: 'June 2026 Room Rent' },
    { id: 'inv-2004', studentId: 'std-1004', amount: 6500, dueDate: '2026-07-05', paidDate: '2026-07-01', status: 'Paid', term: 'July 2026 Room Rent' },
    { id: 'inv-2005', studentId: 'std-1005', amount: 4800, dueDate: '2026-07-05', paidDate: '2026-07-04', status: 'Paid', term: 'July 2026 Room Rent' },
    { id: 'inv-2006', studentId: 'std-1006', amount: 4500, dueDate: '2026-07-05', paidDate: null, status: 'Pending', term: 'July 2026 Room Rent' },
    { id: 'inv-2007', studentId: 'std-1007', amount: 3200, dueDate: '2026-07-05', paidDate: '2026-07-03', status: 'Paid', term: 'July 2026 Room Rent' },
    { id: 'inv-2008', studentId: 'std-1008', amount: 5500, dueDate: '2026-07-05', paidDate: '2026-07-01', status: 'Paid', term: 'July 2026 Room Rent' },
    { id: 'inv-2009', studentId: 'std-1009', amount: 5500, dueDate: '2026-07-05', paidDate: null, status: 'Pending', term: 'July 2026 Room Rent' }
  ],
  complaints: [
    { id: 'cmp-3001', studentId: 'std-1002', studentName: 'Rohan Mehta', title: 'Ceiling Fan Making Noise', category: 'Electrical', description: 'The regulator is not working, and the fan makes a squeaking sound at speed 4.', date: '2026-07-04', status: 'Pending', resolution: '' },
    { id: 'cmp-3002', studentId: 'std-1003', studentName: 'Kabir Singh', title: 'Tap Leakage in Washroom', category: 'Plumbing', description: 'The washroom faucet is continuously dripping, causing water wastage.', date: '2026-07-05', status: 'In Progress', resolution: 'Plumber assigned, waiting for spare parts.' },
    { id: 'cmp-3003', studentId: 'std-1004', studentName: 'Ananya Iyer', title: 'WiFi Connection Dropping', category: 'Internet', description: 'Strong signal but frequently drops connection on floor 1 wing B.', date: '2026-07-03', status: 'Resolved', resolution: 'Access point rebooted and firmware updated.' },
    { id: 'cmp-3004', studentId: 'std-1005', studentName: 'Sneha Patel', title: 'Room Cleaning Service Delayed', category: 'Cleaning', description: 'Housekeeper has not cleaned room 102 since 3 days.', date: '2026-07-06', status: 'Pending', resolution: '' }
  ],
  visitors: [
    { id: 'vst-4001', name: 'Manish Verma', phone: '+91 99112 23399', relation: 'Parent', studentId: 'std-1001', studentName: 'Aditya Verma', checkIn: '2026-07-06T10:15:00', checkOut: '2026-07-06T14:30:00', purpose: 'Deliver home-cooked food' },
    { id: 'vst-4002', name: 'Karan Shah', phone: '+91 98888 77777', relation: 'Friend', studentId: 'std-1006', studentName: 'Arjun Nair', checkIn: '2026-07-06T17:45:00', checkOut: null, purpose: 'Group study session' }
  ],
  staff: [
    { id: 'stf-5001', name: 'Vijay Rathi', role: 'Warden', phone: '+91 98222 33344', shift: 'Day', salary: 35000, status: 'Active' },
    { id: 'stf-5002', name: 'Sohan Lal', role: 'Security Guard', phone: '+91 98333 44455', shift: 'Night', salary: 18000, status: 'Active' },
    { id: 'stf-5003', name: 'Maya Bai', role: 'Housekeeper', phone: '+91 98444 55566', shift: 'Day', salary: 12000, status: 'Active' },
    { id: 'stf-5004', name: 'Vikram Rathore', role: 'Mess Manager', phone: '+91 98555 66677', shift: 'Day', salary: 25000, status: 'Active' },
    { id: 'stf-5005', name: 'Ramesh Pal', role: 'Electrician', phone: '+91 98666 77788', shift: 'Rotational', salary: 15000, status: 'On Leave' }
  ],
  attendance: [
    {
      date: '2026-07-05',
      records: {
        'std-1001': 'Present',
        'std-1002': 'Present',
        'std-1003': 'Absent',
        'std-1004': 'Present',
        'std-1005': 'Present',
        'std-1006': 'Present',
        'std-1007': 'Present',
        'std-1008': 'Present',
        'std-1009': 'Late'
      }
    },
    {
      date: '2026-07-06',
      records: {
        'std-1001': 'Present',
        'std-1002': 'Present',
        'std-1003': 'Present',
        'std-1004': 'Present',
        'std-1005': 'Present',
        'std-1006': 'Late',
        'std-1007': 'Present',
        'std-1008': 'Present',
        'std-1009': 'Present'
      }
    }
  ],
  notices: [
    { id: 'ntc-6001', title: 'Water Supply Maintenance', content: 'There will be a water supply interruption in Boys Hostel Alpha on July 8th from 10:00 AM to 02:00 PM due to overhead tank cleaning. Please plan accordingly.', date: '2026-07-05', category: 'Maintenance', postedBy: 'Chief Warden' },
    { id: 'ntc-6002', title: 'Mess Committee Meeting', content: 'A student mess committee meeting is scheduled for July 7th at 05:00 PM in the Common Hall to discuss the new menu options for the monsoon season.', date: '2026-07-06', category: 'Event', postedBy: 'Mess Warden' },
    { id: 'ntc-6003', title: 'Late Entry Rules Enforcement', content: 'Strict action will be taken against students arriving after 09:30 PM without prior permission from the Warden. Parents will be notified for repeated offenses.', date: '2026-07-04', category: 'Urgent', postedBy: 'Administration' }
  ],
  activities: [
    { id: 'act-1', module: 'System', action: 'Initialized', detail: 'Hostel Management Database set up with default mock records.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
  ]
};

// Activity logging helper
function logActivityLocal(module, action, detail) {
  const timestamp = new Date().toISOString();
  FALLBACK_DB.activities.unshift({
    id: 'act-' + Date.now(),
    module,
    action,
    detail,
    timestamp
  });
  if (FALLBACK_DB.activities.length > 30) FALLBACK_DB.activities.pop();
}

async function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder_user')) {
    console.warn('\n⚠️  No valid DATABASE_URL found in .env. Falling back to In-Memory LocalStorage simulation database.\n');
    useDbFallback = true;
    return;
  }
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL / Neon database successfully.');
  } catch (err) {
    console.warn('\n⚠️  Failed to connect to PostgreSQL database. Server will fall back to In-Memory LocalStorage simulation database.\nDetails:', err.message);
    useDbFallback = true;
  }
}

// ==========================================
// 1. AUTHENTICATION CONTROLLERS
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (useDbFallback) {
    const user = FALLBACK_DB.users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    return res.json({ success: true, user });
  }
  
  try {
    const user = await prisma.user.findFirst({
      where: { email, password }
    });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  
  if (useDbFallback) {
    const exists = FALLBACK_DB.users.find(u => u.email === email);
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    
    const newUser = { email, password, name, role };
    FALLBACK_DB.users.push(newUser);
    
    // Auto register a student profile if user role is student
    if (role === 'STUDENT') {
      const studentId = 'std-' + Math.floor(1000 + Math.random() * 9000);
      FALLBACK_DB.students.push({
        id: studentId,
        name,
        email,
        phone: '+91 99999 99999',
        gender: 'Male',
        collegeId: 'COLL-' + Math.floor(1000 + Math.random() * 9000),
        hostelId: null,
        roomId: null,
        bedNo: null,
        status: 'Active',
        parentName: 'Parent of ' + name,
        parentPhone: '+91 99999 99999',
        feeStatus: 'Pending'
      });
    }
    
    return res.json({ success: true, user: newUser });
  }
  
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    
    const user = await prisma.user.create({
      data: { email, password, name, role }
    });
    
    // Create matching student profile if student
    if (role === 'STUDENT') {
      const studentId = 'std-' + Math.floor(1000 + Math.random() * 9000);
      await prisma.student.create({
        data: {
          id: studentId,
          name,
          email,
          phone: '+91 99999 99999',
          gender: 'Male',
          collegeId: 'COLL-' + Math.floor(1000 + Math.random() * 9000),
          status: 'Active',
          parentName: 'Parent of ' + name,
          parentPhone: '+91 99999 99999',
          feeStatus: 'Pending'
        }
      });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. STUDENTS CONTROLLERS
// ==========================================
app.get('/api/students', async (req, res) => {
  if (useDbFallback) {
    return res.json(FALLBACK_DB.students);
  }
  try {
    const list = await prisma.student.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  const data = req.body;
  if (useDbFallback) {
    const exists = FALLBACK_DB.students.find(s => s.collegeId === data.collegeId);
    if (exists) return res.status(400).json({ error: 'College ID already exists' });
    
    const id = data.id || 'std-' + Math.floor(1000 + Math.random() * 9000);
    const newStudent = { id, ...data };
    FALLBACK_DB.students.unshift(newStudent);
    logActivityLocal('Students', 'Created Profile', `Created resident profile for "${data.name}".`);
    return res.json(newStudent);
  }
  
  try {
    const student = await prisma.student.create({ data });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Students',
        action: 'Created Profile',
        detail: `Created resident profile for "${data.name}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  if (useDbFallback) {
    const idx = FALLBACK_DB.students.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Student not found' });
    FALLBACK_DB.students[idx] = { ...FALLBACK_DB.students[idx], ...data };
    logActivityLocal('Students', 'Updated Profile', `Updated student profile information of "${data.name}".`);
    return res.json(FALLBACK_DB.students[idx]);
  }
  
  try {
    const student = await prisma.student.update({
      where: { id },
      data
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Students',
        action: 'Updated Profile',
        detail: `Updated student profile information of "${data.name}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  
  if (useDbFallback) {
    const student = FALLBACK_DB.students.find(s => s.id === id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    FALLBACK_DB.students = FALLBACK_DB.students.filter(s => s.id !== id);
    logActivityLocal('Students', 'Deleted Profile', `Deleted profile of student "${student.name}" and released allocations.`);
    return res.json({ success: true });
  }
  
  try {
    const student = await prisma.student.findUnique({ where: { id } });
    await prisma.student.delete({ where: { id } });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Students',
        action: 'Deleted Profile',
        detail: `Deleted profile of student "${student ? student.name : 'Unknown'}" and released allocations.`,
        timestamp: new Date().toISOString()
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. HOSTELS CONTROLLERS
// ==========================================
app.get('/api/hostels', async (req, res) => {
  if (useDbFallback) return res.json(FALLBACK_DB.hostels);
  try {
    const list = await prisma.hostel.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hostels', async (req, res) => {
  const data = req.body;
  if (useDbFallback) {
    const id = data.id || 'hostel-' + String.fromCharCode(97 + FALLBACK_DB.hostels.length);
    const newHostel = { id, ...data };
    FALLBACK_DB.hostels.push(newHostel);
    logActivityLocal('Hostel Wings', 'Added Wing', `Created hostel wing "${data.name}" with Warden ${data.warden}.`);
    return res.json(newHostel);
  }
  try {
    const hostel = await prisma.hostel.create({ data });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Hostel Wings',
        action: 'Added Wing',
        detail: `Created hostel wing "${data.name}" with Warden ${data.warden}.`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(hostel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/hostels/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (useDbFallback) {
    const idx = FALLBACK_DB.hostels.findIndex(h => h.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Hostel not found' });
    FALLBACK_DB.hostels[idx] = { ...FALLBACK_DB.hostels[idx], ...data };
    logActivityLocal('Hostel Wings', 'Updated configuration', `Updated wing parameters for "${data.name}".`);
    return res.json(FALLBACK_DB.hostels[idx]);
  }
  try {
    const hostel = await prisma.hostel.update({
      where: { id },
      data
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Hostel Wings',
        action: 'Updated configuration',
        detail: `Updated wing parameters for "${data.name}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(hostel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/hostels/:id', async (req, res) => {
  const { id } = req.params;
  if (useDbFallback) {
    const hostel = FALLBACK_DB.hostels.find(h => h.id === id);
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    
    FALLBACK_DB.hostels = FALLBACK_DB.hostels.filter(h => h.id !== id);
    FALLBACK_DB.rooms = FALLBACK_DB.rooms.filter(r => r.hostelId !== id);
    FALLBACK_DB.students.forEach(s => {
      if (s.hostelId === id) {
        s.hostelId = null;
        s.roomId = null;
        s.bedNo = null;
      }
    });
    
    logActivityLocal('Hostel Wings', 'Deleted Hostel Wing', `Deleted hostel wing "${hostel.name}".`);
    return res.json({ success: true });
  }
  try {
    const hostel = await prisma.hostel.findUnique({ where: { id } });
    await prisma.hostel.delete({ where: { id } });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Hostel Wings',
        action: 'Deleted Hostel Wing',
        detail: `Deleted hostel wing "${hostel ? hostel.name : 'Unknown'}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ROOMS CONTROLLERS
// ==========================================
app.get('/api/rooms', async (req, res) => {
  if (useDbFallback) return res.json(FALLBACK_DB.rooms);
  try {
    const list = await prisma.room.findMany({
      orderBy: { roomNumber: 'asc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  const data = req.body;
  if (useDbFallback) {
    const exists = FALLBACK_DB.rooms.find(r => r.hostelId === data.hostelId && r.roomNumber === data.roomNumber);
    if (exists) return res.status(400).json({ error: 'Room number already exists' });
    
    const id = data.id || `r-${data.hostelId.split('-')[1]}-${data.roomNumber}`;
    const newRoom = { id, ...data };
    FALLBACK_DB.rooms.unshift(newRoom);
    logActivityLocal('Rooms', 'Created Room configuration', `Added Room ${data.roomNumber} in Hostel.`);
    return res.json(newRoom);
  }
  try {
    const room = await prisma.room.create({ data });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Rooms',
        action: 'Created Room configuration',
        detail: `Added Room ${data.roomNumber} to Hostel.`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (useDbFallback) {
    const idx = FALLBACK_DB.rooms.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Room not found' });
    FALLBACK_DB.rooms[idx] = { ...FALLBACK_DB.rooms[idx], ...data };
    logActivityLocal('Rooms', 'Updated Room Status', `Updated room status of Room ${FALLBACK_DB.rooms[idx].roomNumber}.`);
    return res.json(FALLBACK_DB.rooms[idx]);
  }
  try {
    const room = await prisma.room.update({
      where: { id },
      data
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Rooms',
        action: 'Updated Room Status',
        detail: `Updated room status of Room ${room.roomNumber} to ${room.status}.`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. ALLOCATION CONTROLLER
// ==========================================
app.post('/api/allocations', async (req, res) => {
  const { studentId, hostelId, roomId, bedNo } = req.body;
  
  if (useDbFallback) {
    const s = FALLBACK_DB.students.find(x => x.id === studentId);
    if (!s) return res.status(404).json({ error: 'Student not found' });
    
    s.hostelId = hostelId;
    s.roomId = roomId;
    s.bedNo = bedNo;
    
    const rNum = FALLBACK_DB.rooms.find(x => x.id === roomId)?.roomNumber || '';
    const hName = FALLBACK_DB.hostels.find(x => x.id === hostelId)?.name || '';
    
    logActivityLocal('Bed Allocation', 'Allocated Bed', `Allocated student "${s.name}" to Room ${rNum} Bed ${bedNo} in ${hName}.`);
    return res.json(s);
  }
  
  try {
    const student = await prisma.student.update({
      where: { id: studentId },
      data: { hostelId, roomId, bedNo }
    });
    
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
    
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Bed Allocation',
        action: 'Allocated Bed',
        detail: `Allocated student "${student.name}" to Room ${room ? room.roomNumber : ''} Bed ${bedNo} in ${hostel ? hostel.name : ''}.`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/allocations/:studentId', async (req, res) => {
  const { studentId } = req.params;
  
  if (useDbFallback) {
    const s = FALLBACK_DB.students.find(x => x.id === studentId);
    if (!s) return res.status(404).json({ error: 'Student not found' });
    
    logActivityLocal('Bed Allocation', 'Released Allocation', `Released Room ${s.roomId} Bed ${s.bedNo} occupied by student "${s.name}".`);
    s.hostelId = null;
    s.roomId = null;
    s.bedNo = null;
    
    return res.json({ success: true });
  }
  
  try {
    const s = await prisma.student.findUnique({ where: { id: studentId } });
    await prisma.student.update({
      where: { id: studentId },
      data: { hostelId: null, roomId: null, bedNo: null }
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Bed Allocation',
        action: 'Released Allocation',
        detail: `Released Room ${s ? s.roomId : ''} Bed ${s ? s.bedNo : ''} occupied by student "${s ? s.name : ''}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. FEES LEDGER CONTROLLERS
// ==========================================
app.get('/api/fees', async (req, res) => {
  if (useDbFallback) return res.json(FALLBACK_DB.fees);
  try {
    const list = await prisma.fee.findMany({
      orderBy: { dueDate: 'desc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fees/collect/:id', async (req, res) => {
  const { id } = req.params;
  const paidDate = new Date().toISOString().split('T')[0];
  
  if (useDbFallback) {
    const fee = FALLBACK_DB.fees.find(f => f.id === id);
    if (!fee) return res.status(404).json({ error: 'Invoice not found' });
    
    fee.status = 'Paid';
    fee.paidDate = paidDate;
    
    const student = FALLBACK_DB.students.find(s => s.id === fee.studentId);
    if (student) student.feeStatus = 'Paid';
    
    logActivityLocal('Fees', 'Payment Collected', `Payment collected for invoice ${fee.id} (Amount: ₹${fee.amount}) from ${student ? student.name : 'Resident'}.`);
    return res.json(fee);
  }
  
  try {
    const fee = await prisma.fee.update({
      where: { id },
      data: { status: 'Paid', paidDate }
    });
    const s = await prisma.student.update({
      where: { id: fee.studentId },
      data: { feeStatus: 'Paid' }
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Fees',
        action: 'Payment Collected',
        detail: `Payment collected for invoice ${fee.id} (Amount: ₹${fee.amount}) from ${s.name}.`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(fee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fees/generate', async (req, res) => {
  const currentMonthStr = 'July 2026';
  const term = `${currentMonthStr} Room Rent`;
  
  if (useDbFallback) {
    let count = 0;
    FALLBACK_DB.students.filter(s => s.roomId !== null && s.status === 'Active').forEach(student => {
      const exists = FALLBACK_DB.fees.find(f => f.studentId === student.id && f.term.includes(currentMonthStr));
      if (!exists) {
        const room = FALLBACK_DB.rooms.find(r => r.id === student.roomId);
        if (room) {
          FALLBACK_DB.fees.unshift({
            id: 'inv-' + Math.floor(1000 + Math.random() * 9000),
            studentId: student.id,
            amount: room.rent,
            dueDate: new Date().toISOString().split('T')[0],
            paidDate: null,
            status: student.feeStatus === 'Paid' ? 'Paid' : 'Pending',
            term: term
          });
          count++;
        }
      }
    });
    if (count > 0) logActivityLocal('Fees', 'Auto-Generated Ledger', `Auto-generated monthly room billing for ${count} residents.`);
    return res.json({ count });
  }
  
  try {
    const students = await prisma.student.findMany({
      where: { roomId: { not: null }, status: 'Active' },
      include: { room: true }
    });
    
    let count = 0;
    for (const student of students) {
      const exists = await prisma.fee.findFirst({
        where: { studentId: student.id, term: { contains: currentMonthStr } }
      });
      
      if (!exists && student.room) {
        await prisma.fee.create({
          data: {
            id: 'inv-' + Math.floor(1000 + Math.random() * 9000),
            studentId: student.id,
            amount: student.room.rent,
            dueDate: new Date().toISOString().split('T')[0],
            status: student.feeStatus === 'Paid' ? 'Paid' : 'Pending',
            term: term
          }
        });
        count++;
      }
    }
    if (count > 0) {
      await prisma.activity.create({
        data: {
          id: 'act-' + Date.now(),
          module: 'Fees',
          action: 'Auto-Generated Ledger',
          detail: `Auto-generated monthly room billing for ${count} residents.`,
          timestamp: new Date().toISOString()
        }
      });
    }
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. COMPLAINTS TICKETS CONTROLLERS
// ==========================================
app.get('/api/complaints', async (req, res) => {
  if (useDbFallback) return res.json(FALLBACK_DB.complaints);
  try {
    const list = await prisma.complaint.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/complaints', async (req, res) => {
  const data = req.body;
  if (useDbFallback) {
    const student = FALLBACK_DB.students.find(s => s.id === data.studentId);
    const id = 'cmp-' + Math.floor(1000 + Math.random() * 9000);
    const newComplaint = {
      id,
      studentId: data.studentId,
      studentName: student ? student.name : 'Resident',
      title: data.title,
      category: data.category,
      description: data.description,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      resolution: ''
    };
    FALLBACK_DB.complaints.unshift(newComplaint);
    logActivityLocal('Complaints', 'Filed Maintenance Ticket', `Ticket "${data.title}" filed by resident.`);
    return res.json(newComplaint);
  }
  
  try {
    const s = await prisma.student.findUnique({ where: { id: data.studentId } });
    const comp = await prisma.complaint.create({
      data: {
        id: 'cmp-' + Math.floor(1000 + Math.random() * 9000),
        studentId: data.studentId,
        studentName: s ? s.name : 'Resident',
        title: data.title,
        category: data.category,
        description: data.description,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending'
      }
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Complaints',
        action: 'Filed Maintenance Ticket',
        detail: `Ticket "${data.title}" filed by resident.`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;
  const { status, resolution } = req.body;
  
  if (useDbFallback) {
    const c = FALLBACK_DB.complaints.find(x => x.id === id);
    if (!c) return res.status(404).json({ error: 'Complaint not found' });
    
    c.status = status;
    c.resolution = resolution;
    logActivityLocal('Complaints', 'Updated Ticket Status', `Complaint ticket "${c.title}" updated to status "${status}".`);
    return res.json(c);
  }
  
  try {
    const comp = await prisma.complaint.update({
      where: { id },
      data: { status, resolution }
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Complaints',
        action: 'Updated Ticket Status',
        detail: `Complaint ticket "${comp.title}" updated to status "${status}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(comp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. VISITORS REGISTRY CONTROLLERS
// ==========================================
app.get('/api/visitors', async (req, res) => {
  if (useDbFallback) return res.json(FALLBACK_DB.visitors);
  try {
    const list = await prisma.visitor.findMany({
      orderBy: { checkIn: 'desc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visitors', async (req, res) => {
  const data = req.body;
  if (useDbFallback) {
    const student = FALLBACK_DB.students.find(s => s.id === data.studentId);
    const newVisitor = {
      id: 'vst-' + Math.floor(1000 + Math.random() * 9000),
      name: data.name,
      phone: data.phone,
      relation: data.relation,
      studentId: data.studentId,
      studentName: student ? student.name : 'Resident',
      checkIn: new Date().toISOString(),
      checkOut: null,
      purpose: data.purpose
    };
    FALLBACK_DB.visitors.unshift(newVisitor);
    logActivityLocal('Visitor registry', 'Guest Checked-in', `Visitor "${data.name}" logged.`);
    return res.json(newVisitor);
  }
  
  try {
    const s = await prisma.student.findUnique({ where: { id: data.studentId } });
    const visitor = await prisma.visitor.create({
      data: {
        id: 'vst-' + Math.floor(1000 + Math.random() * 9000),
        name: data.name,
        phone: data.phone,
        relation: data.relation,
        studentId: data.studentId,
        studentName: s ? s.name : 'Resident',
        checkIn: new Date().toISOString(),
        purpose: data.purpose
      }
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Visitor registry',
        action: 'Guest Checked-in',
        detail: `Visitor "${data.name}" logged.`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visitors/checkout/:id', async (req, res) => {
  const { id } = req.params;
  const checkOut = new Date().toISOString();
  
  if (useDbFallback) {
    const v = FALLBACK_DB.visitors.find(x => x.id === id);
    if (!v) return res.status(404).json({ error: 'Visitor not found' });
    v.checkOut = checkOut;
    logActivityLocal('Visitor registry', 'Guest Checked-out', `Visitor "${v.name}" checked out.`);
    return res.json(v);
  }
  
  try {
    const v = await prisma.visitor.update({
      where: { id },
      data: { checkOut }
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Visitor registry',
        action: 'Guest Checked-out',
        detail: `Visitor "${v.name}" checked out.`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(v);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. STAFF DIRECTORY CONTROLLERS
// ==========================================
app.get('/api/staff', async (req, res) => {
  if (useDbFallback) return res.json(FALLBACK_DB.staff);
  try {
    const list = await prisma.staff.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  const data = req.body;
  if (useDbFallback) {
    const id = 'stf-' + Math.floor(1000 + Math.random() * 9000);
    const newStaff = { id, ...data };
    FALLBACK_DB.staff.push(newStaff);
    logActivityLocal('Staff directory', 'Added Staff profile', `Created staff profile for "${data.name}".`);
    return res.json(newStaff);
  }
  try {
    const staff = await prisma.staff.create({
      data: {
        id: 'stf-' + Math.floor(1000 + Math.random() * 9000),
        ...data
      }
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Staff directory',
        action: 'Added Staff profile',
        detail: `Created staff profile for "${data.name}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (useDbFallback) {
    const idx = FALLBACK_DB.staff.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Staff not found' });
    FALLBACK_DB.staff[idx] = { ...FALLBACK_DB.staff[idx], ...data };
    logActivityLocal('Staff directory', 'Updated Staff profile', `Updated staff details for "${data.name}".`);
    return res.json(FALLBACK_DB.staff[idx]);
  }
  try {
    const staff = await prisma.staff.update({ where: { id }, data });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  if (useDbFallback) {
    const s = FALLBACK_DB.staff.find(x => x.id === id);
    FALLBACK_DB.staff = FALLBACK_DB.staff.filter(x => x.id !== id);
    if (s) logActivityLocal('Staff directory', 'Removed Staff profile', `Removed staff profile for "${s.name}".`);
    return res.json({ success: true });
  }
  try {
    const s = await prisma.staff.findUnique({ where: { id } });
    await prisma.staff.delete({ where: { id } });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Staff directory',
        action: 'Removed Staff profile',
        detail: `Removed staff profile for "${s ? s.name : 'Unknown'}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. ATTENDANCE REGISTER CONTROLLERS
// ==========================================
app.get('/api/attendance/:date', async (req, res) => {
  const { date } = req.params;
  
  if (useDbFallback) {
    const record = FALLBACK_DB.attendance.find(a => a.date === date);
    return res.json(record || { date, records: {} });
  }
  
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { date },
      include: { records: true }
    });
    
    if (!attendance) {
      return res.json({ date, records: {} });
    }
    
    const recordsMap = {};
    attendance.records.forEach(r => {
      recordsMap[r.studentId] = r.status;
    });
    
    res.json({ date, records: recordsMap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { date, records } = req.body;
  
  if (useDbFallback) {
    let day = FALLBACK_DB.attendance.find(a => a.date === date);
    if (!day) {
      day = { date, records: {} };
      FALLBACK_DB.attendance.push(day);
    }
    day.records = records;
    logActivityLocal('Attendance register', 'Logged Daily Attendance', `Daily attendance roster submitted for date "${date}".`);
    return res.json(day);
  }
  
  try {
    // Upsert parent record
    const attendance = await prisma.attendance.upsert({
      where: { date },
      update: {},
      create: { date }
    });
    
    // Clear and create children
    await prisma.attendanceRecord.deleteMany({
      where: { attendanceId: attendance.id }
    });
    
    const dataList = Object.keys(records).map(studentId => ({
      attendanceId: attendance.id,
      studentId,
      status: records[studentId]
    }));
    
    if (dataList.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: dataList
      });
    }
    
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Attendance register',
        action: 'Logged Daily Attendance',
        detail: `Daily attendance roster submitted for date "${date}".`,
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. ANNOUNCEMENTS / NOTICE BOARD
// ==========================================
app.get('/api/notices', async (req, res) => {
  if (useDbFallback) return res.json(FALLBACK_DB.notices);
  try {
    const list = await prisma.notice.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notices', async (req, res) => {
  const data = req.body;
  if (useDbFallback) {
    const id = 'ntc-' + Math.floor(1000 + Math.random() * 9000);
    const notice = {
      id,
      title: data.title,
      content: data.content,
      category: data.category,
      date: new Date().toISOString().split('T')[0],
      postedBy: data.postedBy
    };
    FALLBACK_DB.notices.unshift(notice);
    logActivityLocal('Announcements', 'Published notice', `New notice: "${data.title}".`);
    return res.json(notice);
  }
  
  try {
    const notice = await prisma.notice.create({
      data: {
        id: 'ntc-' + Math.floor(1000 + Math.random() * 9000),
        title: data.title,
        content: data.content,
        category: data.category,
        date: new Date().toISOString().split('T')[0],
        postedBy: data.postedBy
      }
    });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Announcements',
        action: 'Published notice',
        detail: `New notice: "${data.title}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json(notice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notices/:id', async (req, res) => {
  const { id } = req.params;
  if (useDbFallback) {
    const notice = FALLBACK_DB.notices.find(n => n.id === id);
    FALLBACK_DB.notices = FALLBACK_DB.notices.filter(n => n.id !== id);
    if (notice) logActivityLocal('Announcements', 'Removed Announcement', `Removed notice: "${notice.title}".`);
    return res.json({ success: true });
  }
  try {
    const notice = await prisma.notice.findUnique({ where: { id } });
    await prisma.notice.delete({ where: { id } });
    await prisma.activity.create({
      data: {
        id: 'act-' + Date.now(),
        module: 'Announcements',
        action: 'Removed Announcement',
        detail: `Removed notice: "${notice ? notice.title : 'Unknown'}".`,
        timestamp: new Date().toISOString()
      }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. LOGGED ACTIONS & REPORT ANALYTICS
// ==========================================
app.get('/api/activities', async (req, res) => {
  if (useDbFallback) return res.json(FALLBACK_DB.activities);
  try {
    const list = await prisma.activity.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/system/reset', async (req, res) => {
  if (useDbFallback) {
    // Reset fallback database state
    FALLBACK_DB.users = [
      { email: 'admin@aegis.com', password: 'password123', name: 'Admin User', role: 'ADMIN' },
      { email: 'warden@aegis.com', password: 'password123', name: 'Dr. Sunita Deshmukh', role: 'WARDEN' },
      { email: 'student@aegis.com', password: 'password123', name: 'Aditya Verma', role: 'STUDENT' }
    ];
    FALLBACK_DB.hostels = [
      { id: 'hostel-a', name: 'Boys Hostel Alpha', type: 'Boys', floors: 3, capacity: 60, warden: 'Mr. Rajesh Sharma', contact: '+91 98765 43210' },
      { id: 'hostel-b', name: 'Girls Hostel Beta', type: 'Girls', floors: 3, capacity: 60, warden: 'Dr. Sunita Deshmukh', contact: '+91 98765 43211' },
      { id: 'hostel-c', name: 'PG Wing Gamma', type: 'Co-ed', floors: 2, capacity: 20, warden: 'Mr. Arvind Gupta', contact: '+91 98765 43212' }
    ];
    FALLBACK_DB.rooms = [
      { id: 'r-a-101', hostelId: 'hostel-a', roomNumber: '101', floor: 1, type: 'Single', rent: 6000, status: 'Available', beds: 1 },
      { id: 'r-a-102', hostelId: 'hostel-a', roomNumber: '102', floor: 1, type: 'Double', rent: 4500, status: 'Available', beds: 2 },
      { id: 'r-a-103', hostelId: 'hostel-a', roomNumber: '103', floor: 1, type: 'Triple', rent: 3000, status: 'Available', beds: 3 },
      { id: 'r-a-201', hostelId: 'hostel-a', roomNumber: '201', floor: 2, type: 'Single', rent: 6000, status: 'Available', beds: 1 },
      { id: 'r-a-202', hostelId: 'hostel-a', roomNumber: '202', floor: 2, type: 'Double', rent: 4500, status: 'Maintenance', beds: 2 },
      { id: 'r-a-301', hostelId: 'hostel-a', roomNumber: '301', floor: 3, type: 'Double', rent: 4500, status: 'Available', beds: 2 },
      { id: 'r-b-101', hostelId: 'hostel-b', roomNumber: '101', floor: 1, type: 'Single', rent: 6500, status: 'Available', beds: 1 },
      { id: 'r-b-102', hostelId: 'hostel-b', roomNumber: '102', floor: 1, type: 'Double', rent: 4800, status: 'Available', beds: 2 },
      { id: 'r-b-103', hostelId: 'hostel-b', roomNumber: '103', floor: 1, type: 'Triple', rent: 3200, status: 'Available', beds: 3 },
      { id: 'r-b-201', hostelId: 'hostel-b', roomNumber: '201', floor: 2, type: 'Double', rent: 4800, status: 'Available', beds: 2 },
      { id: 'r-c-101', hostelId: 'hostel-c', roomNumber: '101', floor: 1, type: 'Single', rent: 8000, status: 'Available', beds: 1 },
      { id: 'r-c-102', hostelId: 'hostel-c', roomNumber: '102', floor: 1, type: 'Double', rent: 5500, status: 'Available', beds: 2 }
    ];
    FALLBACK_DB.students = [
      { id: 'std-1001', name: 'Aditya Verma', email: 'aditya.verma@example.com', phone: '+91 99112 23344', gender: 'Male', collegeId: 'CS23B1002', hostelId: 'hostel-a', roomId: 'r-a-103', bedNo: 1, status: 'Active', parentName: 'Ramesh Verma', parentPhone: '+91 99112 23300', feeStatus: 'Paid' },
      { id: 'std-1002', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', phone: '+91 99223 34455', gender: 'Male', collegeId: 'EE23B2015', hostelId: 'hostel-a', roomId: 'r-a-103', bedNo: 2, status: 'Active', parentName: 'Anil Mehta', parentPhone: '+91 99223 34400', feeStatus: 'Pending' },
      { id: 'std-1003', name: 'Kabir Singh', email: 'kabir.singh@example.com', phone: '+91 99334 45566', gender: 'Male', collegeId: 'ME22B3020', hostelId: 'hostel-a', roomId: 'r-a-103', bedNo: 3, status: 'Active', parentName: 'Jaswant Singh', parentPhone: '+91 99334 45500', feeStatus: 'Overdue' },
      { id: 'std-1004', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '+91 99445 56677', gender: 'Female', collegeId: 'EC23B4009', hostelId: 'hostel-b', roomId: 'r-b-101', bedNo: 1, status: 'Active', parentName: 'Srinivasan Iyer', parentPhone: '+91 99445 56600', feeStatus: 'Paid' },
      { id: 'std-1005', name: 'Sneha Patel', email: 'sneha.patel@example.com', phone: '+91 99556 67788', gender: 'Female', collegeId: 'CS22B1045', hostelId: 'hostel-b', roomId: 'r-b-102', bedNo: 1, status: 'Active', parentName: 'Vijay Patel', parentPhone: '+91 99556 67700', feeStatus: 'Paid' },
      { id: 'std-1006', name: 'Arjun Nair', email: 'arjun.nair@example.com', phone: '+91 99667 78899', gender: 'Male', collegeId: 'CE23B5011', hostelId: 'hostel-a', roomId: 'r-a-102', bedNo: 1, status: 'Active', parentName: 'Madhavan Nair', parentPhone: '+91 99667 78800', feeStatus: 'Pending' },
      { id: 'std-1007', name: 'Divya Sharma', email: 'divya.sharma@example.com', phone: '+91 99778 89900', gender: 'Female', collegeId: 'IT23B6022', hostelId: 'hostel-b', roomId: 'r-b-103', bedNo: 1, status: 'Active', parentName: 'Prakash Sharma', parentPhone: '+91 99778 89901', feeStatus: 'Paid' },
      { id: 'std-1008', name: 'Vikram Malhotra', email: 'vikram.malhotra@example.com', phone: '+91 99889 90011', gender: 'Male', collegeId: 'CH22B7005', hostelId: 'hostel-c', roomId: 'r-c-102', bedNo: 1, status: 'Active', parentName: 'Sanjay Malhotra', parentPhone: '+91 99889 90000', feeStatus: 'Paid' },
      { id: 'std-1009', name: 'Priya Sen', email: 'priya.sen@example.com', phone: '+91 99990 01122', gender: 'Female', collegeId: 'CS24M1001', hostelId: 'hostel-c', roomId: 'r-c-102', bedNo: 2, status: 'Active', parentName: 'Gaurav Sen', parentPhone: '+91 99990 01100', feeStatus: 'Pending' },
      { id: 'std-1010', name: 'Rahul Joshi', email: 'rahul.joshi@example.com', phone: '+91 99001 12233', gender: 'Male', collegeId: 'EE22B2050', hostelId: null, roomId: null, bedNo: null, status: 'Active', parentName: 'Satish Joshi', parentPhone: '+91 99001 12200', feeStatus: 'Pending' }
    ];
    FALLBACK_DB.fees = [
      { id: 'inv-2001', studentId: 'std-1001', amount: 6000, dueDate: '2026-07-05', paidDate: '2026-07-02', status: 'Paid', term: 'July 2026 Room Rent' },
      { id: 'inv-2002', studentId: 'std-1002', amount: 3000, dueDate: '2026-07-05', paidDate: null, status: 'Pending', term: 'July 2026 Room Rent' },
      { id: 'inv-2003', studentId: 'std-1003', amount: 3000, dueDate: '2026-06-05', paidDate: null, status: 'Overdue', term: 'June 2026 Room Rent' },
      { id: 'inv-2004', studentId: 'std-1004', amount: 6500, dueDate: '2026-07-05', paidDate: '2026-07-01', status: 'Paid', term: 'July 2026 Room Rent' },
      { id: 'inv-2005', studentId: 'std-1005', amount: 4800, dueDate: '2026-07-05', paidDate: '2026-07-04', status: 'Paid', term: 'July 2026 Room Rent' },
      { id: 'inv-2006', studentId: 'std-1006', amount: 4500, dueDate: '2026-07-05', paidDate: null, status: 'Pending', term: 'July 2026 Room Rent' },
      { id: 'inv-2007', studentId: 'std-1007', amount: 3200, dueDate: '2026-07-05', paidDate: '2026-07-03', status: 'Paid', term: 'July 2026 Room Rent' },
      { id: 'inv-2008', studentId: 'std-1008', amount: 5500, dueDate: '2026-07-05', paidDate: '2026-07-01', status: 'Paid', term: 'July 2026 Room Rent' },
      { id: 'inv-2009', studentId: 'std-1009', amount: 5500, dueDate: '2026-07-05', paidDate: null, status: 'Pending', term: 'July 2026 Room Rent' }
    ];
    FALLBACK_DB.complaints = [
      { id: 'cmp-3001', studentId: 'std-1002', studentName: 'Rohan Mehta', title: 'Ceiling Fan Making Noise', category: 'Electrical', description: 'The regulator is not working, and the fan makes a squeaking sound at speed 4.', date: '2026-07-04', status: 'Pending', resolution: '' },
      { id: 'cmp-3002', studentId: 'std-1003', studentName: 'Kabir Singh', title: 'Tap Leakage in Washroom', category: 'Plumbing', description: 'The washroom faucet is continuously dripping, causing water wastage.', date: '2026-07-05', status: 'In Progress', resolution: 'Plumber assigned, waiting for spare parts.' },
      { id: 'cmp-3003', studentId: 'std-1004', studentName: 'Ananya Iyer', title: 'WiFi Connection Dropping', category: 'Internet', description: 'Strong signal but frequently drops connection on floor 1 wing B.', date: '2026-07-03', status: 'Resolved', resolution: 'Access point rebooted and firmware updated.' },
      { id: 'cmp-3004', studentId: 'std-1005', studentName: 'Sneha Patel', title: 'Room Cleaning Service Delayed', category: 'Cleaning', description: 'Housekeeper has not cleaned room 102 since 3 days.', date: '2026-07-06', status: 'Pending', resolution: '' }
    ];
    FALLBACK_DB.visitors = [
      { id: 'vst-4001', name: 'Manish Verma', phone: '+91 99112 23399', relation: 'Parent', studentId: 'std-1001', studentName: 'Aditya Verma', checkIn: '2026-07-06T10:15:00', checkOut: '2026-07-06T14:30:00', purpose: 'Deliver home-cooked food' },
      { id: 'vst-4002', name: 'Karan Shah', phone: '+91 98888 77777', relation: 'Friend', studentId: 'std-1006', studentName: 'Arjun Nair', checkIn: '2026-07-06T17:45:00', checkOut: null, purpose: 'Group study session' }
    ];
    FALLBACK_DB.staff = [
      { id: 'stf-5001', name: 'Vijay Rathi', role: 'Warden', phone: '+91 98222 33344', shift: 'Day', salary: 35000, status: 'Active' },
      { id: 'stf-5002', name: 'Sohan Lal', role: 'Security Guard', phone: '+91 98333 44455', shift: 'Night', salary: 18000, status: 'Active' },
      { id: 'stf-5003', name: 'Maya Bai', role: 'Housekeeper', phone: '+91 98444 55566', shift: 'Day', salary: 12000, status: 'Active' },
      { id: 'stf-5004', name: 'Vikram Rathore', role: 'Mess Manager', phone: '+91 98555 66677', shift: 'Day', salary: 25000, status: 'Active' },
      { id: 'stf-5005', name: 'Ramesh Pal', role: 'Electrician', phone: '+91 98666 77788', shift: 'Rotational', salary: 15000, status: 'On Leave' }
    ];
    FALLBACK_DB.attendance = [
      {
        date: '2026-07-05',
        records: {
          'std-1001': 'Present',
          'std-1002': 'Present',
          'std-1003': 'Absent',
          'std-1004': 'Present',
          'std-1005': 'Present',
          'std-1006': 'Present',
          'std-1007': 'Present',
          'std-1008': 'Present',
          'std-1009': 'Late'
        }
      },
      {
        date: '2026-07-06',
        records: {
          'std-1001': 'Present',
          'std-1002': 'Present',
          'std-1003': 'Present',
          'std-1004': 'Present',
          'std-1005': 'Present',
          'std-1006': 'Late',
          'std-1007': 'Present',
          'std-1008': 'Present',
          'std-1009': 'Present'
        }
      }
    ];
    FALLBACK_DB.notices = [
      { id: 'ntc-6001', title: 'Water Supply Maintenance', content: 'There will be a water supply interruption in Boys Hostel Alpha on July 8th from 10:00 AM to 02:00 PM due to overhead tank cleaning. Please plan accordingly.', date: '2026-07-05', category: 'Maintenance', postedBy: 'Chief Warden' },
      { id: 'ntc-6002', title: 'Mess Committee Meeting', content: 'A student mess committee meeting is scheduled for July 7th at 05:00 PM in the Common Hall to discuss the new menu options for the monsoon season.', date: '2026-07-06', category: 'Event', postedBy: 'Mess Warden' },
      { id: 'ntc-6003', title: 'Late Entry Rules Enforcement', content: 'Strict action will be taken against students arriving after 09:30 PM without prior permission from the Warden. Parents will be notified for repeated offenses.', date: '2026-07-04', category: 'Urgent', postedBy: 'Administration' }
    ];
    FALLBACK_DB.activities = [
      { id: 'act-1', module: 'System', action: 'Initialized', detail: 'Hostel Management Database set up with default mock records.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
    ];
    return res.json({ success: true });
  }
  
  try {
    // Delete all records in transactional order
    await prisma.activity.deleteMany({});
    await prisma.notice.deleteMany({});
    await prisma.visitor.deleteMany({});
    await prisma.complaint.deleteMany({});
    await prisma.fee.deleteMany({});
    await prisma.attendanceRecord.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.hostel.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Trigger seeder script logic
    const { exec } = require('child_process');
    exec('node prisma/seed.js', (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'DB reset done but seeder failed.' });
      }
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Boot verification & start listening
app.listen(PORT, async () => {
  console.log(`\n🚀 Aegis Server running locally on http://127.0.0.1:${PORT}`);
  await checkDatabaseConnection();
});

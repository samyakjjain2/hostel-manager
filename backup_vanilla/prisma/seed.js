// prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_DATA = {
  users: [
    { email: 'admin@aegis.com', password: 'password123', name: 'Admin User', role: 'ADMIN' },
    { email: 'warden@aegis.com', password: 'password123', name: 'Dr. Sunita Deshmukh', role: 'WARDEN' },
    { email: 'student@aegis.com', password: 'password123', name: 'Aditya Verma', role: 'STUDENT' }
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
    { date: '2026-07-05' },
    { date: '2026-07-06' }
  ],
  attendanceRecords: [
    { attendanceDate: '2026-07-05', studentId: 'std-1001', status: 'Present' },
    { attendanceDate: '2026-07-05', studentId: 'std-1002', status: 'Present' },
    { attendanceDate: '2026-07-05', studentId: 'std-1003', status: 'Absent' },
    { attendanceDate: '2026-07-05', studentId: 'std-1004', status: 'Present' },
    { attendanceDate: '2026-07-05', studentId: 'std-1005', status: 'Present' },
    { attendanceDate: '2026-07-05', studentId: 'std-1006', status: 'Present' },
    { attendanceDate: '2026-07-05', studentId: 'std-1007', status: 'Present' },
    { attendanceDate: '2026-07-05', studentId: 'std-1008', status: 'Present' },
    { attendanceDate: '2026-07-05', studentId: 'std-1009', status: 'Late' },
    { attendanceDate: '2026-07-06', studentId: 'std-1001', status: 'Present' },
    { attendanceDate: '2026-07-06', studentId: 'std-1002', status: 'Present' },
    { attendanceDate: '2026-07-06', studentId: 'std-1003', status: 'Present' },
    { attendanceDate: '2026-07-06', studentId: 'std-1004', status: 'Present' },
    { attendanceDate: '2026-07-06', studentId: 'std-1005', status: 'Present' },
    { attendanceDate: '2026-07-06', studentId: 'std-1006', status: 'Late' },
    { attendanceDate: '2026-07-06', studentId: 'std-1007', status: 'Present' },
    { attendanceDate: '2026-07-06', studentId: 'std-1008', status: 'Present' },
    { attendanceDate: '2026-07-06', studentId: 'std-1009', status: 'Present' }
  ],
  notices: [
    { id: 'ntc-6001', title: 'Water Supply Maintenance', content: 'There will be a water supply interruption in Boys Hostel Alpha on July 8th from 10:00 AM to 02:00 PM due to overhead tank cleaning. Please plan accordingly.', date: '2026-07-05', category: 'Maintenance', postedBy: 'Chief Warden' },
    { id: 'ntc-6002', title: 'Mess Committee Meeting', content: 'A student mess committee meeting is scheduled for July 7th at 05:00 PM in the Common Hall to discuss the new menu options for the monsoon season.', date: '2026-07-06', category: 'Event', postedBy: 'Mess Warden' },
    { id: 'ntc-6003', title: 'Late Entry Rules Enforcement', content: 'Strict action will be taken against students arriving after 09:30 PM without prior permission from the Warden. Parents will be notified for repeated offenses.', date: '2026-07-04', category: 'Urgent', postedBy: 'Administration' }
  ],
  activities: [
    { id: 'act-1', module: 'System', action: 'Initialized', detail: 'Hostel Management Database set up with default mock records.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'act-2', module: 'Bed Allocation', action: 'Allocated', detail: 'Student Sneha Patel allocated to Room 102 Bed 1 in Girls Hostel Beta.', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'act-3', module: 'Complaint', action: 'Resolved', detail: 'Complaint cmp-3003 ("WiFi Connection Dropping") resolved by admin.', timestamp: new Date(Date.now() - 1800000).toISOString() }
  ]
};

async function main() {
  console.log('Seeding database with default values...');
  
  // Seed Users
  for (const user of DEFAULT_DATA.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
  
  // Seed Hostels
  for (const hostel of DEFAULT_DATA.hostels) {
    await prisma.hostel.upsert({
      where: { id: hostel.id },
      update: {},
      create: hostel,
    });
  }
  
  // Seed Rooms
  for (const room of DEFAULT_DATA.rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    });
  }
  
  // Seed Students
  for (const student of DEFAULT_DATA.students) {
    await prisma.student.upsert({
      where: { email: student.email },
      update: {},
      create: student,
    });
  }
  
  // Seed Fees
  for (const fee of DEFAULT_DATA.fees) {
    await prisma.fee.upsert({
      where: { id: fee.id },
      update: {},
      create: fee,
    });
  }
  
  // Seed Complaints
  for (const comp of DEFAULT_DATA.complaints) {
    await prisma.complaint.upsert({
      where: { id: comp.id },
      update: {},
      create: comp,
    });
  }
  
  // Seed Visitors
  for (const vis of DEFAULT_DATA.visitors) {
    await prisma.visitor.upsert({
      where: { id: vis.id },
      update: {},
      create: vis,
    });
  }
  
  // Seed Staff
  for (const st of DEFAULT_DATA.staff) {
    await prisma.staff.upsert({
      where: { id: st.id },
      update: {},
      create: st,
    });
  }
  
  // Seed Attendance & Records
  for (const att of DEFAULT_DATA.attendance) {
    const parentAtt = await prisma.attendance.upsert({
      where: { date: att.date },
      update: {},
      create: { date: att.date }
    });
    
    const relatedRecords = DEFAULT_DATA.attendanceRecords.filter(r => r.attendanceDate === att.date);
    for (const record of relatedRecords) {
      // Find if record exists
      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          attendanceId: parentAtt.id,
          studentId: record.studentId
        }
      });
      if (!existingRecord) {
        await prisma.attendanceRecord.create({
          data: {
            attendanceId: parentAtt.id,
            studentId: record.studentId,
            status: record.status
          }
        });
      }
    }
  }
  
  // Seed Notices
  for (const notice of DEFAULT_DATA.notices) {
    await prisma.notice.upsert({
      where: { id: notice.id },
      update: {},
      create: notice,
    });
  }
  
  // Seed Activities
  for (const act of DEFAULT_DATA.activities) {
    await prisma.activity.upsert({
      where: { id: act.id },
      update: {},
      create: act,
    });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

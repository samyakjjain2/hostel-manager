const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Delete existing data
  await prisma.activityLog.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.fee.deleteMany({});
  await prisma.roomAllocation.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.hostel.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.admin.deleteMany({});

  // 2. Create default Admin
  const passwordHash = await bcrypt.hash('manager123', 10);
  const admin = await prisma.admin.create({
    data: {
      name: 'Aegis Manager',
      email: 'manager@aegis.com',
      passwordHash,
      phone: '+919876543210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    }
  });
  console.log('✅ Default admin account created: manager@aegis.com / manager123');

  // 3. Create Hostels (One single Boys hostel: Pratibha Chayan Chatrawas)
  const hostel = await prisma.hostel.create({
    data: {
      name: 'Pratibha Chayan Chatrawas',
      type: 'Boys',
      address: 'Main Campus Gate, Block C',
      floors: 3,
      totalRooms: 15,
      capacity: 30,
      warden: 'Prof. Rajesh Khanna',
      contact: '+919988776655',
      rules: '1. In-time is 10:00 PM. 2. Visitors not allowed in rooms. 3. No smoking/drinking.',
      status: 'Active'
    }
  });
  console.log('✅ Single boys hostel created: Pratibha Chayan Chatrawas');

  // 4. Create Rooms under this hostel
  const rooms = [];
  // Ground floor: G1 to G5
  for (let r = 1; r <= 5; r++) {
    rooms.push({
      hostelId: hostel.id,
      roomNumber: `G${r}`,
      floor: 0,
      type: r === 1 ? 'Single' : r === 2 ? 'Double' : 'Triple',
      capacity: r === 1 ? 1 : r === 2 ? 2 : 3,
      occupiedBeds: 0,
      ac: false,
      attachedBath: false,
      monthlyRent: 7500,
      status: 'Available'
    });
  }
  // First floor: 101 to 105
  for (let r = 1; r <= 5; r++) {
    rooms.push({
      hostelId: hostel.id,
      roomNumber: `10${r}`,
      floor: 1,
      type: r === 1 ? 'Single' : r === 2 ? 'Double' : 'Triple',
      capacity: r === 1 ? 1 : r === 2 ? 2 : 3,
      occupiedBeds: 0,
      ac: false,
      attachedBath: false,
      monthlyRent: 7500,
      status: 'Available'
    });
  }
  // Second floor: 201 to 205
  for (let r = 1; r <= 5; r++) {
    rooms.push({
      hostelId: hostel.id,
      roomNumber: `20${r}`,
      floor: 2,
      type: r === 1 ? 'Single' : r === 2 ? 'Double' : 'Triple',
      capacity: r === 1 ? 1 : r === 2 ? 2 : 3,
      occupiedBeds: 0,
      ac: false,
      attachedBath: false,
      monthlyRent: 7500,
      status: 'Available'
    });
  }

  for (const r of rooms) {
    await prisma.room.create({ data: r });
  }
  console.log('✅ Rooms created under Pratibha Chayan Chatrawas');

  // 5. Seed Staff
  await prisma.staff.createMany({
    data: [
      { name: 'Ramesh Singh', designation: 'Security Guard', department: 'Security', salary: 12000, phone: '9876543211', status: 'Active' },
      { name: 'Kusum Devi', designation: 'Housekeeper', department: 'Maintenance', salary: 9000, phone: '9876543212', status: 'Active' },
      { name: 'Harish Kumar', designation: 'Mess Cook', department: 'Catering', salary: 15000, phone: '9876543213', status: 'Active' }
    ]
  });
  console.log('✅ Staff list created');

  // 6. Create Notices
  await prisma.notice.createMany({
    data: [
      { title: 'Hostel Annual Sports Registration Open', content: 'Register at the office for badminton, table tennis, and chess by Friday.', category: 'Event', pinned: true, createdBy: admin.id },
      { title: 'Maintenance Notice - Lift Block A', content: 'Lift under routine repair from 10:00 AM to 4:00 PM on Wednesday.', category: 'Maintenance', pinned: false, createdBy: admin.id }
    ]
  });
  console.log('✅ Notice board seeded');

  // 7. Fetch room entries to allocate to
  const r1 = await prisma.room.findFirst({ where: { roomNumber: '101' } });
  const r2 = await prisma.room.findFirst({ where: { roomNumber: '102' } });

  // 8. Create Students
  const s1 = await prisma.student.create({
    data: {
      name: 'सम्यक जैन',
      email: 'rahul@student.com',
      phone: '+919988776611',
      college: 'College of Technology',
      course: 'B.Tech CS',
      year: '3rd Year',
      enrollmentNumber: '0167',
      parentName: 'श्री सुरेशचंद जैन',
      address: 'बड़ागाँव जिला-टीकमगढ़ म.प्र.',
      roomId: r1.id,
      hostelId: hostel.id,
      bedNo: 1,
      status: 'Active',
      gender: 'Male'
    }
  });

  const s2 = await prisma.student.create({
    data: {
      name: 'Amit Verma',
      email: 'amit@student.com',
      phone: '+919988776622',
      college: 'College of Technology',
      course: 'B.Tech IT',
      year: '2nd Year',
      enrollmentNumber: 'EN202302',
      parentName: 'Rajesh Verma',
      address: '141-पिपल्या राव, इन्दौर',
      roomId: r2.id,
      hostelId: hostel.id,
      bedNo: 1,
      status: 'Active',
      gender: 'Male'
    }
  });
  console.log('✅ Mock students registered');

  // Update room occupancy status
  await prisma.room.update({ where: { id: r1.id }, data: { occupiedBeds: 1 } });
  await prisma.room.update({ where: { id: r2.id }, data: { occupiedBeds: 1 } });

  // 9. Allocations
  await prisma.roomAllocation.createMany({
    data: [
      { studentId: s1.id, roomId: r1.id, bedNo: 1, checkIn: new Date(), status: 'Active' },
      { studentId: s2.id, roomId: r2.id, bedNo: 1, checkIn: new Date(), status: 'Active' }
    ]
  });
  console.log('✅ Allocation history created');

  // 10. Create Split Fee Invoices
  await prisma.fee.createMany({
    data: [
      {
        studentId: s1.id,
        type: 'Monthly',
        month: 5,
        year: 2025,
        amount: 7500,
        amountAccount1: 3000,
        amountAccount2: 4500,
        paidAccount1: 3000,
        paidAccount2: 4500,
        paidAmount: 7500,
        status: 'Paid',
        receiptNumber: 'REC-SH829103',
        dueDate: new Date(2025, 4, 10),
        paidAt: new Date(2025, 4, 9)
      },
      {
        studentId: s2.id,
        type: 'Monthly',
        month: 5,
        year: 2025,
        amount: 7500,
        amountAccount1: 3000,
        amountAccount2: 4500,
        paidAccount1: 0,
        paidAccount2: 0,
        paidAmount: 0,
        status: 'Pending',
        dueDate: new Date(2025, 4, 27)
      }
    ]
  });
  console.log('✅ Split fee invoices seeded');

  console.log('🌱 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

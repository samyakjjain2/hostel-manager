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


  console.log('🌱 Database cleaned and only default admin seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

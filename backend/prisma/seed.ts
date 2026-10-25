import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@quizcraft.ai' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      name: 'Admin User',
    },
    create: {
      email: 'admin@quizcraft.ai',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create demo student user
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@quizcraft.ai' },
    update: {},
    create: {
      email: 'student@quizcraft.ai',
      password: studentPassword,
      name: 'Demo Student',
      role: 'STUDENT',
    },
  });
  console.log(`✅ Student user created: ${student.email}`);

  // Create a demo subject for the student
  const subject = await prisma.subject.create({
    data: {
      name: 'Computer Science',
      description: 'Introduction to Computer Science',
      color: '#4F46E5',
      userId: student.id,
    },
  });
  console.log(`✅ Demo subject created: ${subject.name}`);

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

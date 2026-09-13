/**
 * DEVELOPMENT / DEMO SEED SCRIPT
 * -------------------------------
 * Creates one Admin, two Teachers, and a handful of Students so the
 * app can be demoed immediately. This is clearly demo data — never
 * run this against a production database.
 *
 * Usage: npm run seed   (from the /server folder)
 */
const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('../config/db');
const User = require('../models/User');

const demoUsers = [
  { name: 'System Admin', email: 'admin@learnsync.dev', password: 'Admin@123', role: 'admin' },
  {
    name: 'Dr. Ayesha Khan',
    email: 'ayesha.khan@learnsync.dev',
    password: 'Teacher@123',
    role: 'teacher',
    department: 'Computer Science',
    designation: 'Assistant Professor',
  },
  {
    name: 'Prof. Rohan Mehta',
    email: 'rohan.mehta@learnsync.dev',
    password: 'Teacher@123',
    role: 'teacher',
    department: 'Mathematics',
    designation: 'Associate Professor',
  },
  {
    name: 'Aditi Sharma',
    email: 'aditi.sharma@learnsync.dev',
    password: 'Student@123',
    role: 'student',
    rollNumber: 'CS2024001',
    department: 'Computer Science',
    semester: 3,
  },
  {
    name: 'Karan Verma',
    email: 'karan.verma@learnsync.dev',
    password: 'Student@123',
    role: 'student',
    rollNumber: 'CS2024002',
    department: 'Computer Science',
    semester: 3,
  },
  {
    name: 'Simran Kaur',
    email: 'simran.kaur@learnsync.dev',
    password: 'Student@123',
    role: 'student',
    rollNumber: 'MATH2024001',
    department: 'Mathematics',
    semester: 3,
  },
];

const seed = async () => {
  await connectDB();

  console.log('Clearing existing demo users...');
  await User.deleteMany({ email: { $in: demoUsers.map((u) => u.email) } });

  console.log('Creating demo users (passwords are hashed automatically)...');
  for (const userData of demoUsers) {
    await User.create(userData);
    console.log(`  Created ${userData.role}: ${userData.email}`);
  }

  console.log('\nSeed complete. Demo login credentials:');
  demoUsers.forEach((u) => console.log(`  ${u.role.padEnd(8)} ${u.email}  /  ${u.password}`));

  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

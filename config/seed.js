const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Device = require('../models/Device');

async function seedDatabase() {
  // Skip if already seeded
  const existing = await Admin.findOne({ username: 'admin' });
  if (existing) {
    console.log('📦 Database already seeded — skipping');
    return;
  }

  console.log('🌱 Seeding database...');

  const adminHash = bcrypt.hashSync('admin123', 10);
  const studentHash = bcrypt.hashSync('student123', 10);

  // ─── Admin ─────────────────────────────────────────────
  await Admin.create({ username: 'admin', password_hash: adminHash, name: 'System Administrator' });

  // ─── Subjects ──────────────────────────────────────────
  const subjectDocs = await Subject.insertMany([
    { code: 'CS601', name: 'Data Structures & Algorithms', branch: 'CS', semester: 6, faculty_name: 'Prof. Rajesh Kumar',  faculty_email: 'rajesh@college.edu', credits: 4 },
    { code: 'CS602', name: 'Database Management Systems',  branch: 'CS', semester: 6, faculty_name: 'Prof. Priya Sharma',  faculty_email: 'priya@college.edu',  credits: 4 },
    { code: 'CS603', name: 'Computer Networks',            branch: 'CS', semester: 6, faculty_name: 'Prof. Anil Verma',    faculty_email: 'anil@college.edu',   credits: 4 },
    { code: 'CS604', name: 'Software Engineering',         branch: 'CS', semester: 6, faculty_name: 'Prof. Sunita Patel',  faculty_email: 'sunita@college.edu', credits: 4 },
    { code: 'CS605', name: 'Web Technologies',             branch: 'CS', semester: 6, faculty_name: 'Prof. Vikram Singh',  faculty_email: 'vikram@college.edu', credits: 4 },
  ]);

  const [s1, s2, s3, s4, s5] = subjectDocs;

  // ─── Students (2 RFID cards) ───────────────────────────
  const students = await Student.insertMany([
    {
      enrollment_no: '23BSCS01', name: 'Aarav Mehta',
      email: 'aarav@student.edu', password_hash: studentHash,
      rfid_tag: 'RFID001',                        // ← Card 1
      branch: 'CS', semester: 6, section: 'A', year: 2023,
      phone: '9876543210', address: 'Ahmedabad, Gujarat'
    },
    {
      enrollment_no: '23BSCS02', name: 'Priya Sharma',
      email: 'priya@student.edu', password_hash: studentHash,
      rfid_tag: 'RFID002',                        // ← Card 2
      branch: 'CS', semester: 6, section: 'A', year: 2023,
      phone: '9876543211', address: 'Surat, Gujarat'
    },
  ]);

  // ─── Timetable ─────────────────────────────────────────
  const ttSlots = [
    { subject_id: s1._id, day: 'Monday',    start: '09:00', end: '10:00', room: 'Room 101' },
    { subject_id: s2._id, day: 'Monday',    start: '10:00', end: '11:00', room: 'Room 102' },
    { subject_id: s3._id, day: 'Monday',    start: '11:15', end: '12:15', room: 'Room 103' },
    { subject_id: s4._id, day: 'Tuesday',   start: '09:00', end: '10:00', room: 'Room 101' },
    { subject_id: s5._id, day: 'Tuesday',   start: '10:15', end: '11:15', room: 'Lab 02'   },
    { subject_id: s1._id, day: 'Tuesday',   start: '12:00', end: '13:00', room: 'Room 101' },
    { subject_id: s2._id, day: 'Wednesday', start: '09:00', end: '10:00', room: 'Room 102' },
    { subject_id: s3._id, day: 'Wednesday', start: '11:00', end: '12:00', room: 'Room 103' },
    { subject_id: s4._id, day: 'Wednesday', start: '13:00', end: '14:00', room: 'Room 104' },
    { subject_id: s5._id, day: 'Thursday',  start: '09:00', end: '10:00', room: 'Lab 02'   },
    { subject_id: s1._id, day: 'Thursday',  start: '10:15', end: '11:15', room: 'Room 101' },
    { subject_id: s2._id, day: 'Thursday',  start: '12:00', end: '13:00', room: 'Room 102' },
    { subject_id: s3._id, day: 'Friday',    start: '09:00', end: '10:00', room: 'Room 103' },
    { subject_id: s4._id, day: 'Friday',    start: '10:15', end: '11:15', room: 'Room 104' },
    { subject_id: s5._id, day: 'Friday',    start: '12:00', end: '13:00', room: 'Lab 02'   },
  ];

  await Timetable.insertMany(ttSlots.map(t => ({
    subject_id: t.subject_id,
    branch: 'CS', semester: 6, section: 'A',
    day_of_week: t.day, start_time: t.start, end_time: t.end, room: t.room
  })));

  // ─── Device ────────────────────────────────────────────
  await Device.create({ device_id: 'ESP01', location: 'Main Gate – Block A', secret_key: 'esp8266_secret_key_2024' });

  // ─── Sample Attendance (last 60 weekdays) ──────────────
  const attDocs = [];
  for (let i = 60; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends

    const dateStr = d.toISOString().split('T')[0];

    for (const student of students) {
      for (const subject of subjectDocs) {
        const rand = Math.random();
        if (rand < 0.85) {
          const hr  = 9 + Math.floor(Math.random() * 3);
          const min = Math.floor(Math.random() * 30);
          attDocs.push({
            student_id: student._id,
            subject_id: subject._id,
            date:    dateStr,
            time_in: `${String(hr).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
            status:  rand < 0.05 ? 'Late' : 'Present',
            marked_by: 'RFID',
          });
        }
      }
    }
  }

  // Insert in batches to avoid any size limits
  for (let i = 0; i < attDocs.length; i += 500) {
    await Attendance.insertMany(attDocs.slice(i, i + 500), { ordered: false }).catch(() => {});
  }

  console.log('');
  console.log('✅ Seed complete!');
  console.log('──────────────────────────────────────');
  console.log('📋 Login Credentials:');
  console.log('   Student 1: aarav@student.edu  / student123  (RFID: RFID001)');
  console.log('   Student 2: priya@student.edu  / student123  (RFID: RFID002)');
  console.log('   Admin:     admin               / admin123');
  console.log('──────────────────────────────────────');
}

module.exports = { seedDatabase };

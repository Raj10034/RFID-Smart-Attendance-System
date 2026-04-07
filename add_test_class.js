require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const Timetable = require('./models/Timetable');
const { connectDB } = require('./config/db');

async function addTestClass() {
  await connectDB();

  // Create a test subject (or reuse if it exists)
  let testSubject = await Subject.findOne({ code: 'TEST01' });
  if (!testSubject) {
    testSubject = await Subject.create({
      code: 'TEST01',
      name: 'Test Class (All Day)',
      branch: 'CS',
      semester: 6,
      faculty_name: 'Test Faculty',
      faculty_email: 'test@college.edu',
      credits: 0
    });
    console.log('✅ Created test subject: TEST01 - Test Class (All Day)');
  } else {
    console.log('📦 Test subject already exists');
  }

  // Add this class for EVERY day of the week (00:00 - 23:59)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (const day of days) {
    const exists = await Timetable.findOne({
      subject_id: testSubject._id,
      day_of_week: day,
      branch: 'CS', semester: 6, section: 'A'
    });

    if (!exists) {
      await Timetable.create({
        subject_id: testSubject._id,
        branch: 'CS', semester: 6, section: 'A',
        day_of_week: day,
        start_time: '00:00',
        end_time: '23:59',
        room: 'Test Room'
      });
      console.log(`  ✅ Added ${day} 00:00–23:59`);
    } else {
      console.log(`  📦 ${day} already exists`);
    }
  }

  console.log('\n🎉 Test class available 24/7! Scan your RFID card anytime.');
  process.exit(0);
}

addTestClass().catch(err => { console.error(err); process.exit(1); });

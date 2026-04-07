const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Device = require('../models/Device');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(requireAdmin);

// ─── Students ─────────────────────────────────────────────
router.get('/students', async (req, res) => {
  const students = await Student.find().select('-password_hash').sort('name');
  res.json(students);
});

router.post('/students', async (req, res) => {
  const { enrollment_no, name, email, password, rfid_tag, branch, semester, section, phone, address, year } = req.body;
  try {
    const hash = bcrypt.hashSync(password || 'student123', 10);
    const student = await Student.create({
      enrollment_no, name, email: email.toLowerCase(), password_hash: hash,
      rfid_tag: rfid_tag ? rfid_tag.toUpperCase() : undefined,
      branch, semester: parseInt(semester), section: section || 'A',
      phone, address, year: year || new Date().getFullYear()
    });
    res.json({ success: true, id: student._id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/students/:id/rfid', async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { rfid_tag: req.body.rfid_tag?.toUpperCase() });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/students/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ─── Subjects ─────────────────────────────────────────────
router.get('/subjects', async (req, res) => {
  res.json(await Subject.find().sort('code'));
});

router.post('/subjects', async (req, res) => {
  const { code, name, branch, semester, faculty_name, faculty_email, credits } = req.body;
  try {
    const subject = await Subject.create({ code, name, branch, semester: parseInt(semester), faculty_name, faculty_email, credits: parseInt(credits) || 3 });
    res.json({ success: true, id: subject._id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── Attendance ───────────────────────────────────────────
router.get('/attendance', async (req, res) => {
  const { date, student_id, subject_id } = req.query;
  const filter = {};
  if (date) filter.date = date;
  if (student_id) filter.student_id = student_id;
  if (subject_id) filter.subject_id = subject_id;

  const records = await Attendance.find(filter)
    .populate('student_id', 'name enrollment_no')
    .populate('subject_id', 'name code')
    .sort({ date: -1, time_in: -1 })
    .limit(500);

  res.json(records.map(r => ({
    id: r._id,
    date: r.date, time_in: r.time_in, status: r.status, marked_by: r.marked_by,
    student_name: r.student_id?.name,
    enrollment_no: r.student_id?.enrollment_no,
    subject_name: r.subject_id?.name,
    subject_code: r.subject_id?.code,
  })));
});

router.post('/attendance/manual', async (req, res) => {
  const { student_id, subject_id, date, status } = req.body;
  try {
    await Attendance.findOneAndUpdate(
      { student_id, subject_id, date },
      { student_id, subject_id, date, status: status || 'Present', marked_by: 'Manual' },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── Stats ────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const todayDate = new Date().toISOString().split('T')[0];
  const [totalStudents, totalSubjects, todayAttendance, totalAttendance, devices] = await Promise.all([
    Student.countDocuments(),
    Subject.countDocuments(),
    Attendance.countDocuments({ date: todayDate }),
    Attendance.countDocuments(),
    Device.find()
  ]);
  res.json({ totalStudents, totalSubjects, todayAttendance, totalAttendance, devices });
});

// ─── Devices ──────────────────────────────────────────────
router.get('/devices', async (req, res) => {
  res.json(await Device.find().sort('device_id'));
});

router.post('/devices', async (req, res) => {
  const { device_id, location, secret_key } = req.body;
  try {
    await Device.create({ device_id, location, secret_key });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;

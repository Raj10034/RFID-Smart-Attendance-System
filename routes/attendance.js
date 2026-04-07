const express = require('express');
const Student = require('../models/Student');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Device = require('../models/Device');
const Notification = require('../models/Notification');
const router = express.Router();

// ─── ESP8266 RFID mark attendance ─────────────────────────────────────────────
// POST /api/attendance/mark
// Body: { rfid_tag, device_id, secret_key }
router.post('/mark', async (req, res) => {
  const { rfid_tag, device_id, secret_key } = req.body;
  if (!rfid_tag || !device_id || !secret_key)
    return res.status(400).json({ success: false, error: 'Missing required fields: rfid_tag, device_id, secret_key' });

  // Validate device
  const device = await Device.findOne({ device_id, secret_key, status: 'active' });
  if (!device)
    return res.status(403).json({ success: false, error: 'Invalid device or secret key' });

  // Update last seen
  device.last_seen = new Date();
  await device.save();

  // Find student by RFID
  const student = await Student.findOne({ rfid_tag: rfid_tag.toUpperCase() });
  if (!student)
    return res.status(404).json({ success: false, error: `No student found with RFID: ${rfid_tag}` });

  const now   = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);
  const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[now.getDay()];

  const currentMins = now.getHours() * 60 + now.getMinutes();

  // Find all classes for today
  const todayClasses = await Timetable.find({
    branch: student.branch,
    semester: student.semester,
    section: student.section,
    day_of_week: today
  }).populate('subject_id');

  // Pick the nearest class (closest to current time)
  let targetClass = null;
  if (todayClasses.length > 0) {
    let minDist = Infinity;
    todayClasses.forEach(cls => {
      const [sh, sm] = cls.start_time.split(':').map(Number);
      const dist = Math.abs(currentMins - (sh * 60 + sm));
      if (dist < minDist) { minDist = dist; targetClass = cls; }
    });
  }

  if (!targetClass) {
    return res.json({
      success: false,
      student_name: student.name,
      error: 'No class scheduled today',
      message: `Hello ${student.name}! No class scheduled today.`
    });
  }

  // Check already marked
  const existing = await Attendance.findOne({
    student_id: student._id,
    subject_id: targetClass.subject_id._id,
    date: dateStr
  });

  if (existing) {
    return res.json({
      success: true,
      already_marked: true,
      student_name: student.name,
      subject: targetClass.subject_id.name,
      message: `Already marked for ${targetClass.subject_id.name}`
    });
  }

  // Always mark as Present (no time restriction)
  const status = 'Present';

  const record = await Attendance.create({
    student_id: student._id,
    subject_id: targetClass.subject_id._id,
    date: dateStr,
    time_in: timeStr,
    status,
    marked_by: 'RFID',
    device_id
  });

  // Notification
  await Notification.create({
    student_id: student._id,
    title: 'Attendance Marked',
    message: `${status} for ${targetClass.subject_id.name} on ${dateStr} at ${timeStr}`,
    type: 'attendance'
  });

  // Emit real-time event via Socket.IO
  const populatedRecord = await Attendance.findById(record._id)
    .populate('student_id', 'name enrollment_no')
    .populate('subject_id', 'name code');

  if (req.io) {
    req.io.emit('attendance:new', {
      id: populatedRecord._id,
      student_name: populatedRecord.student_id?.name,
      enrollment_no: populatedRecord.student_id?.enrollment_no,
      subject_name: populatedRecord.subject_id?.name,
      subject_code: populatedRecord.subject_id?.code,
      date: dateStr,
      time_in: timeStr,
      status,
      marked_by: 'RFID'
    });
  }

  res.json({
    success: true,
    student_name: student.name,
    enrollment_no: student.enrollment_no,
    subject: targetClass.subject_id.name,
    date: dateStr, time: timeStr, status,
    message: `Welcome ${student.name}! Marked ${status} for ${targetClass.subject_id.name}`
  });
});

// ─── All attendance logs (admin use) ─────────────────────
router.get('/logs', async (req, res) => {
  const { date, student_id } = req.query;
  const filter = {};
  if (date) filter.date = date;
  if (student_id) filter.student_id = student_id;

  const records = await Attendance.find(filter)
    .populate('student_id', 'name enrollment_no')
    .populate('subject_id', 'name code')
    .sort({ date: -1, time_in: -1 })
    .limit(200);

  res.json(records.map(r => ({
    id: r._id,
    date: r.date, time_in: r.time_in, status: r.status, marked_by: r.marked_by, device_id: r.device_id,
    student_name: r.student_id?.name,
    enrollment_no: r.student_id?.enrollment_no,
    subject_name: r.subject_id?.name,
    code: r.subject_id?.code,
  })));
});

module.exports = router;

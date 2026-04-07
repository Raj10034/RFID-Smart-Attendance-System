const express = require('express');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const { requireStudent } = require('../middleware/auth');
const router = express.Router();

router.use(requireStudent);

// ─── Profile ─────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  const student = await Student.findById(req.session.studentId).select('-password_hash');
  res.json(student);
});

// ─── Today's classes ─────────────────────────────────────
router.get('/timetable/today', async (req, res) => {
  const student = await Student.findById(req.session.studentId);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[new Date().getDay()];

  const classes = await Timetable.find({
    branch: student.branch,
    semester: student.semester,
    section: student.section,
    day_of_week: today
  }).populate('subject_id').sort('start_time');

  res.json({
    day: today,
    classes: classes.map(c => ({
      id: c._id,
      start_time: c.start_time,
      end_time: c.end_time,
      room: c.room,
      subject_name: c.subject_id?.name,
      subject_code: c.subject_id?.code,
      faculty_name: c.subject_id?.faculty_name,
    }))
  });
});

// ─── Full weekly timetable ────────────────────────────────
router.get('/timetable', async (req, res) => {
  const student = await Student.findById(req.session.studentId);
  const classes = await Timetable.find({
    branch: student.branch,
    semester: student.semester,
    section: student.section
  }).populate('subject_id').sort('start_time');

  const dayOrder = { Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5 };
  const sorted = classes.sort((a, b) => {
    const dA = dayOrder[a.day_of_week] || 9;
    const dB = dayOrder[b.day_of_week] || 9;
    return dA !== dB ? dA - dB : a.start_time.localeCompare(b.start_time);
  });

  res.json(sorted.map(c => ({
    id: c._id,
    day_of_week: c.day_of_week,
    start_time: c.start_time,
    end_time: c.end_time,
    room: c.room,
    subject_name: c.subject_id?.name,
    subject_code: c.subject_id?.code,
    faculty_name: c.subject_id?.faculty_name,
  })));
});

// ─── Attendance summary per subject ──────────────────────
router.get('/attendance', async (req, res) => {
  const student = await Student.findById(req.session.studentId);
  const subjects = await Subject.find({ branch: student.branch, semester: student.semester });

  const result = await Promise.all(subjects.map(async subject => {
    const stats = await Attendance.aggregate([
      { $match: { student_id: student._id, subject_id: subject._id } },
      {
        $group: {
          _id: null,
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          late:    { $sum: { $cond: [{ $eq: ['$status', 'Late'] },    1, 0] } },
          absent:  { $sum: { $cond: [{ $eq: ['$status', 'Absent'] },  1, 0] } },
        }
      }
    ]);

    const s = stats[0] || { total: 0, present: 0, late: 0, absent: 0 };
    const attended = s.present + s.late;
    const percentage = s.total > 0 ? Math.round((attended / s.total) * 100) : 0;
    return {
      id: subject._id,
      code: subject.code,
      name: subject.name,
      faculty_name: subject.faculty_name,
      total_classes: s.total,
      attended,
      absent: s.absent,
      percentage,
      status: percentage >= 75 ? 'good' : percentage >= 65 ? 'warning' : 'danger'
    };
  }));

  const totalClasses  = result.reduce((s, r) => s + r.total_classes, 0);
  const totalAttended = result.reduce((s, r) => s + r.attended, 0);
  const overallPct    = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

  res.json({ subjects: result, overall: { total: totalClasses, attended: totalAttended, percentage: overallPct } });
});

// ─── Detailed attendance for one subject ─────────────────
router.get('/attendance/:subjectId', async (req, res) => {
  const student = await Student.findById(req.session.studentId);
  const subject = await Subject.findById(req.params.subjectId);
  const records = await Attendance.find({
    student_id: student._id,
    subject_id: req.params.subjectId
  }).sort({ date: -1 });

  res.json({ subject, records });
});

// ─── Notifications + recent attendance ───────────────────
router.get('/notifications', async (req, res) => {
  const [notifications, recentAtt] = await Promise.all([
    Notification.find({
      $or: [{ student_id: req.session.studentId }, { student_id: null }]
    }).sort({ createdAt: -1 }).limit(20),

    Attendance.find({ student_id: req.session.studentId })
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .populate('subject_id')
  ]);

  res.json({
    notifications,
    recent_attendance: recentAtt.map(a => ({
      date: a.date,
      time_in: a.time_in,
      status: a.status,
      subject_name: a.subject_id?.name,
      code: a.subject_id?.code,
    }))
  });
});

module.exports = router;

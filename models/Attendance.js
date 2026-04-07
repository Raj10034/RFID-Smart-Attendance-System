const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true },       // 'YYYY-MM-DD'
  time_in: String,
  status: { type: String, enum: ['Present', 'Late', 'Absent'], default: 'Present' },
  marked_by: { type: String, default: 'RFID' }, // 'RFID' | 'Manual'
  device_id: String
}, { timestamps: true });

// Unique attendance per student per subject per day
attendanceSchema.index({ student_id: 1, subject_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

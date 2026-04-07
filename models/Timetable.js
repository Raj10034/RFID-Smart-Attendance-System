const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  branch: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, default: 'A' },
  day_of_week: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  room: String
});

module.exports = mongoose.model('Timetable', timetableSchema);

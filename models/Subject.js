const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  branch: { type: String, required: true },
  semester: { type: Number, required: true },
  faculty_name: { type: String, required: true },
  faculty_email: String,
  credits: { type: Number, default: 3 }
});

module.exports = mongoose.model('Subject', subjectSchema);

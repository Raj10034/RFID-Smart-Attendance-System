const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  enrollment_no: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  rfid_tag: { type: String, unique: true, sparse: true },
  branch: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, default: 'A' },
  year: { type: Number },
  phone: String,
  address: String,
  photo_url: { type: String, default: '/images/default-avatar.png' },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);

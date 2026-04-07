const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);

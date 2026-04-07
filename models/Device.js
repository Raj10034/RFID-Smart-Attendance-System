const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  device_id: { type: String, unique: true, required: true },
  location: { type: String, required: true },
  secret_key: { type: String, required: true },
  last_seen: Date,
  status: { type: String, default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);

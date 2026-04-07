const express = require('express');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const router = express.Router();

// Student login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const student = await Student.findOne({ email: email.trim().toLowerCase() });
  if (!student || !bcrypt.compareSync(password, student.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  req.session.studentId = student._id.toString();
  req.session.role = 'student';
  res.json({
    success: true,
    student: {
      id: student._id,
      name: student.name,
      enrollment_no: student.enrollment_no,
      branch: student.branch,
      semester: student.semester,
      photo_url: student.photo_url,
    }
  });
});

// Admin login
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const admin = await Admin.findOne({ username: username.trim() });
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.adminId = admin._id.toString();
  req.session.role = 'admin';
  res.json({ success: true, admin: { id: admin._id, name: admin.name } });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Check session
router.get('/me', async (req, res) => {
  try {
    if (req.session.role === 'student') {
      const student = await Student.findById(req.session.studentId).select('-password_hash');
      if (!student) return res.json({ loggedIn: false });
      return res.json({ loggedIn: true, role: 'student', user: student });
    }
    if (req.session.role === 'admin') {
      const admin = await Admin.findById(req.session.adminId).select('-password_hash');
      if (!admin) return res.json({ loggedIn: false });
      return res.json({ loggedIn: true, role: 'admin', user: admin });
    }
    res.json({ loggedIn: false });
  } catch (e) {
    res.json({ loggedIn: false });
  }
});

module.exports = router;

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// ─── Auth ─────────────────────────────────────────────
export const checkAuth = () => api.get('/me');
export const loginStudent = (email, password) => api.post('/login', { email, password });
export const loginAdmin = (username, password) => api.post('/admin/login', { username, password });
export const logout = () => api.post('/logout');

// ─── Student ──────────────────────────────────────────
export const getProfile = () => api.get('/student/profile');
export const getTodayClasses = () => api.get('/student/timetable/today');
export const getFullTimetable = () => api.get('/student/timetable');
export const getAttendanceSummary = () => api.get('/student/attendance');
export const getSubjectAttendance = (subjectId) => api.get(`/student/attendance/${subjectId}`);
export const getNotifications = () => api.get('/student/notifications');

// ─── Admin ────────────────────────────────────────────
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminStudents = () => api.get('/admin/students');
export const addAdminStudent = (data) => api.post('/admin/students', data);
export const updateStudentRfid = (id, rfid_tag) => api.put(`/admin/students/${id}/rfid`, { rfid_tag });
export const deleteAdminStudent = (id) => api.delete(`/admin/students/${id}`);
export const getAdminSubjects = () => api.get('/admin/subjects');
export const getAdminAttendance = (params) => api.get('/admin/attendance', { params });
export const markManualAttendance = (data) => api.post('/admin/attendance/manual', data);
export const getAdminDevices = () => api.get('/admin/devices');
export const addAdminDevice = (data) => api.post('/admin/devices', data);
export const getAttendanceLogs = (params) => api.get('/attendance/logs', { params });

export default api;

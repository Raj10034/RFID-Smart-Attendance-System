import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/student/Dashboard';
import Attendance from './pages/student/Attendance';
import Timetable from './pages/student/Timetable';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminDevices from './pages/admin/AdminDevices';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Student routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute requiredRole="student"><Dashboard /></ProtectedRoute>
              } />
              <Route path="/attendance" element={
                <ProtectedRoute requiredRole="student"><Attendance /></ProtectedRoute>
              } />
              <Route path="/timetable" element={
                <ProtectedRoute requiredRole="student"><Timetable /></ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/students" element={
                <ProtectedRoute requiredRole="admin"><AdminStudents /></ProtectedRoute>
              } />
              <Route path="/admin/attendance" element={
                <ProtectedRoute requiredRole="admin"><AdminAttendance /></ProtectedRoute>
              } />
              <Route path="/admin/devices" element={
                <ProtectedRoute requiredRole="admin"><AdminDevices /></ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

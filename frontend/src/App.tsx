import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import RegisterStudent from './pages/Admin/RegisterStudent';
import RegisterTeacher from './pages/Admin/RegisterTeacher';
import TeachersOverview from './pages/Admin/TeachersOverview';
import ManageClasses from './pages/Admin/ManageClasses';
import StudentSearch from './pages/Admin/StudentSearch';
import ViewApprovals from './pages/Admin/ViewApprovals';
import TeacherDashboard from './pages/Teacher/Dashboard';
import TeacherRegisterStudent from './pages/Teacher/RegisterStudent';
import ViewStudents from './pages/Teacher/ViewStudents';
import EnterMarks from './pages/Teacher/EnterMarks';
import MarkAttendance from './pages/Teacher/MarkAttendance';
import ManageFees from './pages/Teacher/ManageFees';
import ManageSubjects from './pages/Teacher/ManageSubjects';
import ManageHomework from './pages/Teacher/ManageHomework';
import ManageTimetable from './pages/Teacher/ManageTimetable';
import StudentDashboard from './pages/Student/Dashboard';
import AttendanceView from './pages/Student/AttendanceView';
import MarksView from './pages/Student/MarksView';
import HomeworkView from './pages/Student/HomeworkView';
import TimetableView from './pages/Student/TimetableView';
import ChangePassword from './components/ChangePassword';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/register-student"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RegisterStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/register-teacher"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RegisterTeacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TeachersOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/search"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StudentSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ViewApprovals />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/register-student"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherRegisterStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/view-students"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ViewStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/enter-marks"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <EnterMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/mark-attendance"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <MarkAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/manage-fees"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/manage-subjects"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageSubjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/manage-homework"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageHomework />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/timetable"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/change-password"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ChangePassword role="teacher" />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AttendanceView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/marks"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <MarksView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/homework"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <HomeworkView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/timetable"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <TimetableView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/change-password"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ChangePassword role="student" />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

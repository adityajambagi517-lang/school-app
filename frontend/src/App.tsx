import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import ManageNotices from './pages/Admin/ManageNotices';
import RegisterStudent from './pages/Admin/RegisterStudent';
import RegisterTeacher from './pages/Admin/RegisterTeacher';
import TeachersOverview from './pages/Admin/TeachersOverview';
import ManageClasses from './pages/Admin/ManageClasses';
import StudentSearch from './pages/Admin/StudentSearch';
import ViewApprovals from './pages/Admin/ViewApprovals';
import FeeApprovals from './pages/Admin/FeeApprovals';
import UserManagement from './pages/Admin/UserManagement';
import ClassDetailPage from './pages/Admin/ClassDetailPage';
import TeacherDetailPage from './pages/Admin/TeacherDetailPage';
import StudentDetailPage from './pages/Admin/StudentDetailPage';
import TeacherDashboard from './pages/Teacher/Dashboard';
import TeacherRegisterStudent from './pages/Teacher/RegisterStudent';
import ViewStudents from './pages/Teacher/ViewStudents';
import TeacherStudentSearch from './pages/Teacher/StudentSearch';
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
import FeesView from './pages/Student/FeesView';
import NoticesView from './pages/Common/NoticesView';
import Profile from './pages/Common/Profile';
import ReportProblem from './pages/Common/ReportProblem';
import SupportTickets from './pages/Admin/SupportTickets';
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
        <Route
          path="/admin/fee-approvals"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FeeApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notices"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageNotices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/change-password"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ChangePassword role="admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SupportTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClassDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TeacherDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StudentDetailPage />
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
          path="/teacher/search"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherStudentSearch />
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
        <Route
          path="/teacher/report-problem"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ReportProblem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/notices"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <NoticesView />
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
          path="/student/fees"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <FeesView />
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
        <Route
          path="/student/report-problem"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ReportProblem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notices"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <NoticesView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

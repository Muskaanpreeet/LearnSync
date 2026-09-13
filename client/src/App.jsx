import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, ClipboardList, CalendarCheck, FileQuestion, Award, FolderOpen, Megaphone, Users, GraduationCap, BarChart3, Settings as SettingsIcon } from 'lucide-react';

import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import NotFound from './pages/common/NotFound';
import Unauthorized from './pages/common/Unauthorized';
import CourseDetails from './pages/common/CourseDetails';
import Announcements from './pages/common/Announcements';
import Notifications from './pages/common/Notifications';
import Settings from './pages/common/Settings';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import DashboardLayout from './layouts/DashboardLayout';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminStudents from './pages/admin/AdminStudents';
import StudentDetails from './pages/admin/StudentDetails';
import AdminTeachers from './pages/admin/AdminTeachers';
import TeacherDetails from './pages/admin/TeacherDetails';
import AdminReports from './pages/admin/AdminReports';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherMyCourses from './pages/teacher/MyCourses';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import AssignmentSubmissions from './pages/teacher/AssignmentSubmissions';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import AttendanceSummary from './pages/teacher/AttendanceSummary';
import TeacherTests from './pages/teacher/TeacherTests';
import ManageQuestions from './pages/teacher/ManageQuestions';
import TestResults from './pages/teacher/TestResults';
import TeacherResults from './pages/teacher/TeacherResults';
import CoursePerformance from './pages/teacher/CoursePerformance';
import TeacherMaterials from './pages/teacher/TeacherMaterials';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentMyCourses from './pages/student/MyCourses';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentAssignmentDetails from './pages/student/StudentAssignmentDetails';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentAttendanceHistory from './pages/student/StudentAttendanceHistory';
import StudentTests from './pages/student/StudentTests';
import TakeTest from './pages/student/TakeTest';
import TestResult from './pages/student/TestResult';
import StudentResults from './pages/student/StudentResults';
import StudentCourseResults from './pages/student/StudentCourseResults';
import StudentMaterials from './pages/student/StudentMaterials';

// Nav item sets per role — expanded as each module (Materials,
// Announcements, etc.) is built.
const adminNav = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Students', to: '/admin/students', icon: GraduationCap },
  { label: 'Teachers', to: '/admin/teachers', icon: Users },
  { label: 'Courses', to: '/admin/courses', icon: BookOpen },
  { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', to: '/admin/settings', icon: SettingsIcon },
];
const teacherNav = [
  { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard },
  { label: 'My Courses', to: '/teacher/courses', icon: BookOpen },
  { label: 'Assignments', to: '/teacher/assignments', icon: ClipboardList },
  { label: 'Attendance', to: '/teacher/attendance', icon: CalendarCheck },
  { label: 'Tests', to: '/teacher/tests', icon: FileQuestion },
  { label: 'Results', to: '/teacher/results', icon: Award },
  { label: 'Materials', to: '/teacher/materials', icon: FolderOpen },
  { label: 'Announcements', to: '/teacher/announcements', icon: Megaphone },
  { label: 'Settings', to: '/teacher/settings', icon: SettingsIcon },
];
const studentNav = [
  { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
  { label: 'My Courses', to: '/student/courses', icon: BookOpen },
  { label: 'Assignments', to: '/student/assignments', icon: ClipboardList },
  { label: 'Attendance', to: '/student/attendance', icon: CalendarCheck },
  { label: 'Tests', to: '/student/tests', icon: FileQuestion },
  { label: 'Results', to: '/student/results', icon: Award },
  { label: 'Materials', to: '/student/materials', icon: FolderOpen },
  { label: 'Announcements', to: '/student/announcements', icon: Megaphone },
  { label: 'Settings', to: '/student/settings', icon: SettingsIcon },
];

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Private */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowed={['admin']} />}>
          <Route path="/admin" element={<DashboardLayout navItems={adminNav} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="students/:id" element={<StudentDetails />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="teachers/:id" element={<TeacherDetails />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/:id" element={<CourseDetails />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowed={['teacher']} />}>
          <Route path="/teacher" element={<DashboardLayout navItems={teacherNav} />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="courses" element={<TeacherMyCourses />} />
            <Route path="courses/:id" element={<CourseDetails />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="assignments/:id/submissions" element={<AssignmentSubmissions />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="attendance/:courseId/summary" element={<AttendanceSummary />} />
            <Route path="tests" element={<TeacherTests />} />
            <Route path="tests/:id/questions" element={<ManageQuestions />} />
            <Route path="tests/:id/results" element={<TestResults />} />
            <Route path="results" element={<TeacherResults />} />
            <Route path="results/:courseId/performance" element={<CoursePerformance />} />
            <Route path="materials" element={<TeacherMaterials />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowed={['student']} />}>
          <Route path="/student" element={<DashboardLayout navItems={studentNav} />}>
            <Route index element={<StudentDashboard />} />
            <Route path="courses" element={<StudentMyCourses />} />
            <Route path="courses/:id" element={<CourseDetails />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="assignments/:id" element={<StudentAssignmentDetails />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="attendance/:courseId" element={<StudentAttendanceHistory />} />
            <Route path="tests" element={<StudentTests />} />
            <Route path="tests/:id/take" element={<TakeTest />} />
            <Route path="tests/:id/result" element={<TestResult />} />
            <Route path="results" element={<StudentResults />} />
            <Route path="results/:courseId" element={<StudentCourseResults />} />
            <Route path="materials" element={<StudentMaterials />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

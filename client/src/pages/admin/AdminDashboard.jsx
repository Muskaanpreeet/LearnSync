import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, ClipboardList, FileQuestion, Megaphone, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import dashboardService from '../../services/dashboardService';
import StatCard from '../../components/common/StatCard';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import { formatDateTime } from '../../utils/formatDate';

const PIE_COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getAdminDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return null;

  const { stats, charts, recentAnnouncements } = data;
  const attendanceData = [
    { name: 'Present', value: charts.attendanceOverview.present },
    { name: 'Absent', value: charts.attendanceOverview.absent },
  ];
  const assignmentStatsData = [
    { name: 'Submitted', value: charts.assignmentStats.submitted },
    { name: 'Late', value: charts.assignmentStats.late },
    { name: 'Graded', value: charts.assignmentStats.graded },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Institution-wide overview of LearnSync.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Students" value={stats.totalStudents} icon={GraduationCap} />
        <StatCard label="Teachers" value={stats.totalTeachers} icon={Users} />
        <StatCard label="Courses" value={stats.totalCourses} icon={BookOpen} />
        <StatCard label="Active courses" value={stats.activeCourses} icon={BookOpen} />
        <StatCard label="Open assignments" value={stats.pendingAssignments} icon={ClipboardList} />
        <StatCard label="Upcoming tests" value={stats.upcomingTests} icon={FileQuestion} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-1 font-semibold text-gray-900">Course distribution by department</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={charts.courseDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-1 font-semibold text-gray-900">Attendance overview</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={attendanceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                  {attendanceData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-1 font-semibold text-gray-900">Student enrollment by department</h2>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={charts.studentsByDepartment} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-1 font-semibold text-gray-900">Assignment statistics</h2>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={assignmentStatsData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {assignmentStatsData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent announcements</h2>
            <Link to="/admin/announcements" className="text-sm font-medium text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((a) => (
                <div key={a._id} className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <Megaphone size={15} className="mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400">
                      {a.createdBy?.name} · {formatDateTime(a.createdAt)}
                      {a.course && ` · ${a.course.code}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-gray-900">Quick actions</h2>
          <div className="space-y-2">
            <Link to="/admin/courses">
              <Button variant="secondary" className="w-full justify-start">
                <Plus size={16} /> New course
              </Button>
            </Link>
            <Link to="/admin/announcements">
              <Button variant="secondary" className="w-full justify-start">
                <Megaphone size={16} /> Post announcement
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

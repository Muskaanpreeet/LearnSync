import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarCheck, ClipboardList, FileQuestion, Megaphone, FileText, Award } from 'lucide-react';

import dashboardService from '../../services/dashboardService';
import StatCard from '../../components/common/StatCard';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import AttendanceBar from '../../components/common/AttendanceBar';
import Badge from '../../components/common/Badge';
import { formatDate, formatDateTime, isPast } from '../../utils/formatDate';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getStudentDashboard();
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

  const { stats, upcomingAssignments, upcomingTests, recentResults, recentAnnouncements, recentMaterials } = data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Student Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Your academic overview at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Enrolled courses" value={stats.enrolledCourses} icon={BookOpen} />
        <StatCard label="Upcoming assignments" value={stats.upcomingAssignments} icon={ClipboardList} />
        <StatCard label="Upcoming tests" value={stats.upcomingTests} icon={FileQuestion} />
        <div className="card">
          <p className="mb-2 text-sm text-gray-500">Attendance</p>
          <AttendanceBar percentage={stats.attendancePercentage} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Assignment deadlines</h2>
            <Link to="/student/assignments" className="text-sm font-medium text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {upcomingAssignments.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing due — you're all caught up.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map((a) => (
                <Link
                  key={a._id}
                  to={`/student/assignments/${a._id}`}
                  className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList size={15} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.course?.code}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${isPast(a.deadline) ? 'text-danger-700' : 'text-gray-500'}`}>
                    {formatDateTime(a.deadline)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming tests</h2>
            <Link to="/student/tests" className="text-sm font-medium text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {upcomingTests.length === 0 ? (
            <p className="text-sm text-gray-400">No tests scheduled right now.</p>
          ) : (
            <div className="space-y-3">
              {upcomingTests.map((t) => (
                <Link
                  key={t._id}
                  to={`/student/tests/${t._id}/take`}
                  className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <FileQuestion size={15} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.title}</p>
                      <p className="text-xs text-gray-400">{t.course?.code}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">Closes {formatDateTime(t.endDate)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent results</h2>
            <Link to="/student/results" className="text-sm font-medium text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {recentResults.length === 0 ? (
            <p className="text-sm text-gray-400">No published results yet.</p>
          ) : (
            <div className="space-y-3">
              {recentResults.map((r) => (
                <div key={r._id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Award size={15} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.course?.code}</p>
                    </div>
                  </div>
                  <Badge tone="primary">
                    {r.marksObtained}/{r.maxMarks}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Announcements</h2>
            <Link to="/student/announcements" className="text-sm font-medium text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((a) => (
                <div key={a._id} className="flex items-start gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <Megaphone size={15} className="mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Study materials</h2>
            <Link to="/student/materials" className="text-sm font-medium text-primary-600 hover:underline">
              View all
            </Link>
          </div>
          {recentMaterials.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentMaterials.map((m) => (
                <a key={m._id} href={m.file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <FileText size={15} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.title}</p>
                    <p className="text-xs text-gray-400">{m.course?.code}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

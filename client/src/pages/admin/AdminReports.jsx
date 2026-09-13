import { useEffect, useState, useCallback } from 'react';
import { Download, GraduationCap, Users, BookOpen, ClipboardList, FileQuestion } from 'lucide-react';

import dashboardService from '../../services/dashboardService';
import courseService from '../../services/courseService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

// Builds and downloads a CSV client-side — no backend export endpoint
// needed for a report this size; the data is already in memory from
// the courses list.
const downloadCsv = (rows, filename) => {
  const header = ['Code', 'Name', 'Department', 'Semester', 'Teacher', 'Students', 'Status'];
  const lines = rows.map((c) =>
    [c.code, c.name, c.department, c.semester, c.teacher?.name || 'Unassigned', c.studentCount, c.status]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, coursesRes] = await Promise.all([
        dashboardService.getAdminDashboard(),
        courseService.getCourses({ limit: 100 }),
      ]);
      setStats(dashRes.data.stats);
      setCourses(coursesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState message="Loading report…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Course' },
    { key: 'department', label: 'Department' },
    { key: 'semester', label: 'Semester' },
    { key: 'teacher', label: 'Teacher', render: (row) => row.teacher?.name || 'Unassigned' },
    { key: 'studentCount', label: 'Students' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Institution-wide summary, exportable as CSV."
        action={
          <Button variant="secondary" onClick={() => downloadCsv(courses, 'learnsync-courses-report.csv')}>
            <Download size={16} /> Export courses CSV
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Students" value={stats.totalStudents} icon={GraduationCap} />
        <StatCard label="Teachers" value={stats.totalTeachers} icon={Users} />
        <StatCard label="Courses" value={stats.totalCourses} icon={BookOpen} />
        <StatCard label="Active courses" value={stats.activeCourses} icon={BookOpen} />
        <StatCard label="Open assignments" value={stats.pendingAssignments} icon={ClipboardList} />
        <StatCard label="Upcoming tests" value={stats.upcomingTests} icon={FileQuestion} />
      </div>

      <h2 className="mb-3 text-base font-semibold text-gray-900">Course breakdown</h2>
      <Table columns={columns} rows={courses} emptyMessage="No courses yet." />
    </div>
  );
};

export default AdminReports;

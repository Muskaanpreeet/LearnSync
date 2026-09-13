import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import attendanceService from '../../services/attendanceService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import AttendanceBar from '../../components/common/AttendanceBar';

const StudentAttendance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceService.getMyAttendance();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading attendance…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Attendance" description={`Subject-wise attendance · warning below ${data.threshold}%`} />

      {data.data.length === 0 ? (
        <EmptyState title="No attendance recorded yet" message="Attendance will appear here once your teachers start marking it." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((row) => (
            <Link key={row.course._id} to={`/student/attendance/${row.course._id}`} className="card block transition-shadow hover:shadow-md">
              <p className="text-sm font-medium text-primary-600">{row.course.code}</p>
              <h3 className="font-semibold text-gray-900">{row.course.name}</h3>
              <p className="mb-3 mt-1 text-xs text-gray-400">
                {row.present} / {row.total} classes attended
              </p>
              <AttendanceBar percentage={row.percentage} threshold={data.threshold} belowThreshold={row.belowThreshold} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;

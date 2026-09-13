import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import attendanceService from '../../services/attendanceService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import AttendanceBar from '../../components/common/AttendanceBar';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/formatDate';

const StudentAttendanceHistory = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceService.getMyCourseHistory(courseId);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState message="Loading history…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card mb-5">
        <p className="mb-2 text-sm text-gray-500">
          {data.present} / {data.total} classes attended
        </p>
        <div className="max-w-xs">
          <AttendanceBar percentage={data.percentage} threshold={data.threshold} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.records.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-gray-400">
                  No sessions recorded yet.
                </td>
              </tr>
            ) : (
              data.records.map((r) => (
                <tr key={r.date}>
                  <td className="px-4 py-2.5">{formatDate(r.date)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={r.status === 'present' ? 'success' : 'danger'}>{r.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentAttendanceHistory;

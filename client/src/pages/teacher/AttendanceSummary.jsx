import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import attendanceService from '../../services/attendanceService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import AttendanceBar from '../../components/common/AttendanceBar';

const AttendanceSummary = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceService.getCourseSummary(courseId);
      setSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance summary');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) return <LoadingState message="Loading summary…" />;
  if (error) return <ErrorState message={error} onRetry={fetchSummary} />;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="mb-1 text-xl font-semibold text-gray-900">Attendance summary</h1>
      <p className="mb-5 text-sm text-gray-500">
        {summary.totalSessions} session{summary.totalSessions !== 1 ? 's' : ''} held so far · warning threshold {summary.threshold}%
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Student</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Present / Total</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {summary.students.map((s) => (
              <tr key={s.student._id}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-800">{s.student.name}</p>
                  <p className="text-xs text-gray-400">{s.student.rollNumber}</p>
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {s.present} / {s.total}
                </td>
                <td className="px-4 py-2.5">
                  <div className="max-w-[180px]">
                    <AttendanceBar percentage={s.percentage} threshold={summary.threshold} belowThreshold={s.belowThreshold} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceSummary;

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import testService from '../../services/testService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import { formatDateTime } from '../../utils/formatDate';

const statusTone = { 'not-started': 'neutral', 'in-progress': 'warning', submitted: 'success' };

const TestResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await testService.getTestAttempts(id);
      setAttempts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState message="Loading results…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="mb-5 text-xl font-semibold text-gray-900">Test results</h1>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Student</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Score</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attempts.map((a) => (
              <tr key={a._id || a.student._id}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-800">{a.student.name}</p>
                  <p className="text-xs text-gray-400">{a.student.rollNumber || a.student.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[a.status]}>{a.status}</Badge>
                </td>
                <td className="px-4 py-2.5">{a.score !== null && a.score !== undefined ? `${a.score} / ${a.totalMarks}` : '—'}</td>
                <td className="px-4 py-2.5">{a.submittedAt ? formatDateTime(a.submittedAt) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestResults;

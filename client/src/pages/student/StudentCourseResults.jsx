import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import resultService from '../../services/resultService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';

const typeTone = { exam: 'primary', assignment: 'warning', test: 'success' };
const gradeTone = (grade) => {
  if (['A+', 'A'].includes(grade)) return 'success';
  if (['B+', 'B'].includes(grade)) return 'primary';
  if (grade === 'C') return 'warning';
  return 'danger';
};

const StudentCourseResults = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resultService.getMyCoursePerformance(courseId);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState message="Loading results…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return null;

  const chartData = data.components.map((c) => ({
    name: c.label.length > 14 ? c.label.slice(0, 14) + '…' : c.label,
    percentage: c.max > 0 ? Math.round((c.obtained / c.max) * 1000) / 10 : 0,
  }));

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Overall</p>
          <p className="text-3xl font-bold text-gray-900">{data.percentage}%</p>
          <p className="text-xs text-gray-400">
            {data.totalObtained} / {data.totalMax} marks
          </p>
        </div>
        <Badge tone={gradeTone(data.grade)}>{data.grade}</Badge>
      </div>

      {data.components.length === 0 ? (
        <EmptyState title="No published results yet" message="Check back once your teacher publishes marks for this course." />
      ) : (
        <>
          <div className="card mb-5">
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Bar dataKey="percentage" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Component</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.components.map((c, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5">{c.label}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={typeTone[c.type]}>{c.type}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {c.obtained} / {c.max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentCourseResults;

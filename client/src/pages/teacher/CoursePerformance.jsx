import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import resultService from '../../services/resultService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

const CoursePerformance = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [examTrend, setExamTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resultService.getCoursePerformance(courseId);
      setExamTrend(res.data.examTrend);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState message="Loading performance…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="mb-1 text-xl font-semibold text-gray-900">Course performance</h1>
      <p className="mb-5 text-sm text-gray-500">Average score across each exam entered for this course.</p>

      {examTrend.length === 0 ? (
        <EmptyState title="No results yet" message="Enter marks for an exam to see performance trends." />
      ) : (
        <div className="card">
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={examTrend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Average']} />
                <Bar dataKey="averagePercentage" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePerformance;

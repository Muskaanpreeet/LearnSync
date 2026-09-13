import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import resultService from '../../services/resultService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';

const gradeTone = (grade) => {
  if (['A+', 'A'].includes(grade)) return 'success';
  if (['B+', 'B'].includes(grade)) return 'primary';
  if (grade === 'C') return 'warning';
  return 'danger';
};

const StudentResults = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resultService.getMyPerformance();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading results…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Results" description="Your combined exam, assignment, and test performance by course." />

      {data.length === 0 ? (
        <EmptyState title="No results yet" message="Results will appear here once your teachers publish marks." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((row) => (
            <Link key={row.course._id} to={`/student/results/${row.course._id}`} className="card block transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-600">{row.course.code}</p>
                  <h3 className="font-semibold text-gray-900">{row.course.name}</h3>
                </div>
                <Badge tone={gradeTone(row.grade)}>{row.grade}</Badge>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{row.percentage}%</p>
              <p className="text-xs text-gray-400">
                {row.totalObtained} / {row.totalMax} marks · {row.components.length} component{row.components.length !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentResults;

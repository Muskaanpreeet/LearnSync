import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

import testService from '../../services/testService';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatDateTime, isPast } from '../../utils/formatDate';

const statusTone = { 'not-started': 'neutral', 'in-progress': 'warning', completed: 'success', missed: 'danger' };

const StudentTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await testService.getTests({ limit: 50 });
      setTests(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      key: 'title',
      label: 'Test',
      render: (row) => (
        <span className="flex items-center gap-2 font-medium text-gray-900">
          <FileQuestion size={15} className="text-gray-400" /> {row.title}
        </span>
      ),
    },
    { key: 'course', label: 'Course', render: (row) => row.course?.code },
    { key: 'questionCount', label: 'Questions' },
    { key: 'duration', label: 'Duration', render: (row) => `${row.duration} min` },
    { key: 'endDate', label: 'Closes', render: (row) => <span className={isPast(row.endDate) ? 'text-danger-700' : ''}>{formatDateTime(row.endDate)}</span> },
    { key: 'attemptStatus', label: 'Status', render: (row) => <Badge tone={statusTone[row.attemptStatus]}>{row.attemptStatus.replace('-', ' ')}</Badge> },
    {
      key: 'action',
      label: '',
      render: (row) => {
        if (row.attemptStatus === 'completed') {
          return (
            <Link to={`/student/tests/${row._id}/result`} className="text-sm font-medium text-primary-600 hover:underline">
              View result
            </Link>
          );
        }
        if (row.attemptStatus === 'missed') return null;
        return (
          <Link to={`/student/tests/${row._id}/take`}>
            <Button variant="secondary" className="!px-3 !py-1.5 text-xs">
              {row.attemptStatus === 'in-progress' ? 'Resume' : 'Start test'}
            </Button>
          </Link>
        );
      },
    },
  ];

  if (loading) return <LoadingState message="Loading tests…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Tests" description="Tests available across your enrolled courses." />
      <Table columns={columns} rows={tests} emptyMessage="No tests available yet." />
    </div>
  );
};

export default StudentTests;

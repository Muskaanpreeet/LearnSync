import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

import assignmentService from '../../services/assignmentService';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { formatDateTime, isPast } from '../../utils/formatDate';

const statusTone = { pending: 'neutral', submitted: 'primary', late: 'warning', graded: 'success' };

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assignmentService.getAssignments({ limit: 50 });
      setAssignments(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments');
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
      label: 'Assignment',
      render: (row) => (
        <Link to={`/student/assignments/${row._id}`} className="flex items-center gap-2 font-medium text-primary-700 hover:underline">
          <FileText size={15} /> {row.title}
        </Link>
      ),
    },
    { key: 'course', label: 'Course', render: (row) => row.course?.code },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (row) => <span className={isPast(row.deadline) ? 'text-danger-700' : ''}>{formatDateTime(row.deadline)}</span>,
    },
    {
      key: 'submissionStatus',
      label: 'Status',
      render: (row) => <Badge tone={statusTone[row.submissionStatus]}>{row.submissionStatus}</Badge>,
    },
    { key: 'marks', label: 'Marks', render: (row) => (row.mySubmission?.marks ?? '—') + ` / ${row.maxMarks}` },
  ];

  if (loading) return <LoadingState message="Loading assignments…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Assignments" description="Assignments across all your enrolled courses." />
      <Table columns={columns} rows={assignments} emptyMessage="No assignments yet." />
    </div>
  );
};

export default StudentAssignments;

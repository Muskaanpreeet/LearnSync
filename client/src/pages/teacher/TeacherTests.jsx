import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, ListPlus, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import testService from '../../services/testService';
import courseService from '../../services/courseService';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDateTime } from '../../utils/formatDate';
import TestFormModal from './TestFormModal';

const statusTone = { draft: 'neutral', published: 'success' };

const TeacherTests = () => {
  const [tests, setTests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [testsRes, coursesRes] = await Promise.all([
        testService.getTests({ limit: 50 }),
        courseService.getCourses({ limit: 50 }),
      ]);
      setTests(testsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await testService.deleteTest(deleteTarget._id);
      toast.success('Test deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete test');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Test', render: (row) => <span className="font-medium text-gray-900">{row.title}</span> },
    { key: 'course', label: 'Course', render: (row) => row.course?.code },
    { key: 'questionCount', label: 'Questions' },
    { key: 'duration', label: 'Duration', render: (row) => `${row.duration} min` },
    { key: 'window', label: 'Window', render: (row) => `${formatDateTime(row.startDate)} → ${formatDateTime(row.endDate)}` },
    { key: 'status', label: 'Status', render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-3">
          <Link to={`/teacher/tests/${row._id}/questions`} className="text-gray-400 hover:text-primary-600" title="Manage questions">
            <ListPlus size={16} />
          </Link>
          <Link to={`/teacher/tests/${row._id}/results`} className="text-gray-400 hover:text-primary-600" title="View results">
            <BarChart2 size={16} />
          </Link>
          <button
            onClick={() => {
              setEditing(row);
              setFormOpen(true);
            }}
            className="text-gray-400 hover:text-primary-600"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="text-gray-400 hover:text-danger-700" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingState message="Loading tests…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader
        title="Tests"
        description="Create tests, add questions, and review results."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={courses.length === 0}
          >
            <Plus size={16} /> New test
          </Button>
        }
      />

      {courses.length === 0 ? (
        <p className="text-sm text-gray-500">You need an assigned course before creating a test.</p>
      ) : (
        <Table columns={columns} rows={tests} emptyMessage="No tests yet." />
      )}

      <TestFormModal
        open={formOpen}
        test={editing}
        courses={courses}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          fetchData();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete test"
        message={`Delete "${deleteTarget?.title}"? Its questions and any student attempts will also be removed.`}
      />
    </div>
  );
};

export default TeacherTests;

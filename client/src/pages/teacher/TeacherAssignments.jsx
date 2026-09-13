import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import assignmentService from '../../services/assignmentService';
import courseService from '../../services/courseService';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDateTime, isPast } from '../../utils/formatDate';
import AssignmentFormModal from './AssignmentFormModal';

const statusTone = { draft: 'neutral', published: 'success' };

const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
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
      const [assignmentsRes, coursesRes] = await Promise.all([
        assignmentService.getAssignments({ limit: 50 }),
        courseService.getCourses({ limit: 50 }),
      ]);
      setAssignments(assignmentsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments');
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
      await assignmentService.deleteAssignment(deleteTarget._id);
      toast.success('Assignment deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete assignment');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Assignment',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-gray-400" />
          <span className="font-medium text-gray-900">{row.title}</span>
        </div>
      ),
    },
    { key: 'course', label: 'Course', render: (row) => row.course?.code },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (row) => (
        <span className={isPast(row.deadline) ? 'text-danger-700' : ''}>{formatDateTime(row.deadline)}</span>
      ),
    },
    { key: 'maxMarks', label: 'Max marks' },
    { key: 'status', label: 'Status', render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-3">
          <Link to={`/teacher/assignments/${row._id}/submissions`} className="text-gray-400 hover:text-primary-600" title="View submissions">
            <Users size={16} />
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

  if (loading) return <LoadingState message="Loading assignments…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Create and manage assignments for your courses."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={courses.length === 0}
          >
            <Plus size={16} /> New assignment
          </Button>
        }
      />

      {courses.length === 0 ? (
        <p className="text-sm text-gray-500">You need an assigned course before creating an assignment.</p>
      ) : (
        <Table columns={columns} rows={assignments} emptyMessage="No assignments yet." />
      )}

      <AssignmentFormModal
        open={formOpen}
        assignment={editing}
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
        title="Delete assignment"
        message={`Delete "${deleteTarget?.title}"? All student submissions for it will also be removed.`}
      />
    </div>
  );
};

export default TeacherAssignments;

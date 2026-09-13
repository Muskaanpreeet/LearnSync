import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import courseService from '../../services/courseService';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CourseFormModal from './CourseFormModal';
import useDebounce from '../../hooks/useDebounce';

const statusTone = { active: 'success', inactive: 'warning', archived: 'neutral' };

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseService.getCourses({
        search: debouncedSearch || undefined,
        department: department || undefined,
        status: status || undefined,
        page,
        limit: 10,
      });
      setCourses(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, department, status, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset to page 1 whenever a filter changes so we don't end up on an
  // out-of-range page for a newly narrowed result set.
  useEffect(() => setPage(1), [debouncedSearch, department, status]);

  const handleSaved = () => {
    setFormOpen(false);
    setEditingCourse(null);
    fetchCourses();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await courseService.deleteCourse(deleteTarget._id);
      toast.success('Course deleted');
      setDeleteTarget(null);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'code', label: 'Code' },
    {
      key: 'name',
      label: 'Course',
      render: (row) => (
        <Link to={`/admin/courses/${row._id}`} className="font-medium text-primary-700 hover:underline">
          {row.name}
        </Link>
      ),
    },
    { key: 'department', label: 'Department' },
    { key: 'semester', label: 'Semester' },
    { key: 'teacher', label: 'Teacher', render: (row) => row.teacher?.name || <span className="text-gray-400">Unassigned</span> },
    { key: 'studentCount', label: 'Students', render: (row) => (
      <span className="inline-flex items-center gap-1"><Users size={14} />{row.studentCount}</span>
    ) },
    { key: 'status', label: 'Status', render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingCourse(row);
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

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Create courses, assign teachers, and manage enrollment."
        action={
          <Button
            onClick={() => {
              setEditingCourse(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> New course
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or code…" />
        <select className="input-field" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Electronics">Electronics</option>
          <option value="Mechanical">Mechanical</option>
        </select>
        <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading courses…" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCourses} />
      ) : (
        <>
          <Table columns={columns} rows={courses} emptyMessage="No courses match your filters." />
          <Pagination {...pagination} onPageChange={setPage} />
        </>
      )}

      <CourseFormModal
        open={formOpen}
        course={editingCourse}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete course"
        message={`Delete "${deleteTarget?.name}"? This will remove it from all enrolled students and the assigned teacher.`}
      />
    </div>
  );
};

export default AdminCourses;

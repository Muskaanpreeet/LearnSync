import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Ban, CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import userService from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import useDebounce from '../../hooks/useDebounce';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getUsers({
        role: 'student',
        search: debouncedSearch || undefined,
        status: status || undefined,
        page,
        limit: 10,
      });
      setStudents(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => setPage(1), [debouncedSearch, status]);

  const toggleStatus = async (student) => {
    try {
      await userService.setStatus(student._id, !student.isActive);
      toast.success(student.isActive ? 'Account deactivated' : 'Account activated');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userService.deleteUser(deleteTarget._id);
      toast.success('Student deleted');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <Link to={`/admin/students/${row._id}`} className="font-medium text-primary-700 hover:underline">
          {row.name}
        </Link>
      ),
    },
    { key: 'rollNumber', label: 'Roll number', render: (row) => row.rollNumber || '—' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department', render: (row) => row.department || '—' },
    { key: 'semester', label: 'Semester', render: (row) => row.semester || '—' },
    { key: 'isActive', label: 'Status', render: (row) => <Badge tone={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'active' : 'inactive'}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={() => toggleStatus(row)}
            className={row.isActive ? 'text-gray-400 hover:text-warning-700' : 'text-gray-400 hover:text-success-700'}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
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
      <PageHeader title="Students" description="Manage student accounts across the platform." />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or roll number…" />
        <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading students…" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchStudents} />
      ) : (
        <>
          <Table columns={columns} rows={students} emptyMessage="No students match your filters." />
          <Pagination {...pagination} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete student"
        message={`Delete ${deleteTarget?.name}'s account? This cannot be undone.`}
      />
    </div>
  );
};

export default AdminStudents;

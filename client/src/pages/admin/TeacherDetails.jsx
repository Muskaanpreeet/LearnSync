import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, BookOpen, Ban, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

import userService from '../../services/userService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';

const TeacherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeacher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getUserById(id);
      setTeacher(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teacher');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  const toggleStatus = async () => {
    try {
      await userService.setStatus(teacher._id, !teacher.isActive);
      toast.success(teacher.isActive ? 'Account deactivated' : 'Account activated');
      fetchTeacher();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <LoadingState message="Loading teacher…" />;
  if (error) return <ErrorState message={error} onRetry={fetchTeacher} />;
  if (!teacher) return null;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={teacher.name} size={56} />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{teacher.name}</h1>
              <p className="text-sm text-gray-500">{teacher.designation || 'No designation set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={teacher.isActive ? 'success' : 'neutral'}>{teacher.isActive ? 'active' : 'inactive'}</Badge>
            <Button variant="secondary" onClick={toggleStatus}>
              {teacher.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
              {teacher.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <Mail size={14} className="text-gray-400" /> {teacher.email}
            </p>
          </div>
          {teacher.phone && (
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <Phone size={14} className="text-gray-400" /> {teacher.phone}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Department</p>
            <p className="text-sm font-medium text-gray-800">{teacher.department || '—'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Assigned courses ({teacher.assignedCourses?.length || 0})</h2>
        {!teacher.assignedCourses || teacher.assignedCourses.length === 0 ? (
          <p className="text-sm text-gray-400">Not assigned to any courses yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teacher.assignedCourses.map((c) => (
              <Link key={c._id} to={`/admin/courses/${c._id}`} className="card flex items-center gap-3 transition-shadow hover:shadow-md">
                <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
                  <BookOpen size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.code}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDetails;

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

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getUserById(id);
      setStudent(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load student');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const toggleStatus = async () => {
    try {
      await userService.setStatus(student._id, !student.isActive);
      toast.success(student.isActive ? 'Account deactivated' : 'Account activated');
      fetchStudent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <LoadingState message="Loading student…" />;
  if (error) return <ErrorState message={error} onRetry={fetchStudent} />;
  if (!student) return null;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} size={56} />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{student.name}</h1>
              <p className="text-sm text-gray-500">{student.rollNumber || 'No roll number'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={student.isActive ? 'success' : 'neutral'}>{student.isActive ? 'active' : 'inactive'}</Badge>
            <Button variant="secondary" onClick={toggleStatus}>
              {student.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
              {student.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <Mail size={14} className="text-gray-400" /> {student.email}
            </p>
          </div>
          {student.phone && (
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <Phone size={14} className="text-gray-400" /> {student.phone}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Department</p>
            <p className="text-sm font-medium text-gray-800">{student.department || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Semester</p>
            <p className="text-sm font-medium text-gray-800">{student.semester || '—'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Enrolled courses ({student.enrolledCourses?.length || 0})</h2>
        {!student.enrolledCourses || student.enrolledCourses.length === 0 ? (
          <p className="text-sm text-gray-400">Not enrolled in any courses yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {student.enrolledCourses.map((c) => (
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

export default StudentDetails;

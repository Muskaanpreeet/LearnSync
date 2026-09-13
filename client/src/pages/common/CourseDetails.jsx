import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

import courseService from '../../services/courseService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const statusTone = { active: 'success', inactive: 'warning', archived: 'neutral' };

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selected, setSelected] = useState([]);

  const fetchCourse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseService.getCourseById(id);
      setCourse(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openEnroll = async () => {
    const res = await userService.getUsers({ role: 'student', limit: 200 });
    const enrolledIds = new Set(course.students.map((s) => s._id));
    setAvailableStudents(res.data.filter((s) => !enrolledIds.has(s._id)));
    setSelected([]);
    setEnrollOpen(true);
  };

  const toggleSelect = (studentId) => {
    setSelected((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
  };

  const handleEnroll = async () => {
    try {
      await courseService.enrollStudents(id, selected);
      toast.success(`${selected.length} student(s) enrolled`);
      setEnrollOpen(false);
      fetchCourse();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll students');
    }
  };

  if (loading) return <LoadingState message="Loading course…" />;
  if (error) return <ErrorState message={error} onRetry={fetchCourse} />;
  if (!course) return null;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary-600">{course.code}</p>
            <h1 className="text-xl font-semibold text-gray-900">{course.name}</h1>
          </div>
          <Badge tone={statusTone[course.status]}>{course.status}</Badge>
        </div>

        {course.description && <p className="mt-3 text-sm text-gray-600">{course.description}</p>}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">Department</p>
            <p className="text-sm font-medium text-gray-800">{course.department}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Semester</p>
            <p className="text-sm font-medium text-gray-800">{course.semester}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Credits</p>
            <p className="text-sm font-medium text-gray-800">{course.credits}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Teacher</p>
            <p className="text-sm font-medium text-gray-800">{course.teacher?.name || 'Unassigned'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Enrolled students ({course.students.length})</h2>
          {role === 'admin' && (
            <Button onClick={openEnroll}>
              <Plus size={16} /> Enroll students
            </Button>
          )}
        </div>

        {course.students.length === 0 ? (
          <p className="text-sm text-gray-400">No students enrolled yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Roll number</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {course.students.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-2.5">{s.name}</td>
                    <td className="px-4 py-2.5">{s.rollNumber || '—'}</td>
                    <td className="px-4 py-2.5">{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={enrollOpen} onClose={() => setEnrollOpen(false)} title="Enroll students">
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {availableStudents.length === 0 ? (
            <p className="text-sm text-gray-400">All students are already enrolled.</p>
          ) : (
            availableStudents.map((s) => (
              <label key={s._id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
                <input type="checkbox" checked={selected.includes(s._id)} onChange={() => toggleSelect(s._id)} />
                <span className="text-sm text-gray-700">
                  {s.name} <span className="text-gray-400">({s.rollNumber || s.email})</span>
                </span>
              </label>
            ))
          )}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setEnrollOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={selected.length === 0}>
            Enroll {selected.length > 0 ? `(${selected.length})` : ''}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDetails;

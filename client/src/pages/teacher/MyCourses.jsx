import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen } from 'lucide-react';

import courseService from '../../services/courseService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';

const statusTone = { active: 'success', inactive: 'warning', archived: 'neutral' };

// Teacher's course list is intentionally read-only here — the backend
// already scopes GET /api/courses to `teacher: req.user._id` for this
// role, so no client-side filtering is needed to keep it correct.
const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseService.getCourses({ limit: 50 });
      setCourses(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) return <LoadingState message="Loading your courses…" />;
  if (error) return <ErrorState message={error} onRetry={fetchCourses} />;

  return (
    <div>
      <PageHeader title="My Courses" description="Courses you are currently assigned to teach." />

      {courses.length === 0 ? (
        <EmptyState title="No courses assigned yet" message="An admin will assign courses to you." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c._id} to={`/teacher/courses/${c._id}`} className="card transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
                  <BookOpen size={18} />
                </div>
                <Badge tone={statusTone[c.status]}>{c.status}</Badge>
              </div>
              <p className="mt-3 text-sm font-medium text-primary-600">{c.code}</p>
              <h3 className="font-semibold text-gray-900">{c.name}</h3>
              <p className="mt-1 text-xs text-gray-400">{c.department} · Semester {c.semester}</p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                <Users size={14} /> {c.studentCount} students
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;

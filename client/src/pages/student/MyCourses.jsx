import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

import courseService from '../../services/courseService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';

// Backend scopes GET /api/courses to `students: req.user._id` for the
// student role, so this list is already exactly "my enrolled courses".
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
      <PageHeader title="My Courses" description="Courses you are currently enrolled in." />

      {courses.length === 0 ? (
        <EmptyState title="Not enrolled in any courses yet" message="An admin will enroll you into your courses." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c._id} to={`/student/courses/${c._id}`} className="card transition-shadow hover:shadow-md">
              <div className="rounded-lg bg-primary-50 p-2 text-primary-600 w-fit">
                <BookOpen size={18} />
              </div>
              <p className="mt-3 text-sm font-medium text-primary-600">{c.code}</p>
              <h3 className="font-semibold text-gray-900">{c.name}</h3>
              <p className="mt-1 text-xs text-gray-400">{c.department} · Semester {c.semester}</p>
              <p className="mt-3 text-sm text-gray-500">Taught by {c.teacher?.name || 'TBA'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;

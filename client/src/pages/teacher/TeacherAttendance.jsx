import { useEffect, useState, useCallback } from 'react';
import { Check, X, Save, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import courseService from '../../services/courseService';
import attendanceService from '../../services/attendanceService';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

const todayISO = () => new Date().toISOString().slice(0, 10);

const TeacherAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(todayISO());

  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    courseService.getCourses({ limit: 50 }).then((res) => {
      setCourses(res.data);
      if (res.data.length > 0) setCourseId(res.data[0]._id);
    });
  }, []);

  const fetchRoster = useCallback(async () => {
    if (!courseId || !date) return;
    setLoadingRoster(true);
    try {
      const res = await attendanceService.getSessionRoster(courseId, date);
      // Default anyone not yet marked to "present" — most classes mark
      // exceptions (absentees) rather than starting from a blank slate.
      setRoster(res.data.roster.map((r) => ({ ...r, status: r.status || 'present' })));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load roster');
    } finally {
      setLoadingRoster(false);
    }
  }, [courseId, date]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const setStatus = (studentId, status) => {
    setRoster((prev) => prev.map((r) => (r.student._id === studentId ? { ...r, status } : r)));
  };

  const markAll = (status) => setRoster((prev) => prev.map((r) => ({ ...r, status })));

  const handleSave = async () => {
    setSaving(true);
    try {
      await attendanceService.markAttendance(
        courseId,
        date,
        roster.map((r) => ({ student: r.student._id, status: r.status }))
      );
      toast.success('Attendance saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'present').length;

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark and edit attendance for a course session."
        action={
          courseId && (
            <Link to={`/teacher/attendance/${courseId}/summary`} className="btn-secondary">
              <ListChecks size={16} /> View summary
            </Link>
          )
        }
      />

      {courses.length === 0 ? (
        <EmptyState title="No courses assigned" message="You need an assigned course to take attendance." />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Course</label>
              <select className="input-field" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
              <input type="date" className="input-field" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="secondary" onClick={() => markAll('present')} className="w-full">
                Mark all present
              </Button>
              <Button variant="secondary" onClick={() => markAll('absent')} className="w-full">
                Mark all absent
              </Button>
            </div>
          </div>

          {loadingRoster ? (
            <LoadingState message="Loading roster…" />
          ) : roster.length === 0 ? (
            <EmptyState title="No students enrolled" message="Enroll students into this course first." />
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Student</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Roll number</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {roster.map((r) => (
                      <tr key={r.student._id}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{r.student.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{r.student.rollNumber || '—'}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setStatus(r.student._id, 'present')}
                              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                                r.status === 'present' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              <Check size={13} /> Present
                            </button>
                            <button
                              onClick={() => setStatus(r.student._id, 'absent')}
                              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                                r.status === 'absent' ? 'bg-danger-50 text-danger-700' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              <X size={13} /> Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {presentCount} of {roster.length} marked present
                </p>
                <Button onClick={handleSave} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving…' : 'Save attendance'}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherAttendance;

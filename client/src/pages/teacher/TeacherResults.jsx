import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import courseService from '../../services/courseService';
import resultService from '../../services/resultService';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EnterMarksModal from './EnterMarksModal';

const typeTone = { midterm: 'primary', final: 'danger', internal: 'warning', other: 'neutral' };
const statusTone = { draft: 'neutral', published: 'success' };

const TeacherResults = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    courseService.getCourses({ limit: 50 }).then((res) => {
      setCourses(res.data);
      if (res.data.length > 0) setCourseId(res.data[0]._id);
    });
  }, []);

  const fetchExams = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await resultService.getCourseExams(courseId);
      setExams(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleDelete = async () => {
    try {
      await resultService.deleteExam(courseId, deleteTarget.title);
      toast.success('Exam deleted');
      setDeleteTarget(null);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  const columns = [
    { key: 'title', label: 'Exam' },
    { key: 'examType', label: 'Type', render: (row) => <Badge tone={typeTone[row.examType]}>{row.examType}</Badge> },
    { key: 'maxMarks', label: 'Max marks' },
    { key: 'studentCount', label: 'Entries' },
    { key: 'average', label: 'Average', render: (row) => `${row.average} / ${row.maxMarks}` },
    { key: 'status', label: 'Status', render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingTitle(row.title);
              setModalOpen(true);
            }}
            className="text-gray-400 hover:text-primary-600"
            title="Edit marks"
          >
            <Pencil size={16} />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="text-gray-400 hover:text-danger-700" title="Delete exam">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Results & Marks"
        description="Enter and manage exam marks, and view course performance."
        action={
          courseId && (
            <div className="flex gap-2">
              <Link to={`/teacher/results/${courseId}/performance`} className="btn-secondary">
                <BarChart2 size={16} /> Performance
              </Link>
              <Button
                onClick={() => {
                  setEditingTitle(null);
                  setModalOpen(true);
                }}
              >
                <Plus size={16} /> New exam
              </Button>
            </div>
          )
        }
      />

      {courses.length === 0 ? (
        <EmptyState title="No courses assigned" message="You need an assigned course to enter results." />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <select className="input-field" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingState message="Loading results…" />
          ) : (
            <Table columns={columns} rows={exams} rowKey="title" emptyMessage="No exams entered yet for this course." />
          )}
        </>
      )}

      <EnterMarksModal
        open={modalOpen}
        courseId={courseId}
        title={editingTitle}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          fetchExams();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete exam"
        message={`Delete "${deleteTarget?.title}"? This removes marks for every student.`}
      />
    </div>
  );
};

export default TeacherResults;

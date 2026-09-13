import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

import assignmentService from '../../services/assignmentService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { formatDateTime } from '../../utils/formatDate';

const statusTone = { pending: 'neutral', submitted: 'primary', late: 'warning', graded: 'success' };

const AssignmentSubmissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [grading, setGrading] = useState(null); // submission being graded
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        assignmentService.getAssignmentById(id),
        assignmentService.getSubmissions(id),
      ]);
      setAssignment(assignmentRes.data);
      setSubmissions(submissionsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openGrade = (submission) => {
    setGrading(submission);
    setMarks(submission.marks ?? '');
    setFeedback(submission.feedback ?? '');
  };

  const handleGrade = async () => {
    setSaving(true);
    try {
      await assignmentService.gradeSubmission(grading._id, { marks: Number(marks), feedback });
      toast.success('Grade saved');
      setGrading(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading submissions…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-5">
        <p className="text-sm font-medium text-primary-600">{assignment.course?.code}</p>
        <h1 className="text-xl font-semibold text-gray-900">{assignment.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Deadline {formatDateTime(assignment.deadline)} · Max marks {assignment.maxMarks}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Student</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Submitted</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">Marks</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500">File</th>
              <th className="px-4 py-2.5 text-left font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map((s) => (
              <tr key={s._id || s.student._id}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-gray-800">{s.student.name}</p>
                  <p className="text-xs text-gray-400">{s.student.rollNumber || s.student.email}</p>
                </td>
                <td className="px-4 py-2.5">{s.submittedAt ? formatDateTime(s.submittedAt) : '—'}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                </td>
                <td className="px-4 py-2.5">{s.marks ?? '—'}</td>
                <td className="px-4 py-2.5">
                  {s.file ? (
                    <a href={s.file.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                      View <ExternalLink size={13} />
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {s._id && (
                    <button onClick={() => openGrade(s)} className="text-sm font-medium text-primary-600 hover:underline">
                      {s.status === 'graded' ? 'Edit grade' : 'Grade'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!grading} onClose={() => setGrading(null)} title={`Grade — ${grading?.student?.name || ''}`} maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Marks (out of {assignment.maxMarks})</label>
            <input
              type="number"
              min={0}
              max={assignment.maxMarks}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Feedback</label>
            <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="input-field" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setGrading(null)}>
              Cancel
            </Button>
            <Button onClick={handleGrade} disabled={saving || marks === ''}>
              {saving ? 'Saving…' : 'Save grade'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssignmentSubmissions;

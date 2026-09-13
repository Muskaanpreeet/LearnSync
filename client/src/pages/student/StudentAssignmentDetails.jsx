import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Paperclip, ExternalLink, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';

import assignmentService from '../../services/assignmentService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { formatDateTime, isPast } from '../../utils/formatDate';

const statusTone = { pending: 'neutral', submitted: 'primary', late: 'warning', graded: 'success' };

const StudentAssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // The list endpoint already annotates each assignment with the
  // student's own submission — reuse that instead of a separate call.
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, listRes] = await Promise.all([
        assignmentService.getAssignmentById(id),
        assignmentService.getAssignments({ limit: 100 }),
      ]);
      setAssignment(detailRes.data);
      const match = listRes.data.find((a) => a._id === id);
      setMySubmission(match || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await assignmentService.submitAssignment(id, formData);
      toast.success('Assignment submitted');
      setFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading assignment…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!assignment) return null;

  const status = mySubmission?.submissionStatus || 'pending';
  const deadlinePassed = isPast(assignment.deadline);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary-600">{assignment.course?.code}</p>
            <h1 className="text-xl font-semibold text-gray-900">{assignment.title}</h1>
          </div>
          <Badge tone={statusTone[status]}>{status}</Badge>
        </div>

        {assignment.description && <p className="mt-3 text-sm text-gray-600">{assignment.description}</p>}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-400">Deadline</p>
            <p className={`text-sm font-medium ${deadlinePassed ? 'text-danger-700' : 'text-gray-800'}`}>
              {formatDateTime(assignment.deadline)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Max marks</p>
            <p className="text-sm font-medium text-gray-800">{assignment.maxMarks}</p>
          </div>
          {assignment.attachment?.url && (
            <div>
              <p className="text-xs text-gray-400">Assignment file</p>
              <a href={assignment.attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
                <Paperclip size={14} /> {assignment.attachment.originalName || 'Download'}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-5">
        <h2 className="font-semibold text-gray-900">Your submission</h2>

        {mySubmission?.mySubmission ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-gray-600">
              Submitted {formatDateTime(mySubmission.mySubmission.submittedAt)}
            </p>
            {mySubmission.mySubmission.status === 'graded' && (
              <div className="rounded-lg bg-success-50 p-3">
                <p className="font-medium text-success-700">
                  Grade: {mySubmission.mySubmission.marks} / {assignment.maxMarks}
                </p>
                {mySubmission.mySubmission.feedback && (
                  <p className="mt-1 text-gray-600">Feedback: {mySubmission.mySubmission.feedback}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-500">You haven't submitted this assignment yet.</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3.5 py-2.5 text-sm text-gray-500 hover:bg-gray-50">
            <UploadCloud size={16} />
            {file ? file.name : 'Choose a file to submit'}
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <Button onClick={handleSubmit} disabled={!file || submitting}>
            {submitting ? 'Submitting…' : mySubmission?.mySubmission ? 'Resubmit' : 'Submit'}
          </Button>
        </div>
        {deadlinePassed && <p className="mt-2 text-xs text-warning-700">The deadline has passed — this will be marked late.</p>}
      </div>
    </div>
  );
};

export default StudentAssignmentDetails;

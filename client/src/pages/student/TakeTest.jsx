import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';

import testService from '../../services/testService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const formatRemaining = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null); // { test, questions, deadline }
  const [answers, setAnswers] = useState({}); // questionId -> selectedOptionIndex
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const buildAnswersArray = useCallback(
    (source) => session.questions.map((q) => ({ question: q._id, selectedOptionIndex: source[q._id] ?? null })),
    [session]
  );

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await testService.submitTest(id, buildAnswersArray(answers));
      toast.success('Test submitted');
      if (res.data?.score !== undefined) {
        navigate(`/student/tests/${id}/result`);
      } else {
        navigate('/student/tests');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit test');
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [answers, buildAnswersArray, id, navigate]);

  useEffect(() => {
    testService
      .startTest(id)
      .then((res) => {
        setSession(res.data);
        const initial = {};
        (res.data.existingAnswers || []).forEach((a) => {
          if (a.selectedOptionIndex !== null) initial[a.question] = a.selectedOptionIndex;
        });
        setAnswers(initial);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to start test'))
      .finally(() => setLoading(false));
  }, [id]);

  // Countdown timer, driven by the server-issued deadline (not a
  // client-side timer that could be reset by refreshing) — auto-submits at zero.
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const ms = new Date(session.deadline).getTime() - Date.now();
      setRemainingMs(ms);
      if (ms <= 0) doSubmit();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session, doSubmit]);

  if (loading) return <LoadingState message="Loading test…" />;
  if (error) return <ErrorState message={error} />;
  if (!session) return null;

  const question = session.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex === session.questions.length - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">{session.test.title}</h1>
        <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${remainingMs < 60000 ? 'bg-danger-50 text-danger-700' : 'bg-primary-50 text-primary-700'}`}>
          <Clock size={15} /> {formatRemaining(remainingMs)}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {session.questions.map((q, i) => (
          <button
            key={q._id}
            onClick={() => setCurrentIndex(i)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${
              i === currentIndex
                ? 'bg-primary-600 text-white'
                : answers[q._id] !== undefined
                ? 'bg-success-50 text-success-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="card">
        <p className="text-xs font-medium text-gray-400">
          Question {currentIndex + 1} of {session.questions.length}
        </p>
        <p className="mt-2 font-medium text-gray-900">{question.text}</p>

        <div className="mt-4 space-y-2">
          {question.options.map((opt, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${
                answers[question._id] === i ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                checked={answers[question._id] === i}
                onChange={() => setAnswers((prev) => ({ ...prev, [question._id]: i }))}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <Button variant="secondary" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
          Previous
        </Button>
        <p className="text-sm text-gray-500">{answeredCount} / {session.questions.length} answered</p>
        {isLast ? (
          <Button onClick={() => setConfirmOpen(true)}>Submit test</Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => Math.min(session.questions.length - 1, i + 1))}>Next</Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSubmit}
        loading={submitting}
        confirmLabel="Submit"
        title="Submit test?"
        message={`You've answered ${answeredCount} of ${session.questions.length} questions. Once submitted, you can't change your answers.`}
      />
    </div>
  );
};

export default TakeTest;

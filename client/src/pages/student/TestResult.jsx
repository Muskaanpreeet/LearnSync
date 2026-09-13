import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock } from 'lucide-react';

import testService from '../../services/testService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const TestResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResult = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await testService.getMyResult(id);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (loading) return <LoadingState message="Loading result…" />;
  if (error) return <ErrorState message={error} onRetry={fetchResult} />;
  if (!result) return null;

  if (!result.visible) {
    return (
      <div className="mx-auto max-w-md text-center">
        <Clock className="mx-auto mb-3 text-gray-300" size={32} />
        <p className="text-gray-600">{result.message}</p>
      </div>
    );
  }

  const percentage = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card mb-5 text-center">
        <p className="text-sm text-gray-500">Your score</p>
        <p className="text-4xl font-bold text-primary-600">
          {result.score} <span className="text-lg text-gray-400">/ {result.totalMarks}</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">{percentage}%</p>
      </div>

      <div className="space-y-3">
        {result.questions.map((q, idx) => {
          const isCorrect = q.selectedOptionIndex === q.correctOptionIndex;
          return (
            <div key={idx} className="card">
              <p className="font-medium text-gray-900">
                {idx + 1}. {q.text}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {q.options.map((opt, i) => {
                  const isSelected = q.selectedOptionIndex === i;
                  const isAnswer = q.correctOptionIndex === i;
                  return (
                    <li
                      key={i}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                        isAnswer ? 'bg-success-50 text-success-700' : isSelected ? 'bg-danger-50 text-danger-700' : 'text-gray-600'
                      }`}
                    >
                      {isAnswer ? <Check size={14} /> : isSelected ? <X size={14} /> : <span className="w-3.5" />}
                      {opt}
                    </li>
                  );
                })}
              </ul>
              <p className={`mt-2 text-xs font-medium ${isCorrect ? 'text-success-700' : 'text-danger-700'}`}>
                {isCorrect ? `+${q.marks} marks` : '0 marks'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TestResult;

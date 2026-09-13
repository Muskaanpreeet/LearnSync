import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

import testService from '../../services/testService';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const emptyForm = { text: '', options: ['', ''], correctOptionIndex: 0, marks: 1 };

const ManageQuestions = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await testService.getTestById(id);
      setTest(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  const openAdd = () => {
    setEditingQuestion(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (q) => {
    setEditingQuestion(q);
    setForm({ text: q.text, options: q.options, correctOptionIndex: q.correctOptionIndex, marks: q.marks });
    setFormOpen(true);
  };

  const updateOption = (i, value) => {
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? value : o)) }));
  };

  const addOption = () => setForm((f) => (f.options.length < 6 ? { ...f, options: [...f.options, ''] } : f));
  const removeOption = (i) =>
    setForm((f) => ({
      ...f,
      options: f.options.filter((_, idx) => idx !== i),
      correctOptionIndex: f.correctOptionIndex >= f.options.length - 1 ? 0 : f.correctOptionIndex,
    }));

  const handleSave = async () => {
    if (!form.text.trim() || form.options.some((o) => !o.trim())) {
      toast.error('Fill in the question text and all options');
      return;
    }
    setSaving(true);
    try {
      if (editingQuestion) {
        await testService.updateQuestion(editingQuestion._id, form);
        toast.success('Question updated');
      } else {
        await testService.addQuestion(id, form);
        toast.success('Question added');
      }
      setFormOpen(false);
      fetchTest();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await testService.deleteQuestion(deleteTarget._id);
      toast.success('Question deleted');
      setDeleteTarget(null);
      fetchTest();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete question');
    }
  };

  if (loading) return <LoadingState message="Loading test…" />;
  if (error) return <ErrorState message={error} onRetry={fetchTest} />;

  const totalMarks = test.questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{test.title} — Questions</h1>
          <p className="text-sm text-gray-500">
            {test.questions.length} question{test.questions.length !== 1 ? 's' : ''} · {totalMarks} total marks
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} /> Add question
        </Button>
      </div>

      {test.questions.length === 0 ? (
        <EmptyState title="No questions yet" message="Add your first question to this test." />
      ) : (
        <div className="space-y-3">
          {test.questions.map((q, idx) => (
            <div key={q._id} className="card">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-gray-900">
                  {idx + 1}. {q.text} <span className="text-xs font-normal text-gray-400">({q.marks} marks)</span>
                </p>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => openEdit(q)} className="text-gray-400 hover:text-primary-600">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteTarget(q)} className="text-gray-400 hover:text-danger-700">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {q.options.map((opt, i) => (
                  <li key={i} className={`flex items-center gap-2 text-sm ${i === q.correctOptionIndex ? 'text-success-700' : 'text-gray-600'}`}>
                    {i === q.correctOptionIndex && <Check size={14} />}
                    {opt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingQuestion ? 'Edit question' : 'Add question'}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Question text</label>
            <textarea
              rows={2}
              className="input-field"
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Options (select the correct one)</label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.correctOptionIndex === i}
                    onChange={() => setForm((f) => ({ ...f, correctOptionIndex: i }))}
                  />
                  <input
                    className="input-field flex-1"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                  />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="text-gray-400 hover:text-danger-700">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {form.options.length < 6 && (
              <button type="button" onClick={addOption} className="mt-2 text-sm font-medium text-primary-600 hover:underline">
                + Add option
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Marks</label>
            <input
              type="number"
              min={1}
              className="input-field w-32"
              value={form.marks}
              onChange={(e) => setForm((f) => ({ ...f, marks: Number(e.target.value) }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save question'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete question"
        message="Delete this question from the test?"
      />
    </div>
  );
};

export default ManageQuestions;

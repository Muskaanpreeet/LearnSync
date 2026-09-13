import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import resultService from '../../services/resultService';

const EnterMarksModal = ({ open, courseId, title, onClose, onSaved }) => {
  const isEdit = !!title;
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState('other');
  const [maxMarks, setMaxMarks] = useState(100);
  const [status, setStatus] = useState('draft');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !courseId) return;

    if (isEdit) {
      setLoading(true);
      resultService
        .getExamRoster(courseId, title)
        .then((res) => {
          setExamTitle(title);
          setExamType(res.data.examType);
          setMaxMarks(res.data.maxMarks);
          setStatus(res.data.status);
          setRoster(res.data.roster);
        })
        .catch((err) => toast.error(err.response?.data?.message || 'Failed to load roster'))
        .finally(() => setLoading(false));
    } else {
      setExamTitle('');
      setExamType('other');
      setMaxMarks(100);
      setStatus('draft');
      setRoster([]);
    }
  }, [open, courseId, title, isEdit]);

  // Loading a fresh (non-edit) roster requires knowing the enrolled
  // students, which the roster endpoint also provides once a title is
  // known — for a brand-new exam we lazily fetch after the teacher
  // types a title and clicks "Load roster".
  const loadRosterForNewExam = async () => {
    if (!examTitle.trim()) {
      toast.error('Enter an exam title first');
      return;
    }
    setLoading(true);
    try {
      const res = await resultService.getExamRoster(courseId, examTitle.trim());
      setRoster(res.data.roster);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  };

  const updateMark = (studentId, value) => {
    setRoster((prev) => prev.map((r) => (r.student._id === studentId ? { ...r, marksObtained: value } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await resultService.enterMarks({
        course: courseId,
        title: examTitle.trim(),
        examType,
        maxMarks: Number(maxMarks),
        status,
        records: roster.map((r) => ({ student: r.student._id, marksObtained: r.marksObtained === '' ? null : Number(r.marksObtained) })),
      });
      toast.success('Marks saved');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit marks — ${title}` : 'Enter marks'} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Exam title</label>
            <input className="input-field" disabled={isEdit} value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="e.g. Midterm Exam" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <select className="input-field" value={examType} onChange={(e) => setExamType(e.target.value)}>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="internal">Internal</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Max marks</label>
            <input type="number" min={1} className="input-field" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
          </div>
        </div>

        {!isEdit && roster.length === 0 && (
          <Button variant="secondary" onClick={loadRosterForNewExam} disabled={loading}>
            {loading ? 'Loading…' : 'Load student roster'}
          </Button>
        )}

        {roster.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Student</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Marks (/ {maxMarks || '—'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roster.map((r) => (
                  <tr key={r.student._id}>
                    <td className="px-3 py-2">{r.student.name}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={maxMarks}
                        className="input-field w-24 !py-1.5"
                        value={r.marksObtained ?? ''}
                        onChange={(e) => updateMark(r.student._id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Visibility</label>
          <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">Draft (hidden from students)</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || roster.length === 0}>
            {saving ? 'Saving…' : 'Save marks'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EnterMarksModal;

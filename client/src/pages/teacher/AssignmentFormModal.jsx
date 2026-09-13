import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Paperclip } from 'lucide-react';

import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import assignmentService from '../../services/assignmentService';

const AssignmentFormModal = ({ open, assignment, courses, onClose, onSaved }) => {
  const isEdit = !!assignment;
  const [file, setFile] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    setFile(null);
    if (assignment) {
      reset({
        title: assignment.title,
        description: assignment.description,
        course: assignment.course?._id || assignment.course,
        // datetime-local input needs "YYYY-MM-DDTHH:mm"
        deadline: new Date(assignment.deadline).toISOString().slice(0, 16),
        maxMarks: assignment.maxMarks,
        status: assignment.status,
      });
    } else {
      reset({
        title: '',
        description: '',
        course: courses[0]?._id || '',
        deadline: '',
        maxMarks: 100,
        status: 'draft',
      });
    }
  }, [assignment, courses, reset]);

  const onSubmit = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    if (file) formData.append('attachment', file);

    try {
      if (isEdit) {
        await assignmentService.updateAssignment(assignment._id, formData);
        toast.success('Assignment updated');
      } else {
        await assignmentService.createAssignment(formData);
        toast.success('Assignment created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save assignment');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit assignment' : 'New assignment'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input className="input-field" {...register('title', { required: 'Required' })} />
          {errors.title && <p className="mt-1 text-xs text-danger-700">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea rows={3} className="input-field" {...register('description')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Course</label>
            <select className="input-field" disabled={isEdit} {...register('course', { required: true })}>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Max marks</label>
            <input type="number" min={1} className="input-field" {...register('maxMarks', { required: true, valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Deadline</label>
            <input type="datetime-local" className="input-field" {...register('deadline', { required: 'Required' })} />
            {errors.deadline && <p className="mt-1 text-xs text-danger-700">{errors.deadline.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select className="input-field" {...register('status')}>
              <option value="draft">Draft (hidden from students)</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Attachment (optional)</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3.5 py-2.5 text-sm text-gray-500 hover:bg-gray-50">
            <Paperclip size={16} />
            {file ? file.name : assignment?.attachment?.originalName || 'Choose a file (PDF, DOC, PPT…)'}
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignmentFormModal;

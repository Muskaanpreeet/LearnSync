import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import testService from '../../services/testService';

const toLocalInput = (date) => new Date(date).toISOString().slice(0, 16);

const TestFormModal = ({ open, test, courses, onClose, onSaved }) => {
  const isEdit = !!test;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (test) {
      reset({
        title: test.title,
        description: test.description,
        course: test.course?._id || test.course,
        duration: test.duration,
        startDate: toLocalInput(test.startDate),
        endDate: toLocalInput(test.endDate),
        status: test.status,
        resultVisibility: test.resultVisibility,
      });
    } else {
      reset({
        title: '',
        description: '',
        course: courses[0]?._id || '',
        duration: 30,
        startDate: '',
        endDate: '',
        status: 'draft',
        resultVisibility: 'immediate',
      });
    }
  }, [test, courses, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await testService.updateTest(test._id, data);
        toast.success('Test updated');
      } else {
        await testService.createTest(data);
        toast.success('Test created — add questions next');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save test');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit test' : 'New test'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input className="input-field" {...register('title', { required: 'Required' })} />
          {errors.title && <p className="mt-1 text-xs text-danger-700">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea rows={2} className="input-field" {...register('description')} />
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input type="number" min={1} className="input-field" {...register('duration', { required: true, valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Start date/time</label>
            <input type="datetime-local" className="input-field" {...register('startDate', { required: 'Required' })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">End date/time</label>
            <input type="datetime-local" className="input-field" {...register('endDate', { required: 'Required' })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select className="input-field" {...register('status')}>
              <option value="draft">Draft (hidden from students)</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Show results</label>
            <select className="input-field" {...register('resultVisibility')}>
              <option value="immediate">Immediately after submitting</option>
              <option value="after_end">Only after the test window closes</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create test'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TestFormModal;

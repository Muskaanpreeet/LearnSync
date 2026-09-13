import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import courseService from '../../services/courseService';
import userService from '../../services/userService';

// Handles BOTH create and edit — `course` prop being null means create.
const CourseFormModal = ({ open, course, onClose, onSaved }) => {
  const isEdit = !!course;
  const [teachers, setTeachers] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Load the teacher list once the modal opens, so the <select> has options.
  useEffect(() => {
    if (open) {
      userService.getUsers({ role: 'teacher', limit: 100 }).then((res) => setTeachers(res.data));
    }
  }, [open]);

  // Populate the form when editing an existing course, or clear it for create.
  useEffect(() => {
    if (course) {
      reset({
        name: course.name,
        code: course.code,
        description: course.description,
        department: course.department,
        semester: course.semester,
        credits: course.credits,
        teacher: course.teacher?._id || '',
        status: course.status,
      });
    } else {
      reset({ name: '', code: '', description: '', department: '', semester: 1, credits: 3, teacher: '', status: 'active' });
    }
  }, [course, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, teacher: data.teacher || null };
      if (isEdit) {
        await courseService.updateCourse(course._id, payload);
        toast.success('Course updated');
      } else {
        await courseService.createCourse(payload);
        toast.success('Course created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save course');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit course' : 'New course'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Course name</label>
            <input className="input-field" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="mt-1 text-xs text-danger-700">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Course code</label>
            <input className="input-field" {...register('code', { required: 'Required' })} />
            {errors.code && <p className="mt-1 text-xs text-danger-700">{errors.code.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea rows={3} className="input-field" {...register('description')} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
            <input className="input-field" {...register('department', { required: 'Required' })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Semester</label>
            <input type="number" min={1} max={12} className="input-field" {...register('semester', { required: true, valueAsNumber: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Credits</label>
            <input type="number" min={1} max={10} className="input-field" {...register('credits', { required: true, valueAsNumber: true })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Assign teacher</label>
            <select className="input-field" {...register('teacher')}>
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          {isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select className="input-field" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create course'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CourseFormModal;

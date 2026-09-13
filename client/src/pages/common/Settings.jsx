import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';

const Settings = () => {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await authService.changePassword(data);
      toast.success('Password updated');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile and account security." />

      <div className="card mb-6 flex items-center gap-4">
        <Avatar name={user?.name} size={56} />
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="mt-0.5 text-xs capitalize text-gray-400">{user?.role}</p>
        </div>
      </div>

      <div className="card max-w-md">
        <h2 className="mb-4 font-semibold text-gray-900">Change password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Current password</label>
            <input type="password" className="input-field" {...register('currentPassword', { required: 'Required' })} />
            {errors.currentPassword && <p className="mt-1 text-xs text-danger-700">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              className="input-field"
              {...register('newPassword', { required: 'Required', minLength: { value: 6, message: 'At least 6 characters' } })}
            />
            {errors.newPassword && <p className="mt-1 text-xs text-danger-700">{errors.newPassword.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Settings;

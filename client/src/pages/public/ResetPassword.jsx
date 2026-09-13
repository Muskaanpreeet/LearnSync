import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const onSubmit = async ({ password }) => {
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset — please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or expired');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md card">
        <h1 className="text-2xl font-semibold text-gray-900">Reset your password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <input
            type="password"
            className="input-field"
            placeholder="New password"
            {...register('password', { required: true, minLength: 6 })}
          />
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

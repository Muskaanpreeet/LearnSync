import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      await authService.forgotPassword(email);
      toast.success('If that email is registered, a reset link has been sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md card">
        <h1 className="text-2xl font-semibold text-gray-900">Forgot password</h1>
        <p className="mt-1 text-sm text-gray-500">We'll send you a reset link.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <input type="email" className="input-field" placeholder="you@college.edu" {...register('email', { required: true })} />
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

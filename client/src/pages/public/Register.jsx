import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const roleHome = { admin: '/admin', teacher: '/teacher', student: '/student' };

const Register = () => {
  const { register: doRegister } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { role: 'student' } });

  const role = watch('role');

  const onSubmit = async (data) => {
    try {
      const user = await doRegister(data);
      toast.success('Account created!');
      navigate(roleHome[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md card">
        <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">Join LearnSync as a student or teacher.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['student', 'teacher'].map((r) => (
              <label
                key={r}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium capitalize ${
                  role === r ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'
                }`}
              >
                <input type="radio" value={r} className="hidden" {...register('role')} />
                {r}
              </label>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
            <input className="input-field" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-danger-700">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" className="input-field" {...register('email', { required: 'Email is required' })} />
            {errors.email && <p className="mt-1 text-xs text-danger-700">{errors.email.message}</p>}
          </div>

          {role === 'student' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Roll number</label>
              <input className="input-field" {...register('rollNumber')} />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
            <input className="input-field" {...register('department')} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="input-field"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters' },
              })}
            />
            {errors.password && <p className="mt-1 text-xs text-danger-700">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

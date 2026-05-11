import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/core/types';
import type { ApiError } from '@/core/exceptions';
import { Activity } from 'lucide-react';

const schema = z.object({
  role: z.enum(['user', 'doctor']),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role: authRole, loading: authLoading } = useAuth();

  const locationState = location.state as { role?: UserRole; message?: string } | null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: locationState?.role ?? 'user', email: '', password: '' },
  });

  const [apiError, setApiError] = React.useState('');
  const selectedRole = watch('role');

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(authRole === 'doctor' ? '/doctor/dashboard' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, authRole, authLoading, navigate]);

  const onSubmit = async (values: FormValues) => {
    setApiError('');
    try {
      await login(values.email, values.password, values.role);
      navigate(values.role === 'doctor' ? '/doctor/dashboard' : '/dashboard', { replace: true });
    } catch (err: unknown) {
      setApiError((err as ApiError).message ?? 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

      <div className="w-full max-w-md space-y-8 relative z-10 transition-all duration-500 transform translate-y-0 opacity-100">

        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 shadow-xl shadow-teal-500/20 mb-4 opacity-90 hover:opacity-100 transition-opacity">
            <Activity size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white m-0">
            MindNeed<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 inline-block drop-shadow-sm">AI</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-sm mx-auto">
            Your intelligent mental wellness companion
          </p>
        </div>

        {/* Card Section */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 flex flex-col space-y-7">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white tracking-wide">Welcome back</h2>
              <p className="text-sm text-slate-400 mt-1.5">Please sign in to continue your journey</p>
            </div>

            {locationState?.message && (
              <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm md:text-base text-center font-medium shadow-inner shadow-green-500/5">
                {locationState.message}
              </div>
            )}

            {/* Role Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
              {(['user', 'doctor'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setValue('role', r)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${selectedRole === r
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/30 ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      className="w-full px-4 py-3.5 bg-slate-950/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all duration-200"
                      placeholder="name@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 ml-1 text-xs text-red-400 font-medium">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <a href="#" className="text-xs font-semibold text-teal-500 hover:text-teal-400 transition-colors">Forgot?</a>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      {...register('password')}
                      className="w-full px-4 py-3.5 bg-slate-950/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all duration-200"
                      placeholder="Enter your password"
                    />
                  </div>
                  {errors.password && <p className="mt-1 ml-1 text-xs text-red-400 font-medium">{errors.password.message}</p>}
                </div>
              </div>

              {apiError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium shadow-inner shadow-red-500/5 backdrop-blur-md">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-xl font-bold text-base shadow-lg shadow-teal-500/25 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex justify-center items-center"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Area */}
        <div className="text-center bg-slate-900/40 backdrop-blur-md py-4 px-6 rounded-2xl border border-slate-800/50 mt-8">
          <p className="text-slate-400 text-sm font-medium">
            New to MindNeedAI?{' '}
            <Link
              to="/register"
              state={{ role: selectedRole }}
              className="text-teal-400 hover:text-teal-300 font-bold transition-colors duration-200"
            >
              Start your journey
            </Link>
          </p>
        </div>

        <div className="text-center text-xs text-slate-500 space-y-1.5 font-medium pt-4">
          <p>MindNeedAI · Ethically-driven mental wellness support</p>
          <p>All analysis is AI-assisted and may require human review</p>
        </div>
      </div>
    </div>
  );
}

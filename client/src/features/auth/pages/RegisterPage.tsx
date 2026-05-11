import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/core/types';
import type { ApiError } from '@/core/exceptions';
import { Activity } from 'lucide-react';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const baseSchema = z.object({
  role: z.enum(['user', 'doctor']),
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(PASSWORD_REGEX, 'Must include uppercase, lowercase, and a number'),
  confirmPassword: z.string(),
  licenseNumber: z.string().optional(),
  specialty: z.string().optional(),
});

const schema = baseSchema.refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

const strengthLabel = (pwd: string): { label: string; color: string } => {
  if (!pwd) return { label: '', color: '' };
  const score = [/[A-Z]/, /[a-z]/, /[0-9]/, /.{8,}/].filter((r) => r.test(pwd)).length;
  if (score === 4) return { label: 'Strong', color: 'text-teal-400' };
  if (score >= 2) return { label: 'Medium', color: 'text-yellow-400' };
  return { label: 'Weak', color: 'text-red-400' };
};

export default function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerUser, registerDoctor } = useAuth();
  const locationState = location.state as { role?: UserRole } | null;

  const [doctorCode, setDoctorCode] = React.useState('');
  const [apiError, setApiError] = React.useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: locationState?.role ?? 'user',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      licenseNumber: '',
      specialty: '',
    },
  });

  const selectedRole = watch('role');
  const password = watch('password');
  const strength = strengthLabel(password);

  const onSubmit = async (values: FormValues) => {
    setApiError('');
    try {
      if (values.role === 'user') {
        await registerUser(values.email, values.password, values.name);
        navigate('/login', { state: { role: 'user', message: 'Registration successful! Please log in.' } });
      } else {
        const response = await registerDoctor(
          values.email,
          values.password,
          values.name,
          values.licenseNumber || undefined,
          values.specialty || undefined
        );
        if (response.doctor_code) {
          setDoctorCode(response.doctor_code);
        } else {
          navigate('/login', { state: { role: 'doctor', message: 'Registration successful! Please log in.' } });
        }
      }
    } catch (err: unknown) {
      setApiError((err as ApiError).message ?? 'Registration failed. Please try again.');
    }
  };

  // Doctor-code success screen
  if (doctorCode) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-400/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/30 shadow-inner shadow-teal-500/20">
            <svg className="w-10 h-10 text-teal-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-wide">Registration Successful!</h2>
          <p className="text-slate-400 mb-8 font-medium">Your doctor account has been created.</p>
          <div className="bg-slate-950/80 border border-slate-700/60 rounded-2xl p-6 mb-8 shadow-inner">
            <p className="text-sm text-slate-400 mb-3 font-semibold">Your Doctor Code</p>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400 tracking-wider font-mono drop-shadow-sm">{doctorCode}</p>
            <p className="text-xs text-slate-500 mt-4 font-medium">Share this code with your patients to connect</p>
          </div>
          <button
            onClick={() => navigate('/login', { state: { role: 'doctor', message: 'Registration successful! Please log in.' } })}
            className="w-full py-4 px-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-teal-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

      <div className="w-full max-w-md space-y-6 relative z-10 transition-all duration-500 transform translate-y-0 opacity-100 py-6">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 shadow-xl shadow-teal-500/20 mb-2 opacity-90 transition-opacity">
             <Activity size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">
            MindNeed<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 inline-block drop-shadow-sm">AI</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto">
            Create your premium account
          </p>
        </div>

        {/* Card Section */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 flex flex-col space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white tracking-wide">Register</h2>
              <p className="text-xs text-slate-400 mt-1">Join our community today</p>
            </div>

            {/* Role toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
              {(['user', 'doctor'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setValue('role', r)}
                  className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    selectedRole === r
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/30 ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="reg-name" className="block text-xs font-medium text-slate-300 ml-1">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-sm"
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="mt-1 ml-1 text-[11px] text-red-400 font-medium">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="reg-email" className="block text-xs font-medium text-slate-300 ml-1">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-sm"
                  placeholder="name@example.com"
                />
                {errors.email && <p className="mt-1 ml-1 text-[11px] text-red-400 font-medium">{errors.email.message}</p>}
              </div>

              {/* Doctor-only fields */}
              {selectedRole === 'doctor' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="reg-license" className="block text-xs font-medium text-slate-300 ml-1">
                      License # <span className="text-slate-500">(Opt)</span>
                    </label>
                    <input
                      id="reg-license"
                      type="text"
                      {...register('licenseNumber')}
                      className="w-full px-3 py-3 bg-slate-950/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-sm"
                      placeholder="Medical license"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="reg-specialty" className="block text-xs font-medium text-slate-300 ml-1">
                      Specialty <span className="text-slate-500">(Opt)</span>
                    </label>
                    <input
                      id="reg-specialty"
                      type="text"
                      {...register('specialty')}
                      className="w-full px-3 py-3 bg-slate-950/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-sm"
                      placeholder="e.g. Psychiatry"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="reg-password" className="block text-xs font-medium text-slate-300 ml-1">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-sm"
                  placeholder="Create a strong password"
                />
                {password && (
                  <p className={`mt-1 ml-1 text-[11px] font-medium ${strength.color}`}>
                    Strength: {strength.label}
                  </p>
                )}
                {errors.password && <p className="mt-1 ml-1 text-[11px] text-red-400 font-medium">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label htmlFor="reg-confirm" className="block text-xs font-medium text-slate-300 ml-1">Confirm Password</label>
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all duration-200 text-sm"
                  placeholder="Re-enter your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 ml-1 text-[11px] text-red-400 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {apiError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium shadow-inner shadow-red-500/5 backdrop-blur-md mt-2">
                  {apiError}
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/25 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex justify-center items-center"
                >
                  {isSubmitting ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Area */}
        <div className="text-center bg-slate-900/40 backdrop-blur-md py-3 px-6 rounded-2xl border border-slate-800/50">
          <p className="text-slate-400 text-xs font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ role: selectedRole }}
              className="text-teal-400 hover:text-teal-300 font-bold transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

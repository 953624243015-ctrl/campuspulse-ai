import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface LoginForm {
  email: string;
  password: string;
}

const roleHome: Record<UserRole, string> = {
  student: '/dashboard',
  faculty: '/faculty/dashboard',
  mentor: '/faculty/dashboard',
  hod: '/hod/dashboard',
  admin: '/admin/dashboard',
  principal: '/principal/dashboard',
};

const demoAccounts = [
  { role: 'Student',    email: 'student.arun@campuspulse.edu',    password: 'CampusPulse@123' },
  { role: 'Faculty',    email: 'faculty.rani@campuspulse.edu',    password: 'CampusPulse@123' },
  { role: 'HOD',        email: 'hod.cse@campuspulse.edu',         password: 'CampusPulse@123' },
  { role: 'Admin',      email: 'admin@campuspulse.edu',           password: 'CampusPulse@123' },
  { role: 'Principal',  email: 'principal@campuspulse.edu',       password: 'CampusPulse@123' },
];

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>();

  if (isAuthenticated && user) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    await login(data.email, data.password);
    setIsLoading(false);
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left — Branding */}
        <div className="text-white space-y-6 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold">CampusPulse AI</div>
              <div className="text-primary-300 text-sm">Campus Intelligence Platform</div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              'AI-powered student success insights',
              'Real-time attendance & academic analytics',
              'Smart complaint management system',
              'Predictive maintenance & infrastructure',
              'Early warning system for at-risk students',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-primary-200 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                {f}
              </div>
            ))}
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
            <p className="text-xs text-primary-300 mb-2 font-medium">DEMO ACCOUNTS</p>
            <div className="space-y-1.5">
              {demoAccounts.map((d) => (
                <button
                  key={d.role}
                  onClick={() => fillDemo(d.email, d.password)}
                  className="w-full text-left px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-primary-200"
                >
                  <span className="font-medium text-white">{d.role}</span>
                  <span className="ml-2 opacity-70">{d.email}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-primary-400 mt-2">Password for all: CampusPulse@123</p>
          </div>
        </div>

        {/* Right — Login Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">CampusPulse AI</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@campuspulse.edu"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                })}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-10"
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Mobile demo accounts */}
          <div className="lg:hidden mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 mb-2 font-medium">DEMO ACCOUNTS</p>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((d) => (
                <button
                  key={d.role}
                  onClick={() => fillDemo(d.email, d.password)}
                  className="text-xs px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  {d.role}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Demo data — not real student information
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

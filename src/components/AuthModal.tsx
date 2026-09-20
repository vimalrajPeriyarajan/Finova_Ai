import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, switchUser } = useAuth();
  const { t } = useLanguage();

  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        const res = await login(email.trim(), password);
        if (res.success) {
          onClose();
        } else {
          setError(res.message || 'Invalid email or password');
        }
      } else {
        if (!name.trim()) {
          setError('Please provide your full name');
          setIsSubmitting(false);
          return;
        }
        const res = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        });
        if (res.success) {
          onClose();
        } else {
          setError(res.message || 'Registration failed');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Server error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (target: 'STUDENT' | 'ADMIN') => {
    switchUser(target);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {isLoginMode ? 'Sign In to FINOVA' : 'Create FINOVA Account'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isLoginMode ? 'Access your financial ledger & discovery vault' : 'Start your financial journey with AI'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Demo Switcher Buttons */}
          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              1-Click Instant Demo Login:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('STUDENT')}
                className="px-3 py-2 bg-white hover:bg-emerald-100/50 text-slate-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors text-left flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-extrabold text-emerald-900 leading-tight">Alex Sharma</div>
                  <div className="text-[10px] text-slate-500">Student Account</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="px-3 py-2 bg-white hover:bg-indigo-50 text-slate-800 rounded-xl text-xs font-bold border border-indigo-200 transition-colors text-left flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-extrabold text-indigo-900 leading-tight">Admin Demo</div>
                  <div className="text-[10px] text-slate-500">Compliance Officer</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isLoginMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Sharma"
                    required
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@finova.in"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {!isLoginMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="USER">Standard User (Student / Individual)</option>
                  <option value="ADMIN">Compliance Officer / Auditor</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/20 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? 'Authenticating...'
                : isLoginMode
                ? 'Sign In to Account'
                : 'Create Account'}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="pt-2 text-center text-xs text-slate-500">
            {isLoginMode ? (
              <span>
                New to FINOVA?{' '}
                <button
                  onClick={() => {
                    setIsLoginMode(false);
                    setError(null);
                  }}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Register here
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsLoginMode(true);
                    setError(null);
                  }}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import useAuthStore from '../utils/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user, isLoading } = useAuthStore();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) router.replace('/chat');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'register') {
      if (!form.username.trim()) return toast.error('Username is required');
      if (form.username.length < 3) return toast.error('Username must be at least 3 characters');
      if (form.password !== form.confirmPassword) return toast.error("Passwords don't match");
    }

    const result = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form.username, form.email, form.password);

    if (result.success) {
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      router.push('/chat');
    } else {
      toast.error(result.message);
    }
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Sign In' : 'Create Account'} — Nova AI</title>
      </Head>
      <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
        {/* Left decorative panel */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
          style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
          {/* Decorative orb */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          </div>

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{ background: 'var(--accent)', color: 'white', boxShadow: 'var(--shadow-accent)' }}>
              ✦
            </div>
            <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Nova AI
            </span>
          </div>

          {/* Quote */}
          <div className="relative">
            <blockquote className="text-3xl leading-tight mb-6"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 300 }}>
              "Intelligence amplified,<br />
              conversations elevated."
            </blockquote>
            <div className="flex flex-col gap-4">
              {['Real-time AI responses via WebSockets', 'Full conversation history & search', 'Personalized themes & settings'].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', border: '1px solid rgba(108,99,255,0.3)' }}>
                    ✓
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            © 2026 Nova AI. Built with Next.js + Grok API.
            © {new Date().getFullYear()} 
            @ 👤 Created admin: admin@novaai.dev / admin123
            @ 👤 Created demo user: demo@novaai.dev / demo123
{new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
          </p>
        </div>

        {/* Right: form panel */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md page-enter">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'var(--accent)', color: 'white' }}>✦</div>
              <span className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Nova AI
              </span>
            </div>

            <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mb-8" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {mode === 'login'
                ? 'Sign in to continue your conversations'
                : 'Join Nova AI and start chatting'}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Username
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    name="username"
                    placeholder="yourname"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Email
                </label>
                <input
                  className="input-field"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    className="input-field pr-12"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg transition-opacity"
                    style={{ opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm mb-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Confirm Password
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <button type="submit" className="btn-primary mt-2 py-3 text-base" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setForm({ username: '', email: '', password: '', confirmPassword: '' }); }}
                  style={{ color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

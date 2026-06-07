import { useState } from 'react';
import { Zap, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = (path: string) => { window.location.hash = `#${path}`; };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const data = await api.auth.login(form);
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0A0F1E 0%, #070B16 100%)' }}>
      <div className="auth-glow-left" />
      <div className="auth-glow-right" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      <button type="button" onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ArrowLeft size={16} />Back
      </button>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-bold font-display text-lg tracking-wide text-foreground">
            ONBOARD<span className="text-gold">IQ</span>
          </span>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h1 className="text-2xl font-bold font-display text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-6">Sign in to your onboarding dashboard</p>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-5">
              <AlertCircle size={14} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@company.com" disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••" disabled={loading}
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-brand/60 focus:ring-1 focus:ring-brand/30 transition-all" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-brand hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all hover:shadow-blue-glow active:scale-[0.99] text-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 rounded-xl bg-gold/5 border border-gold/20 text-xs text-gold/80">
            <strong>Note:</strong> Create an account first to generate your personalized AI onboarding plan.
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')}
              className="text-brand-light hover:text-brand transition-colors font-medium">Sign up free</button>
          </p>
        </div>
      </div>
    </div>
  );
}

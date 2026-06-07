import { useState } from 'react';
import { Zap, Eye, EyeOff, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
const SENIORITY_LEVELS = ['Intern', 'L1', 'L2', 'L3', 'L4', 'L5', 'Manager', 'Senior Manager', 'Director', 'VP'];

export default function SignupPage() {
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: 'Engineering',
    seniority: 'L3',
    location: 'Remote',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = (path: string) => { window.location.hash = `#${path}`; };
  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.email.includes('@')) return 'Please enter a valid email.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.auth.signup(form) as { token: string; user: Parameters<typeof setAuth>[0] };
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0A0F1E 0%, #070B16 100%)' }}>
      <div className="auth-glow-left" />
      <div className="auth-glow-right" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Back */}
      <button
        type="button"
        onClick={() => step === 2 ? setStep(1) : navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        {step === 2 ? 'Back' : 'Home'}
      </button>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-bold font-display text-lg tracking-wide text-foreground">
            ONBOARD<span className="text-gold">IQ</span>
          </span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s ? 'bg-brand text-white' : 'bg-navy-card border border-navy-border text-muted-foreground'
              }`}>
                {step > s ? <Check size={12} /> : s}
              </div>
              {s < 2 && <div className={`w-8 h-0.5 rounded-full transition-all ${step > s ? 'bg-brand' : 'bg-navy-border'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h1 className="text-2xl font-bold font-display text-foreground mb-1">
            {step === 1 ? 'Create your account' : 'Your role details'}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {step === 1 ? 'Start your AI-powered onboarding journey' : 'Help us personalize your 30-60-90 day plan'}
          </p>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-5">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Priya Sharma"
                    className="w-full px-4 py-3 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Work Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all"
                    />
                    <button type="button" onClick={() => setShowPass((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-gold hover:bg-gold/90 text-navy font-semibold rounded-xl transition-all hover:shadow-gold-glow active:scale-[0.99] text-sm">
                  Continue →
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job Title / Role</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => update('role', e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-4 py-3 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
                    <select
                      value={form.department}
                      onChange={(e) => update('department', e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm focus:border-gold/60 transition-all"
                    >
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Seniority</label>
                    <select
                      value={form.seniority}
                      onChange={(e) => update('seniority', e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm focus:border-gold/60 transition-all"
                    >
                      {SENIORITY_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => update('location', e.target.value)}
                      placeholder="Remote / Mumbai"
                      className="w-full px-4 py-3 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-gold/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => update('startDate', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-navy-card border border-navy-border text-foreground text-sm focus:border-gold/60 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand hover:bg-brand/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-all hover:shadow-blue-glow active:scale-[0.99] text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : 'Create Account & Generate Plan'}
                </button>
              </>
            )}
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-brand-light hover:text-brand transition-colors font-medium">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

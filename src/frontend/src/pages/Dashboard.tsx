import {
  AlertTriangle, ArrowRight, Bell, BookOpen, Calendar,
  CheckCircle2, ChevronDown, Circle, Clock, FileText, GitBranch,
  Home, ListTodo, LogOut, MessageSquare, Monitor,
  Search, Shield, Sparkles, TrendingUp, Users, Zap,
  X, ExternalLink, ChevronRight, BarChart2, Target,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';
import AIChatbot from '../components/chatbot/AIChatbot';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  due_offset_days: number;
  dueDate?: string;
  isUnlocked?: boolean;
  completed?: boolean;
}
interface OnboardingPlan {
  day_0_7: Task[];
  week_2_4: Task[];
  day_30_60: Task[];
  day_60_90: Task[];
}
interface PlanResponse {
  day_in_journey: number;
  top_tasks: Task[];
  nudges: string[];
  full_plan: OnboardingPlan;
}

// ─── Mock fallback ─────────────────────────────────────────────────────────────
const MOCK_RESPONSE: PlanResponse = {
  day_in_journey: 1,
  nudges: ['Schedule your first 1:1 with your manager this week', 'Complete the Security Training module by Day 7', 'Join the #new-hires Slack channel and introduce yourself'],
  top_tasks: [
    { id: 't1', title: 'Complete Security Training', description: 'Finish the mandatory security awareness module covering data protection and access policies.', category: 'training', due_offset_days: 7, dueDate: '', isUnlocked: true, completed: false },
    { id: 't2', title: 'Schedule 1:1 with Manager', description: 'Book your first one-on-one meeting with your manager to align on goals and expectations.', category: 'meeting', due_offset_days: 3, dueDate: '', isUnlocked: true, completed: false },
    { id: 't3', title: 'Setup Dev Environment', description: 'Configure your local development environment: install IDE, set up SSH keys, clone repos.', category: 'access', due_offset_days: 5, dueDate: '', isUnlocked: true, completed: false },
  ],
  full_plan: {
    day_0_7: [
      { id: 'p1', title: 'Laptop & Badge Setup', description: 'Receive and configure your laptop. Collect office badge from IT desk.', category: 'access', due_offset_days: 1, dueDate: '', isUnlocked: true, completed: false },
      { id: 'p2', title: 'Email & Slack Activation', description: 'Activate your company email and set up Slack. Join #engineering and #new-hires channels.', category: 'access', due_offset_days: 1, dueDate: '', isUnlocked: true, completed: false },
      { id: 't1', title: 'Complete Security Training', description: 'Finish the mandatory security awareness module.', category: 'training', due_offset_days: 7, dueDate: '', isUnlocked: true, completed: false },
      { id: 't2', title: 'Schedule 1:1 with Manager', description: 'Book your first one-on-one meeting.', category: 'meeting', due_offset_days: 3, dueDate: '', isUnlocked: true, completed: false },
      { id: 't3', title: 'Setup Dev Environment', description: 'Configure your local development environment.', category: 'access', due_offset_days: 5, dueDate: '', isUnlocked: true, completed: false },
    ],
    week_2_4: [
      { id: 'p7', title: 'SDLC & CI/CD Training', description: 'Complete the engineering process training covering branching strategy and CI/CD pipeline.', category: 'training', due_offset_days: 14, dueDate: '', isUnlocked: false, completed: false },
      { id: 'p8', title: 'First Sprint Story', description: 'Get assigned your first story from the sprint backlog.', category: 'task', due_offset_days: 21, dueDate: '', isUnlocked: false, completed: false },
      { id: 'p9', title: 'Meet Key Stakeholders', description: 'Schedule intro calls with product, design, and QA teams.', category: 'meeting', due_offset_days: 18, dueDate: '', isUnlocked: false, completed: false },
      { id: 'p10', title: 'Access & Credentials Setup', description: 'Request production access credentials and VPN configuration.', category: 'access', due_offset_days: 10, dueDate: '', isUnlocked: true, completed: false },
    ],
    day_30_60: [
      { id: 'p11', title: 'Own a Small Component', description: 'Take ownership of a small component. Document it in the team wiki.', category: 'task', due_offset_days: 45, dueDate: '', isUnlocked: false, completed: false },
      { id: 'p12', title: 'On-Call Orientation', description: 'Shadow an on-call rotation week. Review runbooks.', category: 'training', due_offset_days: 50, dueDate: '', isUnlocked: false, completed: false },
      { id: 'p13', title: '30-Day Check-in with HR', description: 'Schedule your 30-day progress review with HR.', category: 'meeting', due_offset_days: 30, dueDate: '', isUnlocked: false, completed: false },
    ],
    day_60_90: [
      { id: 'p14', title: 'Deliver Feature End-to-End', description: 'Plan, build, test, and ship a feature with minimal guidance.', category: 'task', due_offset_days: 75, dueDate: '', isUnlocked: false, completed: false },
      { id: 'p15', title: 'Contribute to Runbook', description: 'Write or update an engineering runbook or KB article.', category: 'task', due_offset_days: 80, dueDate: '', isUnlocked: false, completed: false },
      { id: 'p16', title: '90-Day Review', description: 'Formal 90-day performance and impact review with manager.', category: 'meeting', due_offset_days: 90, dueDate: '', isUnlocked: false, completed: false },
    ],
  },
};

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_ICON: Record<string, React.ReactNode> = {
  training: <Shield size={14} />, meeting: <Users size={14} />,
  access: <GitBranch size={14} />, task: <Monitor size={14} />,
};
const CAT_BADGE: Record<string, string> = {
  training: 'bg-brand/20 text-brand-light border border-brand/30',
  meeting: 'bg-gold/20 text-gold border border-gold/30',
  access: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  task: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};
const CAT_CTA: Record<string, string> = {
  training: 'Go to Module', meeting: 'Schedule Meeting', access: 'Request Access', task: 'View Task',
};

// ─── Section views ────────────────────────────────────────────────────────────
type Section = 'dashboard' | 'tasks' | 'progress' | 'people' | 'resources';

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ task, onClose, onComplete, isCompleted }: {
  task: Task; onClose: () => void; onComplete: (id: string) => void; isCompleted: boolean;
}) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 20 }}
          className="glass-card rounded-2xl p-6 w-full max-w-md relative"
          onClick={e => e.stopPropagation()}>
          <button type="button" onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 ${CAT_BADGE[task.category] ?? CAT_BADGE.task}`}>
            {CAT_ICON[task.category]} {task.category}
          </div>
          <h2 className="text-xl font-bold font-display text-foreground mb-2">{task.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{task.description}</p>
          {task.due_offset_days && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5 p-3 rounded-xl bg-navy-card border border-navy-border">
              <Clock size={12} />
              <span>Due by Day +{task.due_offset_days} of your onboarding</span>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => { onComplete(task.id); onClose(); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                isCompleted ? 'bg-secondary text-muted-foreground' : 'bg-gold hover:bg-gold/90 text-navy hover:shadow-gold-glow'}`}>
              {isCompleted ? '✓ Completed' : 'Mark as Complete'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground glass-card transition-all">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const pct = Math.round((completed / total) * 100);
  const r = 90; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const [anim, setAnim] = useState(false);
  useEffect(() => { setTimeout(() => setAnim(true), 300); }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full py-6">
      <div className="relative inline-flex items-center justify-center">
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
          <circle cx="110" cy="110" r={r} fill="none" stroke="#24304A" strokeWidth="14" />
          <circle cx="110" cy="110" r={r} fill="none" stroke="#C9A84C" strokeWidth="14"
            strokeLinecap="round" strokeDasharray={circ}
            strokeDashoffset={anim ? offset : circ}
            style={{ transition: anim ? 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' : 'none' }} />
          <circle cx="110" cy="110" r={r} fill="none" stroke="#C9A84C" strokeWidth="22"
            strokeLinecap="round" strokeDasharray={circ}
            strokeDashoffset={anim ? offset : circ} opacity="0.12"
            style={{ transition: anim ? 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' : 'none', filter: 'blur(4px)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="text-5xl font-bold font-display text-foreground">{pct}%</motion.span>
          <span className="text-xs text-muted-foreground mt-1 text-center px-4">Onboarding Completion</span>
          <span className="text-xs text-muted-foreground mt-0.5">{completed}/{total} tasks done</span>
          <span className="mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-light border border-brand/30">
            Day 0–7
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mt-2">Your onboarding progress</p>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, index, isCompleted, onToggle, onOpen, variant = 'blue' }: {
  task: Task; index: number; isCompleted: boolean;
  onToggle: (id: string) => void; onOpen: (task: Task) => void; variant?: 'gold' | 'blue' | 'muted';
}) {
  const borders = { gold: 'border-gold/40 hover:border-gold/70 hover:shadow-gold-glow', blue: 'border-brand/30 hover:border-brand/60 hover:shadow-blue-glow', muted: 'border-navy-border hover:border-navy-border/80' };
  const iconBg = { gold: 'bg-gold/15 text-gold', blue: 'bg-brand/15 text-brand-light', muted: 'bg-secondary text-muted-foreground' };
  const btnStyle = { gold: 'bg-gold text-navy hover:bg-gold/90', blue: 'bg-brand hover:bg-brand/90 text-white', muted: 'bg-secondary text-muted-foreground' };
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
      className={`relative flex flex-col bg-card rounded-xl border p-4 card-hover ${borders[variant]} ${isCompleted ? 'opacity-60' : ''}`}
      style={{ minHeight: '220px' }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg[variant]}`}>{CAT_ICON[task.category] ?? <ListTodo size={16} />}</div>
        <button type="button" onClick={() => onToggle(task.id)} className="text-muted-foreground hover:text-foreground transition-colors">
          {isCompleted ? <CheckCircle2 size={20} className="text-gold" /> : <Circle size={20} />}
        </button>
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground mb-1">Task {index + 1}</p>
        <h3 className={`text-sm font-semibold font-display mb-2 leading-snug ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{task.description}</p>
      </div>
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Clock size={11} /><span>Due: Day +{task.due_offset_days}</span>
        </div>
        <button type="button" onClick={() => onOpen(task)}
          className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center justify-center gap-1.5 ${isCompleted ? 'bg-secondary text-muted-foreground cursor-default' : btnStyle[variant]}`}
          disabled={isCompleted}>
          {isCompleted ? 'Completed' : (CAT_CTA[task.category] ?? 'View Task')}
          {!isCompleted && <ArrowRight size={11} />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Nudge ─────────────────────────────────────────────────────────────────────
function NudgeBanner({ message, index, onAsk }: { message: string; index: number; onAsk: (q: string) => void }) {
  const [dismissed, setDismissed] = useState(false);
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16, height: 0 }} transition={{ delay: index * 0.08 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gold/25"
          style={{ background: 'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.04))' }}>
          <div className="shrink-0 p-1.5 rounded-lg bg-gold/15"><Sparkles size={14} className="text-gold" /></div>
          <span className="flex-1 text-sm text-foreground">{message}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => onAsk(message)}
              className="text-xs font-medium text-gold hover:text-gold/80 px-2.5 py-1 rounded-lg border border-gold/30 transition-colors">
              Ask Aria
            </button>
            <button type="button" onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
interface Phase { label: string; range: string; status: 'current' | 'active' | 'upcoming'; tasks: Task[] }
function Timeline({ phases, completedIds, onOpen }: { phases: Phase[]; completedIds: Set<string>; onOpen: (t: Task) => void }) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-gold via-brand to-navy-border opacity-40" />
      <div className="space-y-6">
        {phases.map((phase, pi) => (
          <motion.div key={phase.label} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: pi * 0.1 + 0.4 }} className="relative pl-10">
            <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 ${
              phase.status === 'current' ? 'border-gold bg-gold/15 animate-pulse-gold' :
              phase.status === 'active' ? 'border-brand bg-brand/15' : 'border-navy-border bg-navy-card'}`}>
              <div className={`w-2 h-2 rounded-full ${phase.status === 'current' ? 'bg-gold' : phase.status === 'active' ? 'bg-brand-light' : 'bg-navy-border'}`} />
            </div>
            <div className={`flex items-center gap-3 mb-3 p-3 rounded-xl border ${
              phase.status === 'current' ? 'border-gold/40 bg-gold/5 shadow-gold-glow' :
              phase.status === 'active' ? 'border-brand/30 bg-brand/5' : 'border-navy-border/50 bg-card/40'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-display text-sm text-foreground">{phase.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    phase.status === 'current' ? 'bg-gold/20 text-gold border-gold/30' :
                    phase.status === 'active' ? 'bg-brand/10 text-brand-light border-brand/30' : 'bg-secondary text-muted-foreground border-transparent'}`}>
                    {phase.status === 'current' ? 'Current' : phase.status === 'active' ? 'Active' : 'Upcoming'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{phase.range}</span>
              </div>
            </div>
            <div className="space-y-1.5 ml-1">
              {phase.tasks.map(task => {
                const done = completedIds.has(task.id) || (task.completed ?? false);
                return (
                  <button key={task.id} type="button" onClick={() => onOpen(task)}
                    className={`w-full flex items-center gap-2.5 text-xs py-1.5 px-3 rounded-lg transition-colors hover:bg-white/5 text-left ${done ? 'text-muted-foreground' : phase.status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {done ? <CheckCircle2 size={12} className="text-gold shrink-0" /> :
                     phase.status === 'upcoming' ? <Clock size={12} className="text-muted-foreground shrink-0" /> :
                     <Circle size={12} className="text-brand shrink-0" />}
                    <span className={`flex-1 truncate ${done ? 'line-through' : ''}`}>{task.title}</span>
                    <ChevronRight size={10} className="text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── All Tasks View ───────────────────────────────────────────────────────────
function TasksView({ allTasks, completedIds, onToggle, onOpen }: {
  allTasks: Task[]; completedIds: Set<string>; onToggle: (id: string) => void; onOpen: (t: Task) => void;
}) {
  const [filter, setFilter] = useState<string>('all');
  const categories = ['all', 'training', 'meeting', 'access', 'task'];
  const filtered = filter === 'all' ? allTasks : allTasks.filter(t => t.category === filter);
  return (
    <div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {categories.map(c => (
          <button key={c} type="button" onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === c ? 'bg-brand text-white' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((task, i) => (
          <TaskCard key={task.id} task={task} index={i} isCompleted={completedIds.has(task.id)}
            onToggle={onToggle} onOpen={onOpen}
            variant={task.category === 'meeting' ? 'gold' : task.category === 'training' ? 'blue' : 'muted'} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ListTodo size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No tasks in this category</p>
        </div>
      )}
    </div>
  );
}

// ─── Progress View ─────────────────────────────────────────────────────────────
function ProgressView({ allTasks, completedIds, dayInJourney }: { allTasks: Task[]; completedIds: Set<string>; dayInJourney: number }) {
  const phases = [
    { label: 'Day 0–7', tasks: allTasks.filter(t => t.due_offset_days <= 7), color: '#C9A84C' },
    { label: 'Week 2–4', tasks: allTasks.filter(t => t.due_offset_days > 7 && t.due_offset_days <= 28), color: '#2563EB' },
    { label: 'Day 30–60', tasks: allTasks.filter(t => t.due_offset_days > 28 && t.due_offset_days <= 60), color: '#7C3AED' },
    { label: 'Day 60–90', tasks: allTasks.filter(t => t.due_offset_days > 60), color: '#10B981' },
  ];
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><Target size={16} className="text-gold" />Phase Completion</h3>
        <div className="space-y-4">
          {phases.map(phase => {
            const done = phase.tasks.filter(t => completedIds.has(t.id)).length;
            const pct = phase.tasks.length ? Math.round((done / phase.tasks.length) * 100) : 0;
            return (
              <div key={phase.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{phase.label}</span>
                  <span className="text-xs text-muted-foreground">{done}/{phase.tasks.length} · {pct}%</span>
                </div>
                <div className="h-2 bg-navy-border rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ background: phase.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Day in Journey', value: dayInJourney, suffix: '', icon: <Calendar size={16} className="text-brand-light" /> },
          { label: 'Tasks Completed', value: allTasks.filter(t => completedIds.has(t.id)).length, suffix: `/${allTasks.length}`, icon: <CheckCircle2 size={16} className="text-gold" /> },
          { label: 'Overall Progress', value: Math.round((allTasks.filter(t => completedIds.has(t.id)).length / allTasks.length) * 100), suffix: '%', icon: <BarChart2 size={16} className="text-emerald-400" /> },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5 text-center">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <div className="text-3xl font-bold font-display gradient-text-gold">{s.value}{s.suffix}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── People View ───────────────────────────────────────────────────────────────
function PeopleView({ onChat }: { onChat: (q: string) => void }) {
  const people = [
    { name: 'Your Manager', role: 'Direct Manager', action: 'Schedule 1:1', tip: 'Book your first meeting within Day 3' },
    { name: 'HR Partner', role: 'Human Resources', action: 'Connect on Slack', tip: 'Ask them about benefits, policies & payroll' },
    { name: 'Tech Lead', role: 'Engineering Lead', action: 'Set up intro call', tip: 'Get codebase walkthrough & coding standards' },
    { name: 'Product Manager', role: 'Product', action: 'Join team standup', tip: 'Understand product roadmap & priorities' },
    { name: 'Buddy / Mentor', role: 'Onboarding Buddy', action: 'Say hello on Slack', tip: 'They are your go-to for any questions' },
    { name: 'IT Support', role: 'IT Department', action: 'Raise access ticket', tip: 'For any tool or access issues' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {people.map((p, i) => (
        <motion.div key={p.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card rounded-2xl p-5 card-hover border border-navy-border hover:border-brand/30">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-white font-bold text-sm mb-3">
            {p.name[0]}
          </div>
          <h3 className="font-display font-semibold text-sm text-foreground mb-0.5">{p.name}</h3>
          <p className="text-xs text-muted-foreground mb-3">{p.role}</p>
          <p className="text-xs text-gold/80 italic mb-3">💡 {p.tip}</p>
          <button type="button" onClick={() => onChat(`Help me prepare for meeting with my ${p.name} — what should I discuss?`)}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-brand/10 text-brand-light border border-brand/20 hover:bg-brand/20 transition-all">
            {p.action}
          </button>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Resources View ────────────────────────────────────────────────────────────
function ResourcesView({ onChat }: { onChat: (q: string) => void }) {
  const resources = [
    { title: 'Security Training Module', desc: 'Mandatory data protection & access policy training', category: 'training', icon: <Shield size={18} />, action: 'Start Module' },
    { title: 'Employee Handbook', desc: 'Company policies, values, and code of conduct', category: 'document', icon: <FileText size={18} />, action: 'Read Handbook' },
    { title: 'Engineering Runbooks', desc: 'System operations, deployment guides, and incident response', category: 'docs', icon: <Monitor size={18} />, action: 'View Runbooks' },
    { title: 'Benefits & Payroll Guide', desc: 'Health insurance, leave policy, and payroll schedule', category: 'hr', icon: <Users size={18} />, action: 'View Benefits' },
    { title: 'Team Wiki / Confluence', desc: 'Internal knowledge base, team documentation, and FAQs', category: 'docs', icon: <BookOpen size={18} />, action: 'Open Wiki' },
    { title: 'Dev Environment Setup', desc: 'Step-by-step guide to set up your local dev environment', category: 'technical', icon: <GitBranch size={18} />, action: 'Follow Guide' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {resources.map((r, i) => (
        <motion.div key={r.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="glass-card rounded-2xl p-5 card-hover border border-navy-border hover:border-gold/30 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0">{r.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-sm text-foreground mb-1">{r.title}</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{r.desc}</p>
            <button type="button" onClick={() => onChat(`Tell me more about: ${r.title}`)}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-light hover:text-brand transition-colors">
              <ExternalLink size={11} />{r.action}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────────
const NAV_LINKS: { label: string; icon: React.ReactNode; section: Section }[] = [
  { label: 'Dashboard', icon: <Home size={14} />, section: 'dashboard' },
  { label: 'Tasks', icon: <ListTodo size={14} />, section: 'tasks' },
  { label: 'Progress', icon: <TrendingUp size={14} />, section: 'progress' },
  { label: 'People', icon: <Users size={14} />, section: 'people' },
  { label: 'Resources', icon: <FileText size={14} />, section: 'resources' },
];

function Navbar({ section, setSection, onChatOpen }: {
  section: Section; setSection: (s: Section) => void; onChatOpen: () => void;
}) {
  const { user, logout } = useAuthStore();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  return (
    <header className="sticky top-0 z-50 border-b border-border/60"
      style={{ background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-[1300px] mx-auto px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand/70 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold font-display text-sm tracking-wide text-foreground">
            ONBOARD<span className="text-gold">IQ</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <button key={link.label} type="button" onClick={() => setSection(link.section)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                section === link.section ? 'text-foreground bg-card border border-border/80' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}`}>
              {link.icon}{link.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/60 text-xs text-muted-foreground w-40">
            <Search size={12} /><span>Search...</span>
          </div>
          <button type="button" className="relative p-1.5 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-foreground">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-gold rounded-full" />
          </button>
          <button type="button" onClick={onChatOpen}
            className="relative p-1.5 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-foreground" title="Chat with Aria">
            <MessageSquare size={16} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
          </button>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-foreground leading-none">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">{user?.role || 'Employee'}</p>
            </div>
            <ChevronDown size={12} className="text-muted-foreground hidden md:block" />
          </div>
          <button type="button" onClick={logout} title="Logout"
            className="p-1.5 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-destructive">
            <LogOut size={16} />
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
        {NAV_LINKS.map(link => (
          <button key={link.label} type="button" onClick={() => setSection(link.section)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              section === link.section ? 'text-foreground bg-card border border-border/80' : 'text-muted-foreground'}`}>
            {link.icon}{link.label}
          </button>
        ))}
      </div>
    </header>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore();
  const [planData, setPlanData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitMsg, setChatInitMsg] = useState('');
  const [section, setSection] = useState<Section>('dashboard');
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const userObj = {
      id: user?.id || 'guest', name: user?.name || 'New Employee', email: user?.email || '',
      role: user?.role || 'Software Engineer', department: user?.department || 'Engineering',
      seniority: user?.seniority || 'L3', location: user?.location || 'Remote',
      startDate: user?.startDate || new Date().toISOString().split('T')[0], completedTasks: [],
    };
    api.plan.generate(userObj)
      .then(data => {
        setPlanData(data as PlanResponse);
        setCompletedIds(new Set(api.tasks.getCompleted(userObj.id)));
        setLoading(false);
      })
      .catch(() => { setPlanData(MOCK_RESPONSE); setLoading(false); });
  }, [user]);

  const toggleTask = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      const isNow = !next.has(id);
      isNow ? next.add(id) : next.delete(id);
      api.tasks.complete(user?.id || 'guest', id, isNow);
      return next;
    });
  };

  const openChat = (msg?: string) => {
    if (msg) setChatInitMsg(msg);
    setChatOpen(true);
  };

  const data = planData ?? MOCK_RESPONSE;
  const allTasks = [...data.full_plan.day_0_7, ...data.full_plan.week_2_4, ...data.full_plan.day_30_60, ...data.full_plan.day_60_90];
  const completedCount = allTasks.filter(t => completedIds.has(t.id)).length;
  const firstName = user?.name?.split(' ')[0] || 'there';

  const timelinePhases: Phase[] = [
    { label: 'Day 0–7', range: 'Getting started', status: 'current', tasks: data.full_plan.day_0_7 },
    { label: 'Week 2–4', range: 'Role foundations', status: 'active', tasks: data.full_plan.week_2_4 },
    { label: 'Day 30–60', range: 'Deeper ownership', status: 'upcoming', tasks: data.full_plan.day_30_60 },
    { label: 'Day 60–90', range: 'Autonomy & impact', status: 'upcoming', tasks: data.full_plan.day_60_90 },
  ];

  const SECTION_TITLES: Record<Section, string> = {
    dashboard: `Welcome, ${firstName}! 👋`, tasks: 'All Tasks',
    progress: 'Your Progress', people: 'Key People', resources: 'Resources & Guides',
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#0A0F1E 0%,#070B16 100%)' }}>
      <Navbar section={section} setSection={setSection} onChatOpen={() => openChat()} />

      <main className="max-w-[1300px] mx-auto px-6 py-8">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground mb-1">{SECTION_TITLES[section]}</h1>
          <p className="text-sm text-muted-foreground">
            Day {data.day_in_journey} · {user?.role || 'Employee'}, {user?.department || 'Engineering'}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              <p className="text-sm text-muted-foreground">Generating your AI onboarding plan...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {section === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Top 3 tasks + ring */}
                <section className="mb-6">
                  <h2 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-gold/20 flex items-center justify-center"><Zap size={11} className="text-gold" /></span>
                    Today's Top 3 Tasks
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      {data.top_tasks[0] && <TaskCard task={data.top_tasks[0]} index={0} isCompleted={completedIds.has(data.top_tasks[0].id)} onToggle={toggleTask} onOpen={setModalTask} variant="gold" />}
                    </div>
                    <div className="bg-card rounded-xl border border-border/60" style={{ background: 'linear-gradient(135deg,#141B2D,#0E1528)' }}>
                      <ProgressRing completed={completedCount} total={allTasks.length} />
                    </div>
                    <div className="flex flex-col gap-4">
                      {data.top_tasks[1] && <TaskCard task={data.top_tasks[1]} index={1} isCompleted={completedIds.has(data.top_tasks[1].id)} onToggle={toggleTask} onOpen={setModalTask} variant="blue" />}
                      {data.top_tasks[2] && <TaskCard task={data.top_tasks[2]} index={2} isCompleted={completedIds.has(data.top_tasks[2].id)} onToggle={toggleTask} onOpen={setModalTask} variant="muted" />}
                    </div>
                  </div>
                </section>
                {/* Nudges */}
                <section className="mb-8">
                  <h2 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-gold/15 flex items-center justify-center"><Sparkles size={11} className="text-gold" /></span>
                    Smart Nudges
                  </h2>
                  <div className="space-y-2">
                    {data.nudges.slice(0, 3).map((n, i) => <NudgeBanner key={n} message={n} index={i} onAsk={q => openChat(q)} />)}
                  </div>
                </section>
                {/* Timeline */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-brand/15 flex items-center justify-center"><Calendar size={11} className="text-brand-light" /></span>
                      30-60-90 Day Timeline
                    </h2>
                    <button type="button" onClick={() => setSection('tasks')} className="text-xs text-brand-light hover:text-brand transition-colors flex items-center gap-1">
                      View all tasks <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="max-w-2xl">
                    <Timeline phases={timelinePhases} completedIds={completedIds} onOpen={setModalTask} />
                  </div>
                </section>
              </motion.div>
            )}

            {section === 'tasks' && (
              <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TasksView allTasks={allTasks} completedIds={completedIds} onToggle={toggleTask} onOpen={setModalTask} />
              </motion.div>
            )}

            {section === 'progress' && (
              <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProgressView allTasks={allTasks} completedIds={completedIds} dayInJourney={data.day_in_journey} />
              </motion.div>
            )}

            {section === 'people' && (
              <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PeopleView onChat={q => openChat(q)} />
              </motion.div>
            )}

            {section === 'resources' && (
              <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ResourcesView onChat={q => openChat(q)} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <footer className="border-t border-border/40 py-6 mt-12">
        <div className="max-w-[1300px] mx-auto px-6">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} OnboardIQ · AI-Powered Onboarding</p>
        </div>
      </footer>

      {/* Task Modal */}
      {modalTask && <Modal task={modalTask} onClose={() => setModalTask(null)} onComplete={toggleTask} isCompleted={completedIds.has(modalTask.id)} />}

      {/* AI Chatbot */}
      <AIChatbot isOpen={chatOpen} onClose={() => { setChatOpen(false); setChatInitMsg(''); }} initMessage={chatInitMsg} />

      {/* FAB */}
      <button type="button" onClick={() => openChat()}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-brand to-gold flex items-center justify-center text-white shadow-blue-glow hover:scale-110 active:scale-95 z-40 transition-all duration-200"
        title="Chat with Aria">
        <MessageSquare size={22} />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full border-2 border-navy-dark animate-pulse" />
      </button>
    </div>
  );
}

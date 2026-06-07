import {
  AlertTriangle, ArrowRight, Bell, BookOpen, Calendar,
  CheckCircle2, ChevronDown, Circle, Clock, FileText, GitBranch,
  HelpCircle, Home, ListTodo, LogOut, MessageSquare, Monitor,
  Search, Shield, Sparkles, TrendingUp, Users, Zap,
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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_RESPONSE: PlanResponse = {
  day_in_journey: 12,
  nudges: [
    'Schedule 1:1 with Manager',
    'Complete Security Training by Friday',
    'Your Git access request is pending — want me to follow up?',
  ],
  top_tasks: [
    { id: 't1', title: 'Complete Security Training', description: 'Finish the mandatory security awareness module covering data protection and access policies.', category: 'training', due_offset_days: 7, dueDate: '2026-04-10', isUnlocked: true, completed: false },
    { id: 't2', title: 'Schedule 1:1 with Manager', description: 'Book your first one-on-one meeting with your manager to align on goals and expectations.', category: 'meeting', due_offset_days: 3, dueDate: '2026-04-06', isUnlocked: true, completed: false },
    { id: 't3', title: 'Setup Dev Environment', description: 'Configure your local development environment: install IDE, set up SSH keys, clone repos.', category: 'access', due_offset_days: 5, dueDate: '2026-04-08', isUnlocked: true, completed: false },
  ],
  full_plan: {
    day_0_7: [
      { id: 'p1', title: 'Laptop & Badge Setup', description: 'Receive and configure your laptop. Collect office badge from IT desk.', category: 'access', due_offset_days: 1, dueDate: '2026-04-04', isUnlocked: true, completed: true },
      { id: 'p2', title: 'Email & Slack Account Activation', description: 'Activate your company email and set up Slack. Join #engineering and #new-hires channels.', category: 'access', due_offset_days: 1, dueDate: '2026-04-04', isUnlocked: true, completed: true },
      { id: 'p3', title: 'VPN & Remote Access Configuration', description: 'Install and configure VPN client. Test connectivity to internal systems.', category: 'access', due_offset_days: 2, dueDate: '2026-04-05', isUnlocked: true, completed: true },
      { id: 't1', title: 'Complete Security Training', description: 'Finish the mandatory security awareness module covering data protection and access policies.', category: 'training', due_offset_days: 7, dueDate: '2026-04-10', isUnlocked: true, completed: false },
      { id: 't2', title: 'Schedule 1:1 with Manager', description: 'Book your first one-on-one meeting with your manager.', category: 'meeting', due_offset_days: 3, dueDate: '2026-04-06', isUnlocked: true, completed: false },
      { id: 't3', title: 'Setup Dev Environment', description: 'Configure your local development environment.', category: 'access', due_offset_days: 5, dueDate: '2026-04-08', isUnlocked: true, completed: false },
    ],
    week_2_4: [
      { id: 'p7', title: 'SDLC & CI/CD Training', description: 'Complete the engineering process training covering our SDLC, branching strategy, and CI/CD pipeline.', category: 'training', due_offset_days: 14, dueDate: '2026-04-17', isUnlocked: false, completed: false },
      { id: 'p8', title: 'First Sprint Story Assignment', description: 'Get assigned your first story from the sprint backlog. Pair with tech lead for code review walkthrough.', category: 'task', due_offset_days: 21, dueDate: '2026-04-24', isUnlocked: false, completed: false },
      { id: 'p9', title: 'Meet Key Engineering Stakeholders', description: 'Schedule intro calls with product, design, and QA teams.', category: 'meeting', due_offset_days: 18, dueDate: '2026-04-21', isUnlocked: false, completed: false },
      { id: 'p10', title: 'Secrets Vault Access Request', description: 'Submit request for Vault access. Required for accessing production credentials.', category: 'access', due_offset_days: 10, dueDate: '2026-04-13', isUnlocked: true, completed: false },
    ],
    day_30_60: [
      { id: 'p11', title: 'Own a Small Component', description: 'Take ownership of a small frontend or backend component. Document it in the team wiki.', category: 'task', due_offset_days: 45, dueDate: '2026-05-18', isUnlocked: false, completed: false },
      { id: 'p12', title: 'On-Call Orientation', description: 'Shadow an on-call rotation week. Review runbooks and escalation procedures.', category: 'training', due_offset_days: 50, dueDate: '2026-05-23', isUnlocked: false, completed: false },
      { id: 'p13', title: '30-Day Check-in with HR', description: 'Schedule your 30-day progress review with HR and your manager.', category: 'meeting', due_offset_days: 30, dueDate: '2026-05-03', isUnlocked: false, completed: false },
    ],
    day_60_90: [
      { id: 'p14', title: 'Deliver Feature End-to-End', description: 'Plan, build, test, and ship a feature end-to-end with minimal guidance.', category: 'task', due_offset_days: 75, dueDate: '2026-06-07', isUnlocked: false, completed: false },
      { id: 'p15', title: 'Contribute to Runbook/KB Article', description: 'Write or significantly update an engineering runbook or knowledge base article.', category: 'task', due_offset_days: 80, dueDate: '2026-06-12', isUnlocked: false, completed: false },
      { id: 'p16', title: '90-Day Review with Manager', description: 'Formal 90-day performance and impact review. Discuss Q3 goals.', category: 'meeting', due_offset_days: 90, dueDate: '2026-06-22', isUnlocked: false, completed: false },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  training: <BookOpen size={14} />,
  meeting: <Users size={14} />,
  access: <GitBranch size={14} />,
  task: <ListTodo size={14} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  training: 'bg-brand/20 text-brand-light border border-brand/30',
  meeting: 'bg-gold/20 text-gold border border-gold/30',
  access: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  task: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
};

const TOTAL_TASKS = 16;

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const percentage = Math.round((completed / total) * 100);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full py-6">
      <div className="relative inline-flex items-center justify-center">
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#24304A" strokeWidth="14" />
          <circle
            cx="110" cy="110" r={radius} fill="none"
            stroke="#C9A84C" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? strokeDashoffset : circumference}
            style={{ transition: animated ? 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none' }}
          />
          <circle
            cx="110" cy="110" r={radius} fill="none"
            stroke="#C9A84C" strokeWidth="22" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? strokeDashoffset : circumference}
            opacity="0.12"
            style={{ transition: animated ? 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none', filter: 'blur(4px)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="text-5xl font-bold font-display text-foreground"
          >
            {percentage}%
          </motion.span>
          <span className="text-xs text-muted-foreground mt-1 text-center leading-tight px-4">
            Onboarding Completion
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">{completed}/{total} tasks done</span>
          <span className="mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-light border border-brand/30">
            Week 2
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mt-2">Your onboarding progress</p>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task, index, isCompleted, onToggle, variant = 'blue',
}: {
  task: Task; index: number; isCompleted: boolean; onToggle: (id: string) => void; variant?: 'gold' | 'blue' | 'muted';
}) {
  const borderColors = {
    gold: 'border-gold/40 hover:border-gold/70 hover:shadow-gold-glow',
    blue: 'border-brand/30 hover:border-brand/60 hover:shadow-blue-glow',
    muted: 'border-navy-border hover:border-navy-border/80',
  };
  const iconBgColors = {
    gold: 'bg-gold/15 text-gold',
    blue: 'bg-brand/15 text-brand-light',
    muted: 'bg-secondary text-muted-foreground',
  };
  const categoryIcons: Record<string, React.ReactNode> = {
    training: <Shield size={16} />, meeting: <Users size={16} />,
    access: <GitBranch size={16} />, task: <Monitor size={16} />,
  };
  const ctaLabels: Record<string, string> = {
    training: 'Go to Module', meeting: 'Schedule Meeting', access: 'Request Access', task: 'View Task',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
      className={`relative flex flex-col bg-card rounded-xl border p-4 card-hover cursor-default ${borderColors[variant]} ${isCompleted ? 'opacity-60' : ''}`}
      style={{ minHeight: '220px' }}
    >
      <div className="absolute inset-x-0 top-0 h-16 rounded-t-xl opacity-30 pointer-events-none" style={{
        background: variant === 'gold' ? 'linear-gradient(180deg, rgba(201,168,76,0.08) 0%, transparent 100%)' :
          variant === 'blue' ? 'linear-gradient(180deg, rgba(37,99,235,0.08) 0%, transparent 100%)' : 'none',
      }} />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBgColors[variant]}`}>{categoryIcons[task.category] ?? <ListTodo size={16} />}</div>
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
          <Clock size={11} />
          <span>Due: {task.dueDate ?? `Day +${task.due_offset_days}`}</span>
        </div>
        <button
          type="button"
          className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
            isCompleted ? 'bg-secondary text-muted-foreground cursor-default' :
            variant === 'gold' ? 'bg-gold text-navy hover:bg-gold/90 active:scale-95' :
            'bg-brand hover:bg-brand/90 text-white active:scale-95'
          }`}
          disabled={isCompleted}
        >
          {isCompleted ? 'Completed' : (ctaLabels[task.category] ?? 'View Task')}
          {!isCompleted && <ArrowRight size={11} />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Nudge Banner ─────────────────────────────────────────────────────────────

function NudgeBanner({ message, index }: { message: string; index: number }) {
  const [dismissed, setDismissed] = useState(false);
  const actionMatch = message.match(/(.+?)\s*—\s*(.+)$/);
  const mainText = actionMatch ? actionMatch[1] : message;
  const actionText = actionMatch ? actionMatch[2] : null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16, height: 0 }}
          transition={{ delay: index * 0.08, duration: 0.3 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gold/25"
          style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.04) 100%)' }}
        >
          <div className="shrink-0 p-1.5 rounded-lg bg-gold/15"><Sparkles size={14} className="text-gold" /></div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-foreground">{mainText}</span>
            {actionText && <span className="ml-2 text-xs text-gold/80 italic">{actionText}</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" className="text-xs font-medium text-gold hover:text-gold/80 transition-colors px-2.5 py-1 rounded-lg border border-gold/30">Action</button>
            <button type="button" onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors text-xs">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

interface TimelinePhase {
  label: string;
  range: string;
  status: 'current' | 'active' | 'upcoming';
  tasks: Task[];
}

function TimelineSection({ phases, completedIds }: { phases: TimelinePhase[]; completedIds: Set<string> }) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-gold via-brand to-navy-border opacity-40" />
      <div className="space-y-6">
        {phases.map((phase, phaseIndex) => (
          <motion.div
            key={phase.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: phaseIndex * 0.1 + 0.4 }}
            className="relative pl-10"
          >
            <div className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 ${
              phase.status === 'current' ? 'border-gold bg-gold/15 animate-pulse-gold' :
              phase.status === 'active' ? 'border-brand bg-brand/15' : 'border-navy-border bg-navy-card'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                phase.status === 'current' ? 'bg-gold' : phase.status === 'active' ? 'bg-brand-light' : 'bg-navy-border'
              }`} />
            </div>
            <div className={`flex items-center gap-3 mb-3 p-3 rounded-xl border ${
              phase.status === 'current' ? 'border-gold/40 bg-gold/5 shadow-gold-glow' :
              phase.status === 'active' ? 'border-brand/30 bg-brand/5' : 'border-navy-border/50 bg-card/40'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold font-display text-sm text-foreground">{phase.label}</span>
                  {phase.status === 'current' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold border border-gold/30">Current</span>}
                  {phase.status === 'active' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand-light border border-brand/30">Active</span>}
                  {phase.status === 'upcoming' && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">Upcoming</span>}
                </div>
                <span className="text-xs text-muted-foreground">{phase.range}</span>
              </div>
            </div>
            <div className="space-y-1.5 ml-1">
              {phase.tasks.slice(0, 4).map((task) => {
                const done = completedIds.has(task.id) || (task.completed ?? false);
                return (
                  <div key={task.id} className={`flex items-center gap-2.5 text-xs py-1.5 px-3 rounded-lg transition-colors ${
                    done ? 'text-muted-foreground line-through' : phase.status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                  }`}>
                    {done ? <CheckCircle2 size={12} className="text-gold shrink-0" /> :
                     phase.status === 'upcoming' ? <Clock size={12} className="text-muted-foreground shrink-0" /> :
                     <Circle size={12} className="text-brand shrink-0" />}
                    <span className="flex-1 truncate">{task.title}</span>
                    {CATEGORY_ICONS[task.category] && (
                      <span className={`shrink-0 ${CATEGORY_COLORS[task.category] ?? ''} px-1.5 py-0.5 rounded text-xs flex items-center gap-1`}>
                        {CATEGORY_ICONS[task.category]}
                      </span>
                    )}
                  </div>
                );
              })}
              {phase.tasks.length > 4 && <p className="text-xs text-muted-foreground pl-7">+{phase.tasks.length - 4} more</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Dashboard', icon: <Home size={14} />, active: true },
  { label: 'Tasks', icon: <ListTodo size={14} />, active: false },
  { label: 'Progress', icon: <TrendingUp size={14} />, active: false },
  { label: 'People', icon: <Users size={14} />, active: false },
  { label: 'Resources', icon: <FileText size={14} />, active: false },
];

function Navbar({ onChatOpen }: { onChatOpen: () => void }) {
  const { user, logout } = useAuthStore();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-border/60" style={{ background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)' }}>
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
          {NAV_LINKS.map((link) => (
            <button key={link.label} type="button" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              link.active ? 'text-foreground bg-card border border-border/80' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}>{link.icon}{link.label}</button>
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
          <button type="button" onClick={onChatOpen} className="relative p-1.5 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-foreground" title="AI Assistant">
            <MessageSquare size={16} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
          </button>
          <button type="button" className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-card transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium text-foreground leading-none">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">{user?.role || 'Employee'}</p>
            </div>
            <ChevronDown size={12} className="text-muted-foreground hidden md:block" />
          </button>
          <button type="button" onClick={logout} title="Logout" className="p-1.5 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-destructive">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuthStore();
  const [planData, setPlanData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const userObj = {
      id: user?.id || 'guest',
      name: user?.name || 'New Employee',
      email: user?.email || '',
      role: user?.role || 'Software Engineer',
      department: user?.department || 'Engineering',
      seniority: user?.seniority || 'L3',
      location: user?.location || 'Remote',
      startDate: user?.startDate || new Date().toISOString().split('T')[0],
      completedTasks: user?.completedTasks || [],
    };

    api.plan.generate(userObj)
      .then((data) => {
        clearTimeout(timeout);
        setPlanData(data as PlanResponse);
        const saved = api.tasks.getCompleted(userObj.id);
        setCompletedIds(new Set(saved));
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setPlanData(MOCK_RESPONSE);
        setError(true);
        setLoading(false);
      });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [user]);

  const toggleTask = (id: string) => {
    const newCompleted = new Set(completedIds);
    const isNowCompleted = !newCompleted.has(id);
    if (isNowCompleted) newCompleted.add(id); else newCompleted.delete(id);
    setCompletedIds(newCompleted);
    api.tasks.complete(user?.id || 'guest', id, isNowCompleted);
  };

  const data = planData ?? MOCK_RESPONSE;
  const allTasks = [...data.full_plan.day_0_7, ...data.full_plan.week_2_4, ...data.full_plan.day_30_60, ...data.full_plan.day_60_90];
  const completedCount = allTasks.filter((t) => completedIds.has(t.id) || (t.completed ?? false)).length;

  const timelinePhases = [
    { label: 'Day 0–7', range: 'Getting started', status: 'current' as const, tasks: data.full_plan.day_0_7 },
    { label: 'Week 2–4', range: 'Role foundations', status: 'active' as const, tasks: data.full_plan.week_2_4 },
    { label: 'Day 30–60', range: 'Deeper ownership', status: 'upcoming' as const, tasks: data.full_plan.day_30_60 },
    { label: 'Day 60–90', range: 'Autonomy & impact', status: 'upcoming' as const, tasks: data.full_plan.day_60_90 },
  ];

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0A0F1E 0%, #070B16 100%)' }}>
      <Navbar onChatOpen={() => setChatOpen(true)} />

      <main className="max-w-[1300px] mx-auto px-6 py-8">
        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-bold font-display text-foreground mb-1">
            Welcome, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Day {data.day_in_journey} of your onboarding journey
            <span className="mx-2 text-border">·</span>
            {user?.role || 'Employee'}, {user?.department || 'Engineering'}
            {error && (
              <span className="ml-3 inline-flex items-center gap-1 text-xs text-gold/70">
                <AlertTriangle size={11} /> Using cached data
              </span>
            )}
          </p>
        </motion.section>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              <p className="text-sm text-muted-foreground">Generating your AI onboarding plan...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 Tasks + Progress Ring */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-gold/20 flex items-center justify-center"><Zap size={11} className="text-gold" /></span>
                Today's Top 3 Tasks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  {data.top_tasks[0] && (
                    <TaskCard task={data.top_tasks[0]} index={0} isCompleted={completedIds.has(data.top_tasks[0].id)} onToggle={toggleTask} variant="gold" />
                  )}
                </div>
                <div className="bg-card rounded-xl border border-border/60 card-hover" style={{ background: 'linear-gradient(135deg, #141B2D 0%, #0E1528 100%)' }}>
                  <ProgressRing completed={completedCount} total={TOTAL_TASKS} />
                </div>
                <div className="flex flex-col gap-4">
                  {data.top_tasks[1] && (
                    <TaskCard task={data.top_tasks[1]} index={1} isCompleted={completedIds.has(data.top_tasks[1].id)} onToggle={toggleTask} variant="blue" />
                  )}
                  {data.top_tasks[2] && (
                    <TaskCard task={data.top_tasks[2]} index={2} isCompleted={completedIds.has(data.top_tasks[2].id)} onToggle={toggleTask} variant="muted" />
                  )}
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
                {(data.nudges ?? []).slice(0, 3).map((nudge, i) => (
                  <NudgeBanner key={nudge} message={nudge} index={i} />
                ))}
              </div>
            </section>

            {/* Timeline */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-brand/15 flex items-center justify-center"><Calendar size={11} className="text-brand-light" /></span>
                  30-60-90 Day Timeline
                </h2>
                <span className="text-xs text-muted-foreground">Day {data.day_in_journey} of 90</span>
              </div>
              <div className="max-w-2xl">
                <TimelineSection phases={timelinePhases} completedIds={completedIds} />
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 mt-12">
        <div className="max-w-[1300px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} OnboardIQ · AI-Powered Onboarding</p>
        </div>
      </footer>

      {/* AI Chatbot */}
      <AIChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Floating help/chat button */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-brand to-gold flex items-center justify-center text-white shadow-blue-glow hover:scale-110 active:scale-95 z-40 transition-all duration-200 group"
        title="Chat with Aria"
      >
        <MessageSquare size={22} />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full border-2 border-navy-dark animate-pulse" />
      </button>
    </div>
  );
}

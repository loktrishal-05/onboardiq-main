// ─── Serverless API — no backend needed on Vercel ────────────────────────────
// Auth: localStorage only (no server)
// AI: Gemini called directly from browser via VITE_GEMINI_API_KEY

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}
function lsDel(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

// ─── User type ────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  seniority: string;
  location: string;
  startDate: string;
  completedTasks: string[];
}

// ─── Auth — pure localStorage ─────────────────────────────────────────────────

function hashPassword(password: string): string {
  // Simple hash for demo (not cryptographic — use backend for production)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getUsers(): Record<string, AppUser & { passwordHash: string }> {
  try {
    return JSON.parse(lsGet('oiq_users') || '{}');
  } catch { return {}; }
}

function saveUsers(users: Record<string, AppUser & { passwordHash: string }>) {
  lsSet('oiq_users', JSON.stringify(users));
}

async function signup(body: {
  name: string; email: string; password: string;
  role?: string; department?: string; seniority?: string;
  location?: string; startDate?: string;
}): Promise<{ user: AppUser; token: string }> {
  const { name, email, password, role, department, seniority, location, startDate } = body;

  if (!name?.trim()) throw new Error('Full name is required.');
  if (!email?.trim() || !email.includes('@')) throw new Error('Valid email is required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  const users = getUsers();
  if (users[email.toLowerCase()]) throw new Error('An account with this email already exists.');

  const user: AppUser = {
    id: Date.now().toString(36),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role: role || 'Software Engineer',
    department: department || 'Engineering',
    seniority: seniority || 'L3',
    location: location || 'Remote',
    startDate: startDate || new Date().toISOString().split('T')[0],
    completedTasks: [],
  };

  users[user.email] = { ...user, passwordHash: hashPassword(password) };
  saveUsers(users);

  const token = btoa(JSON.stringify({ id: user.id, email: user.email, ts: Date.now() }));
  return { user, token };
}

async function login(body: { email: string; password: string }): Promise<{ user: AppUser; token: string }> {
  const { email, password } = body;
  if (!email || !password) throw new Error('Email and password are required.');

  const users = getUsers();
  const stored = users[email.toLowerCase()];
  if (!stored) throw new Error('Invalid email or password.');
  if (stored.passwordHash !== hashPassword(password)) throw new Error('Invalid email or password.');

  const { passwordHash: _, ...user } = stored;
  const token = btoa(JSON.stringify({ id: user.id, email: user.email, ts: Date.now() }));
  return { user, token };
}

function getMe(): AppUser | null {
  try {
    const raw = lsGet('onboardiq_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Gemini direct call ───────────────────────────────────────────────────────

async function geminiGenerate(prompt: string): Promise<string> {
  if (!GEMINI_KEY) {
    console.warn('VITE_GEMINI_API_KEY not set — using mock data');
    throw new Error('NO_API_KEY');
  }
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function geminiChat(systemPrompt: string, history: { role: string; content: string }[], message: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('NO_API_KEY');

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: "Understood! I'm Aria, ready to help." }] },
    ...history.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble right now. Please try again!";
}

// ─── Mock plan fallback ───────────────────────────────────────────────────────

const MOCK_PLAN = {
  day_in_journey: 1,
  nudges: [
    'Schedule your first 1:1 with your manager this week',
    'Complete the Security Training module by Day 7',
    'Join the #new-hires Slack channel and introduce yourself',
  ],
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

// ─── Plan generation ──────────────────────────────────────────────────────────

async function generatePlan(user: AppUser) {
  const startDate = new Date(user.startDate || Date.now());
  const today = new Date();
  const dayInJourney = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Return cached plan if exists
  const cacheKey = `oiq_plan_${user.id}`;
  const cached = lsGet(cacheKey);
  if (cached) {
    try {
      const plan = JSON.parse(cached);
      plan.day_in_journey = dayInJourney;
      return plan;
    } catch {}
  }

  const prompt = `You are an expert HR onboarding specialist. Generate a personalized 30-60-90 day onboarding plan.

Employee: Role: ${user.role}, Department: ${user.department}, Seniority: ${user.seniority}, Location: ${user.location}, Day ${dayInJourney} of journey.

Return ONLY valid JSON, no markdown, no explanation:
{
  "day_in_journey": ${dayInJourney},
  "nudges": ["urgent action 1", "urgent action 2", "urgent action 3"],
  "top_tasks": [
    {"id":"t1","title":"...","description":"...","category":"training","due_offset_days":7,"dueDate":"","isUnlocked":true,"completed":false},
    {"id":"t2","title":"...","description":"...","category":"meeting","due_offset_days":3,"dueDate":"","isUnlocked":true,"completed":false},
    {"id":"t3","title":"...","description":"...","category":"access","due_offset_days":5,"dueDate":"","isUnlocked":true,"completed":false}
  ],
  "full_plan": {
    "day_0_7": [4-6 tasks],
    "week_2_4": [3-4 tasks],
    "day_30_60": [3 tasks],
    "day_60_90": [3 tasks]
  }
}
Categories must be one of: training, meeting, access, task`;

  try {
    const text = await geminiGenerate(prompt);
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const plan = JSON.parse(clean);
    lsSet(cacheKey, JSON.stringify(plan));
    return plan;
  } catch {
    const mock = { ...MOCK_PLAN, day_in_journey: dayInJourney };
    lsSet(cacheKey, JSON.stringify(mock));
    return mock;
  }
}

// ─── Task completion ──────────────────────────────────────────────────────────

function completeTask(userId: string, taskId: string, completed: boolean): string[] {
  const key = `oiq_tasks_${userId}`;
  let tasks: string[] = [];
  try { tasks = JSON.parse(lsGet(key) || '[]'); } catch {}
  if (completed && !tasks.includes(taskId)) tasks.push(taskId);
  if (!completed) tasks = tasks.filter(id => id !== taskId);
  lsSet(key, JSON.stringify(tasks));
  return tasks;
}

function getCompletedTasks(userId: string): string[] {
  try { return JSON.parse(lsGet(`oiq_tasks_${userId}`) || '[]'); } catch { return []; }
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

const ARIA_SYSTEM = `You are Aria, the AI onboarding assistant for OnboardIQ — an intelligent employee onboarding platform. Help new employees navigate their first 90 days. Be warm, professional, and concise (2-3 sentences unless more detail is needed). Use emojis sparingly.`;

async function chatMessage(message: string, history: { role: string; content: string }[], user?: AppUser | null): Promise<string> {
  const context = user
    ? `\nEmployee: ${user.name}, Role: ${user.role}, Department: ${user.department}, Day ${Math.max(1, Math.ceil((Date.now() - new Date(user.startDate).getTime()) / 86400000))} of onboarding.`
    : '';

  try {
    return await geminiChat(ARIA_SYSTEM + context, history, message);
  } catch (e) {
    const err = e as Error;
    if (err.message === 'NO_API_KEY') {
      return "Hi! I'm Aria 👋 I'm not fully connected yet — the admin needs to add the GEMINI_API_KEY to Vercel. For now, feel free to explore your onboarding dashboard!";
    }
    return "I'm having a bit of trouble connecting right now. Please try again in a moment! 🔄";
  }
}

// ─── Exported API object ──────────────────────────────────────────────────────

export const api = {
  auth: { signup, login, getMe },
  plan: { generate: generatePlan },
  chat: { message: chatMessage },
  tasks: { complete: completeTask, getCompleted: getCompletedTasks },
};

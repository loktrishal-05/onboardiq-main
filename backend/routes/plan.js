import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MOCK_RESPONSE = {
  day_in_journey: 12,
  nudges: [
    'Schedule 1:1 with Manager',
    'Complete Security Training by Friday',
    'Your Git access request is pending — want me to follow up?',
  ],
  top_tasks: [
    {
      id: 't1', title: 'Complete Security Training',
      description: 'Finish the mandatory security awareness module covering data protection and access policies.',
      category: 'training', due_offset_days: 7, dueDate: '2026-04-10', isUnlocked: true, completed: false,
    },
    {
      id: 't2', title: 'Schedule 1:1 with Manager',
      description: 'Book your first one-on-one meeting with your manager to align on goals and expectations.',
      category: 'meeting', due_offset_days: 3, dueDate: '2026-04-06', isUnlocked: true, completed: false,
    },
    {
      id: 't3', title: 'Setup Dev Environment',
      description: 'Configure your local development environment: install IDE, set up SSH keys, clone repos.',
      category: 'access', due_offset_days: 5, dueDate: '2026-04-08', isUnlocked: true, completed: false,
    },
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

// POST /api/plan/generate
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { role, department, seniority, location, start_date } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const startDate = new Date(user.startDate || start_date || Date.now());
    const today = new Date();
    const dayInJourney = Math.max(1, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));

    if (user.onboardingPlan) {
      return res.json({ ...user.onboardingPlan, day_in_journey: dayInJourney });
    }

    const prompt = `You are an expert HR onboarding specialist. Generate a structured 30-60-90 day onboarding plan for a new employee.

Employee Details:
- Role: ${role || user.role}
- Department: ${department || user.department}
- Seniority: ${seniority || user.seniority}
- Location: ${location || user.location}
- Start Date: ${startDate.toISOString().split('T')[0]}
- Day in Journey: ${dayInJourney}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "day_in_journey": ${dayInJourney},
  "nudges": ["nudge1", "nudge2", "nudge3"],
  "top_tasks": [
    {"id": "t1", "title": "...", "description": "...", "category": "training|meeting|access|task", "due_offset_days": 7, "dueDate": "YYYY-MM-DD", "isUnlocked": true, "completed": false}
  ],
  "full_plan": {
    "day_0_7": [...],
    "week_2_4": [...],
    "day_30_60": [...],
    "day_60_90": [...]
  }
}

Each phase should have 3-6 tasks. Categories must be: "training", "meeting", "access", or "task". top_tasks should be 3 most urgent uncompleted tasks.`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const clean = text.replace(/```json\n?|\n?```/g, '').trim();
      const planData = JSON.parse(clean);
      user.onboardingPlan = planData;
      await user.save();
      return res.json(planData);
    } catch (aiErr) {
      console.error('Gemini error, using mock:', aiErr.message);
      return res.json({ ...MOCK_RESPONSE, day_in_journey: dayInJourney });
    }
  } catch (err) {
    console.error('Plan error:', err);
    res.status(500).json({ error: 'Failed to generate plan.' });
  }
});

// POST /api/plan/generate-public (no auth — fallback for unauthenticated)
router.post('/generate-public', async (req, res) => {
  const { role, department, seniority, location } = req.body;
  try {
    const prompt = `Generate a 30-60-90 day employee onboarding plan for Role: ${role || 'Software Engineer'}, Department: ${department || 'Engineering'}, Seniority: ${seniority || 'L3'}, Location: ${location || 'Remote'}. Return ONLY valid JSON matching this structure: {"day_in_journey":1,"nudges":["..."],"top_tasks":[{"id":"t1","title":"...","description":"...","category":"training","due_offset_days":7,"dueDate":"2026-04-10","isUnlocked":true,"completed":false}],"full_plan":{"day_0_7":[...],"week_2_4":[...],"day_30_60":[...],"day_60_90":[...]}}`;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    res.json(JSON.parse(text));
  } catch {
    res.json(MOCK_RESPONSE);
  }
});

export default router;

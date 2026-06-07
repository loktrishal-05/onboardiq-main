# OnboardIQ — AI-Powered Employee Onboarding Platform

A full-stack employee onboarding portal with a cinematic dark UI, 3D animations, Gemini AI chatbot (Aria), personalized 30-60-90 day plans, and a complete auth system.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| 3D / Animation | Three.js, @react-three/fiber, @react-three/drei, GSAP |
| State | Zustand |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI | Google Gemini 1.5 Flash |
| Animations | Motion (Framer Motion) |

---

## Project Structure

```
onboardiq/
├── backend/                 # Node.js/Express API
│   ├── middleware/auth.js   # JWT middleware
│   ├── models/User.js       # Mongoose user model
│   ├── routes/
│   │   ├── auth.js          # /api/auth — login, signup, me
│   │   ├── plan.js          # /api/plan — Gemini plan generation
│   │   ├── chat.js          # /api/chat — Aria AI chatbot
│   │   └── dashboard.js     # /api/dashboard — stats, task completion
│   └── server.js
├── src/frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.tsx   # 3D hero + GSAP scroll
│       │   ├── LoginPage.tsx     # Auth
│       │   ├── SignupPage.tsx    # Multi-step signup
│       │   └── Dashboard.tsx    # Full onboarding dashboard
│       ├── components/
│       │   └── chatbot/
│       │       └── AIChatbot.tsx # Aria AI chatbot widget
│       ├── store/authStore.ts    # Zustand auth state
│       └── utils/api.ts         # API client
└── package.json             # Root workspace scripts
```

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/onboardiq-main.git
cd onboardiq-main
npm run install:all
```

### 2. Backend environment

```bash
cd backend
cp .env.example .env
```

Fill in `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/onboardiq
JWT_SECRET=your_super_secret_key_change_this_in_production
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Get your Gemini API key free at: https://aistudio.google.com/app/apikey

### 3. Run

```bash
# From root — runs backend + frontend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Features

### Landing Page
- Three.js 3D animated hero (floating orbs, particle field, rotating ring)
- GSAP ScrollTrigger scroll animations
- Stats section, features grid, how-it-works timeline

### Auth
- Signup with 2-step form (account → role details)
- Login with JWT token
- Protected dashboard route

### Dashboard
- AI-generated 30-60-90 day onboarding plan (Gemini)
- Animated SVG progress ring
- Top 3 task cards with completion toggle
- Smart nudge banners
- 4-phase timeline (Day 0-7, Week 2-4, Day 30-60, Day 60-90)
- Real-time task completion synced to MongoDB

### Aria — AI Chatbot
- Floating chat widget (bottom-right)
- Powered by Gemini 1.5 Flash
- Full conversation history
- Quick prompt suggestions
- Personalized to user context (role, department, day in journey)

---

## API Endpoints

```
POST /api/auth/signup         — Register new user
POST /api/auth/login          — Login
GET  /api/auth/me             — Get current user (auth required)

POST /api/plan/generate       — Generate AI onboarding plan (auth required)
POST /api/plan/generate-public — Generate plan without auth

POST /api/chat/message        — Chat with Aria (auth required)
POST /api/chat/message-public — Chat without auth

GET  /api/dashboard/stats     — Dashboard stats (auth required)
PATCH /api/dashboard/complete-task — Toggle task completion (auth required)
```

---

## Deployment

### Frontend → Vercel
```bash
cd src/frontend
npm run build
# Deploy dist/ to Vercel
```

### Backend → Railway / Render
Set environment variables and deploy the `backend/` folder.

---

## License

MIT

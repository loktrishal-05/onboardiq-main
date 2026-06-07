import { create } from 'zustand';

interface User {
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

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
  updateCompletedTasks: (tasks: string[]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('onboardiq_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })(),
  token: localStorage.getItem('onboardiq_token'),
  isAuthenticated: !!localStorage.getItem('onboardiq_token'),
  isLoading: false,

  setAuth: (user, token) => {
    localStorage.setItem('onboardiq_token', token);
    localStorage.setItem('onboardiq_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('onboardiq_token');
    localStorage.removeItem('onboardiq_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setLoading: (v) => set({ isLoading: v }),

  updateCompletedTasks: (tasks) => set((state) => {
    const updated = state.user ? { ...state.user, completedTasks: tasks } : null;
    if (updated) localStorage.setItem('onboardiq_user', JSON.stringify(updated));
    return { user: updated };
  }),
}));

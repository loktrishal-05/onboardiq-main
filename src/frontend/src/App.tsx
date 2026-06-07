import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';

type Route = '/' | '/login' | '/signup' | '/dashboard';

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const [route, setRoute] = useState<Route>(() => {
    const hash = window.location.hash.replace('#', '') as Route;
    return hash || '/';
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as Route;
      setRoute(hash || '/');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (isAuthenticated && (route === '/login' || route === '/signup')) {
      window.location.hash = '#/dashboard';
    }
  }, [isAuthenticated, route]);

  // Protect dashboard
  if (route === '/dashboard') {
    if (!isAuthenticated) {
      window.location.hash = '#/login';
      return null;
    }
    return <Dashboard />;
  }

  if (route === '/login') return <LoginPage />;
  if (route === '/signup') return <SignupPage />;

  return <LandingPage />;
}

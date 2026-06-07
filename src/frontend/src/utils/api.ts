const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('onboardiq_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  auth: {
    signup: (body: object) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }, false),
    login: (body: object) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }, false),
    me: () => request('/auth/me'),
  },
  plan: {
    generate: (body: object) => request('/plan/generate', { method: 'POST', body: JSON.stringify(body) }),
    generatePublic: (body: object) => request('/plan/generate-public', { method: 'POST', body: JSON.stringify(body) }, false),
  },
  chat: {
    message: (body: object) => request('/chat/message', { method: 'POST', body: JSON.stringify(body) }),
    messagePublic: (body: object) => request('/chat/message-public', { method: 'POST', body: JSON.stringify(body) }, false),
  },
  dashboard: {
    stats: () => request('/dashboard/stats'),
    completeTask: (body: object) => request('/dashboard/complete-task', { method: 'PATCH', body: JSON.stringify(body) }),
  },
};

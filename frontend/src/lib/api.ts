const API_BASE = '/api';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }

  return response.json();
}

// Auth
export const auth = {
  register: (data: { email: string; password: string; name: string }) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: data }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: data }),
  me: () => request<{ user: any }>('/auth/me'),
};

// Groups
export const groups = {
  create: (data: { name: string; description?: string }) =>
    request<{ group: any }>('/groups', { method: 'POST', body: data }),
  list: () => request<{ groups: any[] }>('/groups'),
  get: (groupId: string) => request<{ group: any }>(`/groups/${groupId}`),
  join: (inviteCode: string) => request<{ group: any }>(`/groups/${inviteCode}/join`, { method: 'POST' }),
  updateAssignmentMode: (groupId: string, mode: string) =>
    request<{ group: any }>(`/groups/${groupId}/assignment-mode`, { method: 'PATCH', body: { mode } }),
};

// Assignments
export const assignments = {
  generate: (groupId: string) =>
    request<{ assignments: any[] }>(`/groups/${groupId}/assignments/generate`, { method: 'POST' }),
  create: (groupId: string, data: { giverId: string; receiverId: string }) =>
    request<{ assignment: any }>(`/groups/${groupId}/assignments`, { method: 'POST', body: data }),
  list: (groupId: string) => request<{ assignments: any[] }>(`/groups/${groupId}/assignments`),
  delete: (groupId: string, assignmentId: string) =>
    request<{ success: boolean }>(`/groups/${groupId}/assignments/${assignmentId}`, { method: 'DELETE' }),
};

// Wishlist
export const wishlist = {
  create: (groupId: string, data: { title: string; url?: string; imageUrl?: string; notes?: string; priority?: number }) =>
    request<{ item: any }>(`/groups/${groupId}/wishlist`, { method: 'POST', body: data }),
  list: (groupId: string) => request<{ items: any[] }>(`/groups/${groupId}/wishlist`),
  update: (itemId: string, data: Partial<{ title: string; url?: string; imageUrl?: string; notes?: string; priority?: number }>) =>
    request<{ item: any }>(`/wishlist/${itemId}`, { method: 'PATCH', body: data }),
  delete: (itemId: string) => request<{ success: boolean }>(`/wishlist/${itemId}`, { method: 'DELETE' }),
  claim: (itemId: string) => request<{ claim: any }>(`/wishlist/${itemId}/claim`, { method: 'POST' }),
  unclaim: (itemId: string) => request<{ success: boolean }>(`/wishlist/${itemId}/claim`, { method: 'DELETE' }),
};

// API Configuration and Service Layer
// Using relative path so Vite proxy forwards to backend
const API_BASE_URL = '/api';

// Token management
export const getToken = (): string | null => {
  return localStorage.getItem('ncc_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('ncc_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('ncc_token');
  localStorage.removeItem('ncc_user');
};

export const getUser = () => {
  const user = localStorage.getItem('ncc_user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: any): void => {
  localStorage.setItem('ncc_user', JSON.stringify(user));
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    instituteCode?: string;
  }) => {
    const data = await apiRequest<{ token: string; user: any; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  },

  logout: () => {
    removeToken();
  },

  isAuthenticated: () => {
    return !!getToken();
  },
};

// Students API
export const studentsApi = {
  getAll: async () => {
    return apiRequest<any[]>('/students');
  },

  getById: async (id: string | number) => {
    return apiRequest<any>(`/students/${id}`);
  },

  create: async (studentData: FormData | object) => {
    const token = getToken();
    
    if (studentData instanceof FormData) {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: studentData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    }
    
    return apiRequest<{ id: number }>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  update: async (id: string | number, studentData: FormData | object) => {
    const token = getToken();
    
    if (studentData instanceof FormData) {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: studentData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    }
    
    return apiRequest<{ ok: boolean }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },

  delete: async (id: string | number) => {
    return apiRequest<{ ok: boolean }>(`/students/${id}`, {
      method: 'DELETE',
    });
  },
};

// Attendance API
export const attendanceApi = {
  record: async (studentId: number, date: string, status: string) => {
    return apiRequest<{ id: number }>('/attendance', {
      method: 'POST',
      body: JSON.stringify({ studentId, date, status }),
    });
  },

  getAll: async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/attendance${query}`);
  },
};

// Reports API
export const reportsApi = {
  getSummary: async () => {
    return apiRequest<any[]>('/reports/summary');
  },
};

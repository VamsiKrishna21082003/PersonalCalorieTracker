export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Helper function to normalize API URL (remove trailing slashes)
const getApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};

export const auth = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  },

  register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    return response.json();
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },
};

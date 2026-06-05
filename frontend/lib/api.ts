const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'mentor' | 'intern';
  mentor_id?: number | null;
  batch_name?: string | null;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  created_by: number;
  created_by_name?: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'under_review';
  assignment_status?: string;
  created_at: string;
}

export interface Blocker {
  id: number;
  intern_id: number;
  intern_name?: string;
  task_id?: number | null;
  task_title?: string | null;
  blocker_type: 'technical' | 'requirement' | 'dependency' | 'system' | 'communication';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  resolved_by?: number | null;
  resolution?: string | null;
  created_at: string;
  ai_suggestion_id?: number | null;
  ai_confidence?: number | null;
  ai_feedback?: 'pending' | 'helpful' | 'not_helpful' | null;
  ai_escalated?: boolean | null;
}

export interface DailyReport {
  id: number;
  intern_id: number;
  name?: string;
  intern_name?: string;
  report_date: string;
  task_id?: number | null;
  task_title?: string | null;
  description: string;
  hours_worked: string | number;
  completion_percentage: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ims_token') : '';
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

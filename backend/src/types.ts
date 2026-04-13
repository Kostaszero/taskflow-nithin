export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  project_id: string;
  created_by: string;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  user_id: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Express.Request {
  user?: JWTPayload;
}

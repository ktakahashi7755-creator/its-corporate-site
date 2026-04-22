export type UserRole = 'owner' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  push_token?: string;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: UserRole;
  user?: User;
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  color: string;
  allergy_notes?: string;
  institutions?: Institution[];
}

export interface Institution {
  id: string;
  child_id: string;
  name: string;
  type: 'nursery' | 'kindergarten' | 'elementary' | 'other';
  class_name?: string;
}

export interface Event {
  id: string;
  family_id: string;
  child_id?: string;
  title: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  institution_id?: string;
  source: 'manual' | 'ai';
  notes?: string;
  child?: Child;
}

export interface ChecklistTemplate {
  id: string;
  family_id: string;
  child_id?: string;
  name: string;
  is_daily: boolean;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  template_id?: string;
  event_id?: string;
  name: string;
  is_checked: boolean;
  checked_by?: string;
}

export interface HealthLog {
  id: string;
  child_id: string;
  recorded_by: string;
  recorded_at: string;
  temperature?: number;
  symptoms: string[];
  notes?: string;
  doctor_visit: boolean;
  child?: Child;
}

export interface Document {
  id: string;
  family_id: string;
  child_id?: string;
  image_url: string;
  ai_summary?: string;
  extracted_data?: ExtractedData;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
}

export interface ExtractedData {
  event_name?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  items?: string[];
  submission_deadline?: string;
  submission_items?: string[];
  notes?: string;
  tasks?: string[];
}

export interface Task {
  id: string;
  family_id: string;
  child_id?: string;
  title: string;
  due_date?: string;
  assigned_to?: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  assigned_user?: User;
  child?: Child;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_due' | 'health_alert' | 'checklist' | 'event' | 'invite';
  title: string;
  body: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export const SYMPTOM_OPTIONS = [
  '発熱',
  '鼻水',
  '咳',
  '下痢',
  '嘔吐',
  '発疹',
  '食欲不振',
  '腹痛',
  '頭痛',
  'のどの痛み',
];

export const CHILD_COLORS = [
  '#FF8FA3',
  '#A8D8EA',
  '#B5EAD7',
  '#FFD166',
  '#C7CEEA',
  '#FFDAC1',
];

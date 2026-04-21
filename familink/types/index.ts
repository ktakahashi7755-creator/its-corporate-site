// ============================================================
// Database types mirroring Supabase tables
// ============================================================

export type Role = 'owner' | 'admin' | 'member';
export type ChildColor = '#FF6B9D' | '#4ECDC4' | '#FFE66D' | '#A8E6CF' | '#FF8B94' | '#B4A7D6';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: Role;
  display_name: string;
  avatar_url?: string;
  joined_at: string;
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  birth_date: string;
  color: ChildColor;
  avatar_url?: string;
  school_name?: string;
  class_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: string;
  family_id: string;
  child_id?: string;
  name: string;
  type: 'nursery' | 'kindergarten' | 'elementary' | 'other';
  created_at: string;
}

export interface Event {
  id: string;
  family_id: string;
  child_id?: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  all_day: boolean;
  color?: string;
  reminder_days: number[];
  created_by: string;
  source: 'manual' | 'print_scan';
  document_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplate {
  id: string;
  family_id: string;
  child_id?: string;
  event_id?: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  template_id?: string;
  family_id: string;
  child_id?: string;
  event_id?: string;
  label: string;
  is_checked: boolean;
  checked_by?: string;
  checked_at?: string;
  due_date?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HealthLog {
  id: string;
  family_id: string;
  child_id: string;
  recorded_by: string;
  temperature?: number;
  symptoms: string[];
  memo?: string;
  needs_visit: boolean;
  recorded_at: string;
  created_at: string;
}

export interface Document {
  id: string;
  family_id: string;
  child_id?: string;
  title: string;
  image_url: string;
  ai_result?: PrintScanResult;
  confirmed: boolean;
  confirmed_by?: string;
  confirmed_at?: string;
  created_by: string;
  created_at: string;
}

export interface Task {
  id: string;
  family_id: string;
  child_id?: string;
  title: string;
  description?: string;
  is_done: boolean;
  done_by?: string;
  done_at?: string;
  due_date?: string;
  assigned_to?: string;
  priority: 'low' | 'normal' | 'high';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  family_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export type NotificationType =
  | 'event_reminder'
  | 'submission_reminder'
  | 'health_update'
  | 'tomorrow_reminder'
  | 'task_assigned'
  | 'task_done'
  | 'family_invited'
  | 'family_joined'
  | 'checklist_update';

// ============================================================
// AI Print Scan types
// ============================================================

export interface PrintScanResult {
  event_name: string;
  event_date: string;
  start_time?: string;
  items_to_bring: string[];
  submission_deadline?: string;
  submission_items: string[];
  notes?: string;
  summary: string;
  confidence: number;
}

// ============================================================
// UI / App types
// ============================================================

export interface TabItem {
  name: string;
  label: string;
  icon: string;
}

export interface ChildWithAge extends Child {
  age: number;
  ageLabel: string;
}

export interface TomorrowSummary {
  events: Event[];
  checklistItems: ChecklistItem[];
  allChecked: boolean;
  checkedCount: number;
  totalCount: number;
}

-- ふぁみりんく 初期スキーマ

-- users テーブル（Supabase authと連携）
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  avatar_url text,
  push_token text,
  created_at timestamptz default now()
);
alter table public.users enable row level security;
create policy "users can read own data" on public.users for select using (auth.uid() = id);
create policy "users can update own data" on public.users for update using (auth.uid() = id);
create policy "users can insert own data" on public.users for insert with check (auth.uid() = id);

-- families テーブル
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_at timestamptz default now()
);
alter table public.families enable row level security;

-- family_members テーブル
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member', 'viewer')),
  created_at timestamptz default now(),
  unique(family_id, user_id)
);
alter table public.family_members enable row level security;

-- RLS: family_membersを通じてfamiliesへのアクセスを制御
create policy "family members can read family" on public.families for select
  using (
    exists (
      select 1 from public.family_members
      where family_id = families.id and user_id = auth.uid()
    )
  );
create policy "family members can insert family" on public.families for insert
  with check (true);
create policy "family members can update family" on public.families for update
  using (
    exists (
      select 1 from public.family_members
      where family_id = families.id and user_id = auth.uid() and role = 'owner'
    )
  );
create policy "users can read family_members" on public.family_members for select
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.family_members fm2
      where fm2.family_id = family_members.family_id and fm2.user_id = auth.uid()
    )
  );
create policy "users can insert family_members" on public.family_members for insert
  with check (user_id = auth.uid());

-- children テーブル
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  birth_date date,
  gender text check (gender in ('male', 'female', 'other')),
  color text not null default '#FF8FA3',
  allergy_notes text,
  created_at timestamptz default now()
);
alter table public.children enable row level security;
create policy "family members can crud children" on public.children for all
  using (
    exists (
      select 1 from public.family_members
      where family_id = children.family_id and user_id = auth.uid()
    )
  );

-- institutions テーブル
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  name text not null,
  type text not null default 'nursery' check (type in ('nursery', 'kindergarten', 'elementary', 'other')),
  class_name text,
  created_at timestamptz default now()
);
alter table public.institutions enable row level security;
create policy "family members can crud institutions" on public.institutions for all
  using (
    exists (
      select 1 from public.children c
      join public.family_members fm on fm.family_id = c.family_id
      where c.id = institutions.child_id and fm.user_id = auth.uid()
    )
  );

-- events テーブル
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  title text not null,
  event_date date not null,
  start_time time,
  end_time time,
  institution_id uuid references public.institutions(id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'ai')),
  notes text,
  created_at timestamptz default now()
);
create index if not exists events_family_date_idx on public.events(family_id, event_date);
alter table public.events enable row level security;
create policy "family members can crud events" on public.events for all
  using (
    exists (
      select 1 from public.family_members
      where family_id = events.family_id and user_id = auth.uid()
    )
  );

-- checklist_templates テーブル
create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  name text not null,
  is_daily boolean not null default false,
  created_at timestamptz default now()
);
alter table public.checklist_templates enable row level security;
create policy "family members can crud checklist_templates" on public.checklist_templates for all
  using (
    exists (
      select 1 from public.family_members
      where family_id = checklist_templates.family_id and user_id = auth.uid()
    )
  );

-- checklist_items テーブル
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.checklist_templates(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  name text not null,
  is_checked boolean not null default false,
  checked_by uuid references public.users(id) on delete set null,
  updated_at timestamptz default now()
);
alter table public.checklist_items enable row level security;
create policy "family members can crud checklist_items" on public.checklist_items for all
  using (
    (template_id is not null and exists (
      select 1 from public.checklist_templates ct
      join public.family_members fm on fm.family_id = ct.family_id
      where ct.id = checklist_items.template_id and fm.user_id = auth.uid()
    ))
    or
    (event_id is not null and exists (
      select 1 from public.events e
      join public.family_members fm on fm.family_id = e.family_id
      where e.id = checklist_items.event_id and fm.user_id = auth.uid()
    ))
  );

-- health_logs テーブル
create table if not exists public.health_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  recorded_by uuid not null references public.users(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  temperature decimal(4,1),
  symptoms jsonb not null default '[]',
  notes text,
  doctor_visit boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists health_logs_child_at_idx on public.health_logs(child_id, recorded_at desc);
alter table public.health_logs enable row level security;
create policy "family members can crud health_logs" on public.health_logs for all
  using (
    exists (
      select 1 from public.children c
      join public.family_members fm on fm.family_id = c.family_id
      where c.id = health_logs.child_id and fm.user_id = auth.uid()
    )
  );

-- documents テーブル
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  image_url text not null default '',
  ai_summary text,
  extracted_data jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'confirmed', 'failed')),
  created_at timestamptz default now()
);
alter table public.documents enable row level security;
create policy "family members can crud documents" on public.documents for all
  using (
    exists (
      select 1 from public.family_members
      where family_id = documents.family_id and user_id = auth.uid()
    )
  );

-- tasks テーブル
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  title text not null,
  due_date date,
  assigned_to uuid references public.users(id) on delete set null,
  is_completed boolean not null default false,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now()
);
create index if not exists tasks_family_due_idx on public.tasks(family_id, due_date);
alter table public.tasks enable row level security;
create policy "family members can crud tasks" on public.tasks for all
  using (
    exists (
      select 1 from public.family_members
      where family_id = tasks.family_id and user_id = auth.uid()
    )
  );

-- notifications テーブル
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('task_due', 'health_alert', 'checklist', 'event', 'invite')),
  title text not null,
  body text not null,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists notifications_user_read_idx on public.notifications(user_id, is_read);
alter table public.notifications enable row level security;
create policy "users can read own notifications" on public.notifications for select
  using (user_id = auth.uid());
create policy "users can update own notifications" on public.notifications for update
  using (user_id = auth.uid());
create policy "system can insert notifications" on public.notifications for insert
  with check (true);

-- Supabase Storage バケット（手動で作成が必要）
-- documents バケットを public で作成してください
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', true);

-- Realtime 有効化（Supabase Dashboard で設定）
-- events, tasks, checklist_items, health_logs テーブルのRealtimeを有効にする

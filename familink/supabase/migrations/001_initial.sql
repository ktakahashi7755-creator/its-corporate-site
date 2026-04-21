-- ============================================================
-- ふぁみりんく Initial Schema
-- Supabase Migration 001
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- families
-- ============================================================
create table if not exists families (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  invite_code text not null unique,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table families enable row level security;

create policy "Family members can view their family"
  on families for select
  using (
    id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

create policy "Owner can update family"
  on families for update
  using (owner_id = auth.uid());

create policy "Authenticated users can create family"
  on families for insert
  with check (auth.uid() = owner_id);

-- ============================================================
-- family_members
-- ============================================================
create table if not exists family_members (
  id           uuid primary key default uuid_generate_v4(),
  family_id    uuid not null references families(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'admin', 'member')),
  display_name text not null,
  avatar_url   text,
  joined_at    timestamptz not null default now(),
  unique(family_id, user_id)
);

alter table family_members enable row level security;

create policy "Members can view family members"
  on family_members for select
  using (
    family_id in (
      select family_id from family_members fm where fm.user_id = auth.uid()
    )
  );

create policy "Users can join a family"
  on family_members for insert
  with check (auth.uid() = user_id);

create policy "Members can update their own record"
  on family_members for update
  using (user_id = auth.uid());

-- ============================================================
-- children
-- ============================================================
create table if not exists children (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  birth_date  date not null,
  color       text not null default '#FF6B9D',
  avatar_url  text,
  school_name text,
  class_name  text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table children enable row level security;

create policy "Family members can view children"
  on children for select
  using (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

create policy "Family members can insert children"
  on children for insert
  with check (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

create policy "Family members can update children"
  on children for update
  using (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

-- ============================================================
-- events
-- ============================================================
create table if not exists events (
  id             uuid primary key default uuid_generate_v4(),
  family_id      uuid not null references families(id) on delete cascade,
  child_id       uuid references children(id) on delete set null,
  title          text not null,
  description    text,
  event_date     date not null,
  start_time     time,
  end_time       time,
  all_day        boolean not null default true,
  color          text,
  reminder_days  integer[] not null default '{3,1,0}',
  created_by     uuid not null references auth.users(id),
  source         text not null default 'manual' check (source in ('manual', 'print_scan')),
  document_id    uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table events enable row level security;

create policy "Family members can view events"
  on events for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can insert events"
  on events for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can update events"
  on events for update
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can delete events"
  on events for delete
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- ============================================================
-- checklist_items
-- ============================================================
create table if not exists checklist_items (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  child_id    uuid references children(id) on delete set null,
  event_id    uuid references events(id) on delete set null,
  label       text not null,
  is_checked  boolean not null default false,
  checked_by  uuid references auth.users(id),
  checked_at  timestamptz,
  due_date    date,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table checklist_items enable row level security;

create policy "Family members can view checklist"
  on checklist_items for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can insert checklist"
  on checklist_items for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can update checklist"
  on checklist_items for update
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can delete checklist"
  on checklist_items for delete
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- ============================================================
-- health_logs
-- ============================================================
create table if not exists health_logs (
  id           uuid primary key default uuid_generate_v4(),
  family_id    uuid not null references families(id) on delete cascade,
  child_id     uuid not null references children(id) on delete cascade,
  recorded_by  uuid not null references auth.users(id),
  temperature  numeric(4,1),
  symptoms     text[] not null default '{}',
  memo         text,
  needs_visit  boolean not null default false,
  recorded_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table health_logs enable row level security;

create policy "Family members can view health logs"
  on health_logs for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can insert health logs"
  on health_logs for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));

-- ============================================================
-- documents (print scans)
-- ============================================================
create table if not exists documents (
  id            uuid primary key default uuid_generate_v4(),
  family_id     uuid not null references families(id) on delete cascade,
  child_id      uuid references children(id) on delete set null,
  title         text not null,
  image_url     text not null,
  ai_result     jsonb,
  confirmed     boolean not null default false,
  confirmed_by  uuid references auth.users(id),
  confirmed_at  timestamptz,
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now()
);

alter table documents enable row level security;

create policy "Family members can view documents"
  on documents for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can insert documents"
  on documents for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can update documents"
  on documents for update
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- ============================================================
-- tasks (shared board)
-- ============================================================
create table if not exists tasks (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  child_id    uuid references children(id) on delete set null,
  title       text not null,
  description text,
  is_done     boolean not null default false,
  done_by     uuid references auth.users(id),
  done_at     timestamptz,
  due_date    date,
  assigned_to uuid references auth.users(id),
  priority    text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "Family members can view tasks"
  on tasks for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can insert tasks"
  on tasks for insert
  with check (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can update tasks"
  on tasks for update
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "Family members can delete tasks"
  on tasks for delete
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

-- ============================================================
-- notifications
-- ============================================================
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  family_id  uuid not null references families(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null,
  data       jsonb,
  read       boolean not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "Users can view their notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Family members can insert notifications"
  on notifications for insert
  with check (
    family_id in (select family_id from family_members where user_id = auth.uid())
  );

create policy "Users can update their notifications"
  on notifications for update
  using (user_id = auth.uid());

-- ============================================================
-- Realtime
-- ============================================================
alter publication supabase_realtime add table checklist_items;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table health_logs;

-- ============================================================
-- Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public)
values ('familink', 'familink', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload to familink"
  on storage.objects for insert
  with check (bucket_id = 'familink' and auth.uid() is not null);

create policy "Public can view familink files"
  on storage.objects for select
  using (bucket_id = 'familink');

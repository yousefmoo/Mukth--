-- ── Mukth Platform Database Schema ───────────────────────────────────────────

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Enums
create type user_role as enum ('student', 'teacher', 'admin');
create type recording_status as enum ('pending', 'reviewed', 'needsRedo');
create type badge_tier as enum ('bronze', 'silver', 'gold', 'legendary');

-- 2. Profiles (Extends Auth.Users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  name_en text,
  email text unique not null,
  phone text,
  role user_role not null default 'student',
  avatar_url text,
  status text default 'active',
  curriculum text,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Halaqat
create table public.halaqat (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  name_en text,
  teacher_id uuid references public.profiles(id) on delete set null,
  curriculum text,
  capacity int default 8,
  status text default 'active',
  schedule jsonb not null default '[]'::jsonb, -- Array of {day, time, duration}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sessions (Live or Scheduled instances)
create type session_status as enum ('scheduled', 'active', 'finished');

create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  halqa_id uuid references public.halaqat(id) on delete cascade not null,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  meeting_url text,
  status session_status default 'scheduled',
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for sessions
alter table public.sessions enable row level security;

create policy "Sessions viewable by enrolled" on public.sessions for select using (
  exists (select 1 from public.enrollments where student_id = auth.uid() and halqa_id = sessions.halqa_id)
  or teacher_id = auth.uid()
  or (select role from public.profiles where id = auth.uid()) = 'admin'
);

create policy "Teachers manage their own sessions" on public.sessions for all using (teacher_id = auth.uid());

-- Indexing
create index idx_sessions_halqa on public.sessions(halqa_id);
create index idx_sessions_status on public.sessions(status);


-- 5. Recordings
create table public.recordings (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  surah_id int not null,
  surah_name text not null,
  ayah_range text not null,
  duration int not null, -- in seconds
  audio_url text,
  status recording_status default 'pending',
  ai_feedback jsonb default '{}'::jsonb, -- AI Agent insights {summary, suggestions, confidence}
  ai_score int, -- AI-calculated initial score
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 6. Feedback
create table public.feedback (
  id uuid default uuid_generate_v4() primary key,
  recording_id uuid references public.recordings(id) on delete cascade unique,
  teacher_id uuid references public.profiles(id) on delete set null,
  rating int check (rating >= 1 and rating <= 5),
  notes text,
  markers jsonb default '[]'::jsonb, -- Array of {time, type, note}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Gamification: Streaks
create table public.streaks (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  current_streak int default 0,
  longest_streak int default 0,
  last_activity_date date,
  freeze_available boolean default true,
  history jsonb default '{}'::jsonb -- { 'YYYY-MM-DD': true/false/'freeze' }
);

-- 8. Gamification: Badges Catalog
create table public.badges (
  id text primary key,
  category text not null,
  icon text not null,
  name text not null,
  name_en text,
  description text,
  tier badge_tier default 'bronze',
  requirement int not null,
  type text not null -- 'streak', 'juz', 'recording', etc.
);

-- 9. User Badges (Unlocked)
create table public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id text references public.badges(id) on delete cascade,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- 10. Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null, -- 'feedback', 'badge', 'session'
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Performance Indexes
create index idx_recordings_student on public.recordings(student_id);
create index idx_recordings_status on public.recordings(status);
create index idx_enrollments_student on public.enrollments(student_id);
create index idx_halaqat_teacher on public.halaqat(teacher_id);
create index idx_feedback_recording on public.feedback(recording_id);
create index idx_notifications_user on public.notifications(user_id) where not is_read;

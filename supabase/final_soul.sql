-- ==========================================
-- 🕋 MUKTH PLATFORM: THE SOUL (CORE DB)
-- ==========================================
-- This script contains the entire foundation:
-- 1. Schema (Tables, Enums, Indexes)
-- 2. RLS (Security Policies)
-- 3. Functions & Triggers (Business Logic)
-- 4. RPCs (Dashboard API calls)
-- 5. Seed Data (Badges)

-- ── 1. INITIAL SETUP ──────────────────────

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Drop existing (optional, for clean start)
-- drop schema public cascade;
-- create schema public;

-- ── 2. ENUMS ──────────────────────────────

create type user_role as enum ('student', 'teacher', 'admin');
create type recording_status as enum ('pending', 'reviewed', 'needsRedo');
create type badge_tier as enum ('bronze', 'silver', 'gold', 'legendary');

-- ── 3. TABLES ─────────────────────────────

-- Profiles (Extends Auth.Users)
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
  pages_memorized int default 0,
  hours_this_week float default 0,
  accuracy float default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active_at timestamp with time zone default timezone('utc'::text, now())
);

-- Halaqat
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

-- Enrollments
create table public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  halqa_id uuid references public.halaqat(id) on delete cascade,
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(student_id, halqa_id)
);

-- Recordings
create table public.recordings (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  surah_id int not null,
  surah_name text not null,
  ayah_range text not null,
  duration int not null, -- in seconds
  audio_url text,
  status recording_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Feedback
create table public.feedback (
  id uuid default uuid_generate_v4() primary key,
  recording_id uuid references public.recordings(id) on delete cascade unique,
  teacher_id uuid references public.profiles(id) on delete set null,
  rating int check (rating >= 1 and rating <= 5),
  notes text,
  markers jsonb default '[]'::jsonb, -- Array of {time, type, note}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Streaks
create table public.streaks (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  current_streak int default 0,
  longest_streak int default 0,
  last_activity_date date,
  freeze_available boolean default true,
  history jsonb default '{}'::jsonb
);

-- Badges Catalog
create table public.badges (
  id text primary key,
  category text not null,
  icon text not null,
  name text not null,
  name_en text,
  description text,
  tier badge_tier default 'bronze',
  requirement int not null,
  type text not null 
);

-- User Badges (Unlocked)
create table public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id text references public.badges(id) on delete cascade,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, badge_id)
);

-- Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null, 
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ── 4. INDEXES ────────────────────────────

create index idx_recordings_student on public.recordings(student_id);
create index idx_recordings_status on public.recordings(status);
create index idx_enrollments_student on public.enrollments(student_id);
create index idx_halaqat_teacher on public.halaqat(teacher_id);
create index idx_feedback_recording on public.feedback(recording_id);
create index idx_notifications_user on public.notifications(user_id) where not is_read;

-- ── 5. ROW LEVEL SECURITY (RLS) ───────────

alter table public.profiles enable row level security;
alter table public.halaqat enable row level security;
alter table public.enrollments enable row level security;
alter table public.recordings enable row level security;
alter table public.feedback enable row level security;
alter table public.streaks enable row level security;
alter table public.user_badges enable row level security;
alter table public.notifications enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Halaqat viewable by enrolled" on public.halaqat for select using (
  exists (select 1 from public.enrollments where student_id = auth.uid() and halqa_id = id)
  or teacher_id = auth.uid()
  or (select role from public.profiles where id = auth.uid()) = 'admin'
);

create policy "Admins manage enrollments" on public.enrollments for all using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Users view own enrollments" on public.enrollments for select using (student_id = auth.uid());

create policy "Students manage own recordings" on public.recordings for all using (student_id = auth.uid());
create policy "Teachers view student recordings" on public.recordings for select using (
  exists (select 1 from public.halaqat h join public.enrollments e on e.halqa_id = h.id where h.teacher_id = auth.uid() and e.student_id = recordings.student_id)
);

create policy "Students view feedback" on public.feedback for select using (exists (select 1 from public.recordings where id = recording_id and student_id = auth.uid()));
create policy "Teachers manage feedback" on public.feedback for all using (teacher_id = auth.uid());

create policy "Users view own streaks" on public.streaks for select using (user_id = auth.uid());
create policy "Users view own badges" on public.user_badges for select using (user_id = auth.uid());
create policy "Users manage own notifications" on public.notifications for all using (user_id = auth.uid());

-- ── 6. FUNCTIONS & TRIGGERS ───────────────

-- A. Auth -> Profile Link
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- B. Streak Logic
create or replace function public.handle_recording_streak()
returns trigger as $$
declare
  v_today date := current_date;
  v_streak_row public.streaks%rowtype;
begin
  select * into v_streak_row from public.streaks where user_id = new.student_id;
  if not found then
    insert into public.streaks (user_id, current_streak, longest_streak, last_activity_date, history)
    values (new.student_id, 1, 1, v_today, jsonb_build_object(v_today::text, true))
    returning * into v_streak_row;
  else
    if v_streak_row.last_activity_date is null or v_streak_row.last_activity_date < v_today then
      if v_streak_row.last_activity_date = v_today - interval '1 day' then
        v_streak_row.current_streak := v_streak_row.current_streak + 1;
      else
        if v_streak_row.last_activity_date != v_today then v_streak_row.current_streak := 1; end if;
      end if;
      v_streak_row.longest_streak := greatest(v_streak_row.longest_streak, v_streak_row.current_streak);
      v_streak_row.last_activity_date := v_today;
      v_streak_row.history := v_streak_row.history || jsonb_build_object(v_today::text, true);
      update public.streaks set current_streak = v_streak_row.current_streak, longest_streak = v_streak_row.longest_streak, last_activity_date = v_streak_row.last_activity_date, history = v_streak_row.history where user_id = new.student_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_recording_submitted
  after insert on public.recordings
  for each row execute function public.handle_recording_streak();

-- C. Feedback Notification
create or replace function public.notify_on_feedback()
returns trigger as $$
declare
  v_student_id uuid;
begin
  select student_id into v_student_id from public.recordings where id = new.recording_id;
  insert into public.notifications (user_id, title, message, type)
  values (v_student_id, 'تم استلام ملاحظات جديدة', 'لقد قام المعلم بمراجعة تسجيلك وإضافة ملاحظات.', 'feedback');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_feedback_submitted
  after insert on public.feedback
  for each row execute function public.notify_on_feedback();

-- ── 7. DASHBOARD RPCs ─────────────────────

-- Teacher Stats
create or replace function get_teacher_stats(t_id uuid)
returns json as $$
declare
  v_pending int;
  v_students int;
  v_sessions int;
  v_rating float;
begin
  select count(*) into v_pending from public.recordings where status = 'pending';
  select count(distinct student_id) into v_students from public.enrollments e join public.halaqat h on h.id = e.halqa_id where h.teacher_id = t_id;
  select count(*) into v_sessions from public.halaqat where teacher_id = t_id;
  select coalesce(avg(rating), 0) into v_rating from public.feedback where teacher_id = t_id;
  
  return json_build_object(
    'pendingReviews', v_pending,
    'totalStudents', v_students,
    'todaysSessions', v_sessions,
    'avgRating', v_rating
  );
end;
$$ language plpgsql security definer;

-- ── 8. SEED DATA ──────────────────────────

insert into public.badges (id, category, icon, name, name_en, description, tier, requirement, type)
values
  ('streak-7', 'streak', '🔥', 'سلسلة أسبوع', '7-Day Streak', 'حافظ على سلسلة ٧ أيام متتالية', 'bronze', 7, 'streak'),
  ('streak-30', 'streak', '💎', 'مثابر', 'Persevering', 'حافظ على سلسلة ٣٠ يوم', 'silver', 30, 'streak'),
  ('juz-1', 'milestone', '📖', 'ختمة الجزء الأول', 'First Juz', 'أكمل حفظ الجزء الأول', 'bronze', 1, 'juz'),
  ('juz-30', 'milestone', '🎓', 'حافظ', 'Hafiz', 'أكمل حفظ القرآن كاملاً', 'legendary', 30, 'juz'),
  ('first-recording', 'special', '🎙️', 'أول تسجيل', 'First Recording', 'أرسل أول تسجيل صوتي', 'bronze', 1, 'recording')
on conflict (id) do nothing;

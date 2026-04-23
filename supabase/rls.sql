-- ── Row Level Security (RLS) Policies ────────────────────────────────────────

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.halaqat enable row level security;
alter table public.enrollments enable row level security;
alter table public.recordings enable row level security;
alter table public.feedback enable row level security;
alter table public.streaks enable row level security;
alter table public.user_badges enable row level security;
alter table public.notifications enable row level security;

-- 1. Profiles Policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Halaqat Policies
create policy "Halaqat are viewable by enrolled students and teachers" on public.halaqat
  for select using (
    exists (select 1 from public.enrollments where student_id = auth.uid() and halqa_id = id)
    or teacher_id = auth.uid()
    or (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- 3. Enrollments Policies
create policy "Admins manage enrollments" on public.enrollments
  for all using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Users view their own enrollments" on public.enrollments
  for select using (student_id = auth.uid());

-- 4. Recordings Policies
create policy "Students can view and create their own recordings" on public.recordings
  for all using (student_id = auth.uid());

create policy "Teachers can view recordings of their students" on public.recordings
  for select using (
    exists (
      select 1 from public.halaqat h
      join public.enrollments e on e.halqa_id = h.id
      where h.teacher_id = auth.uid() and e.student_id = recordings.student_id
    )
  );

-- 5. Feedback Policies
create policy "Students view feedback on their recordings" on public.feedback
  for select using (
    exists (select 1 from public.recordings where id = recording_id and student_id = auth.uid())
  );

create policy "Teachers manage feedback for their assigned recordings" on public.feedback
  for all using (teacher_id = auth.uid());

-- 6. Streaks Policies
create policy "Users view their own streaks" on public.streaks
  for select using (user_id = auth.uid());

-- 7. User Badges Policies
create policy "Users view their own badges" on public.user_badges
  for select using (user_id = auth.uid());

-- 8. Notifications Policies
create policy "Users manage their own notifications" on public.notifications
  for all using (user_id = auth.uid());

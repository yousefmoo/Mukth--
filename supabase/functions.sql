-- ── Database Functions & Triggers (The Soul) ─────────────────────────────────

-- 1. Automatically update streaks on recording submission
create or replace function public.handle_recording_streak()
returns trigger as $$
declare
  v_today date := current_date;
  v_streak_row public.streaks%rowtype;
begin
  -- Get or create streak row
  select * into v_streak_row from public.streaks where user_id = new.student_id;
  
  if not found then
    insert into public.streaks (user_id, current_streak, longest_streak, last_activity_date, history)
    values (new.student_id, 1, 1, v_today, jsonb_build_object(v_today::text, true))
    returning * into v_streak_row;
  else
    -- Only increment if it's a new day
    if v_streak_row.last_activity_date is null or v_streak_row.last_activity_date < v_today then
      -- If yesterday was the last activity, increment. Otherwise, check if it's consecutive
      if v_streak_row.last_activity_date = v_today - interval '1 day' then
        v_streak_row.current_streak := v_streak_row.current_streak + 1;
      else
        -- Streak broken unless it was today (redundant check but safe)
        if v_streak_row.last_activity_date != v_today then
           v_streak_row.current_streak := 1;
        end if;
      end if;
      
      v_streak_row.longest_streak := greatest(v_streak_row.longest_streak, v_streak_row.current_streak);
      v_streak_row.last_activity_date := v_today;
      v_streak_row.history := v_streak_row.history || jsonb_build_object(v_today::text, true);
      
      update public.streaks
      set current_streak = v_streak_row.current_streak,
          longest_streak = v_streak_row.longest_streak,
          last_activity_date = v_streak_row.last_activity_date,
          history = v_streak_row.history
      where user_id = new.student_id;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_recording_submitted
  after insert on public.recordings
  for each row execute function public.handle_recording_streak();

-- 2. Notify student when feedback is received
create or replace function public.notify_on_feedback()
returns trigger as $$
declare
  v_student_id uuid;
begin
  select student_id into v_student_id from public.recordings where id = new.recording_id;
  
  insert into public.notifications (user_id, title, message, type)
  values (
    v_student_id,
    'تم استلام ملاحظات جديدة',
    'لقد قام المعلم بمراجعة تسجيلك وإضافة ملاحظات.',
    'feedback'
  );
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_feedback_submitted
  after insert on public.feedback
  for each row execute function public.notify_on_feedback();

-- 3. Function to initialize profile on Auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  
  -- Initialize streak
  insert into public.streaks (user_id) values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Notify students on session start
create or replace function public.notify_on_session_start()
returns trigger as $$
begin
  if new.status = 'active' then
    insert into public.notifications (user_id, title, message, type)
    select 
      student_id, 
      'بدأت حلقة مباشرة!', 
      'لقد بدأ المعلم حلقة مباشرة الآن. انضم للمشاركة.', 
      'session'
    from public.enrollments
    where halqa_id = new.halqa_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_session_started
  after insert or update on public.sessions
  for each row execute function public.notify_on_session_start();


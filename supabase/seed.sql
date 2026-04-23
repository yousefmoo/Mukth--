-- ── Seed Data for Badges ───────────────────────────────────────────────────

insert into public.badges (id, category, icon, name, name_en, description, tier, requirement, type)
values
  ('streak-7', 'streak', '🔥', 'سلسلة أسبوع', '7-Day Streak', 'حافظ على سلسلة ٧ أيام متتالية', 'bronze', 7, 'streak'),
  ('streak-30', 'streak', '💎', 'مثابر', 'Persevering', 'حافظ على سلسلة ٣٠ يوم', 'silver', 30, 'streak'),
  ('juz-1', 'milestone', '📖', 'ختمة الجزء الأول', 'First Juz', 'أكمل حفظ الجزء الأول', 'bronze', 1, 'juz'),
  ('juz-30', 'milestone', '🎓', 'حافظ', 'Hafiz', 'أكمل حفظ القرآن كاملاً', 'legendary', 30, 'juz'),
  ('first-recording', 'special', '🎙️', 'أول تسجيل', 'First Recording', 'أرسل أول تسجيل صوتي', 'bronze', 1, 'recording');

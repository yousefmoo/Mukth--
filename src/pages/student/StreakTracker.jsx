// ── Streak Tracker — Calendar heatmap + stats ────────────────────────────────
import { useT, useLocale } from '../../lib/i18n';
import { useStudentStore } from '../../stores/studentStore';
import { C } from '../../components/shared/tokens';
import Card from '../../components/ui/Card';

export default function StreakTracker() {
  const t = useT();
  const locale = useLocale();
  const streak = useStudentStore((s) => s.currentStreak);
  const longest = useStudentStore((s) => s.longestStreak);
  const history = useStudentStore((s) => s.streakHistory);

  // Generate last 90 days
  const days = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    // Simulate some history
    const simulated = i < streak || Math.random() > 0.3;
    days.push({ date: key, active: history[key] === true || (history[key] === undefined && simulated && i < 60) });
  }

  const weekDays = locale === 'ar'
    ? ['أحد', 'إثن', 'ثلث', 'أربع', 'خمس', 'جمع', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'IBM Plex Sans Arabic'", margin: '0 0 0.25rem' }}>
        🔥 {t.streak}
      </h1>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        {locale === 'ar' ? 'تتبع مواظبتك اليومية' : 'Track your daily consistency'}
      </p>

      {/* Streak stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{
          textAlign: 'center',
          background: `linear-gradient(135deg, ${C.g900}, ${C.g850})`,
          border: `1px solid ${C.gold}20`, color: '#fff',
        }}>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>{t.currentStreak}</div>
          <div style={{
            fontSize: '2.5rem', fontWeight: 900, lineHeight: 1,
            background: 'linear-gradient(135deg, #f97316, #dc2626)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {streak}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>🔥 {t.days}</div>
        </Card>

        <Card style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{t.longestStreak}</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: C.gold }}>{longest}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>👑 {t.days}</div>
        </Card>

        <Card style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            {locale === 'ar' ? 'نسبة المواظبة' : 'Consistency'}
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: C.g700 }}>
            {Math.round((days.filter((d) => d.active).length / days.length) * 100)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            {locale === 'ar' ? 'آخر ٩٠ يوم' : 'Last 90 days'}
          </div>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
          {locale === 'ar' ? '📅 خريطة المواظبة — آخر ٩٠ يوم' : '📅 Consistency Heatmap — Last 90 days'}
        </h3>

        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {days.map((day, i) => (
            <div
              key={day.date}
              title={`${day.date} — ${day.active ? '✅' : '❌'}`}
              style={{
                width: '14px', height: '14px',
                borderRadius: '3px',
                background: day.active
                  ? i >= days.length - streak
                    ? `linear-gradient(135deg, #f97316, #dc2626)`
                    : `${C.g600}`
                  : 'var(--border-secondary)',
                transition: 'transform 0.15s',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.5)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = '')}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--border-secondary)' }} />
            {locale === 'ar' ? 'لم يراجع' : 'Missed'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: C.g600 }} />
            {locale === 'ar' ? 'نشط' : 'Active'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'linear-gradient(135deg, #f97316, #dc2626)' }} />
            {locale === 'ar' ? 'سلسلة حالية 🔥' : 'Current streak 🔥'}
          </span>
        </div>
      </Card>
    </div>
  );
}

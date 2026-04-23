// ── Student Dashboard ────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useStudentStore } from '../../stores/studentStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useT, useLocale } from '../../lib/i18n';
import { C } from '../../components/shared/tokens';
import Card, { StatCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function StudentDashboard() {
  const t = useT();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const { currentStreak: streak, fetchDashboard, loading, dashboardData: data } = useStudentStore();
  const { activeSessions, fetchActiveSessions } = useSessionStore();

  useEffect(() => {
    if (user?.id) {
      fetchDashboard(user.id);
      fetchActiveSessions('student', user.id);
    }
  }, [user?.id, fetchDashboard, fetchActiveSessions]);




  if (loading) return <LoadingState />;

  const verse = data?.dailyVerse;
  const stats = data?.stats;
  const nxt = data?.nextSession;

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Live Sessions Alert */}
      {activeSessions.length > 0 && (
        <Card style={{
          marginBottom: '1.5rem',
          background: `linear-gradient(135deg, ${C.gold}, #f59e0b)`,
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          animation: 'pulse 2s infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📡</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {locale === 'ar' ? 'حلقة مباشرة جارية الآن!' : 'Live Session in Progress!'}
              </div>
              <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                {locale === 'ar' ? `مع المعلم ${activeSessions[0].profiles?.name}` : `With teacher ${activeSessions[0].profiles?.name}`}
              </div>
            </div>
          </div>
          <a href={activeSessions[0].meeting_url} target="_blank" rel="noopener noreferrer" style={{
            background: '#fff', color: C.goldD, padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
            fontWeight: 800, textDecoration: 'none', fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {locale === 'ar' ? 'انضم الآن' : 'Join Now'}
          </a>
        </Card>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)',
          fontFamily: "'IBM Plex Sans Arabic', sans-serif", margin: '0 0 0.25rem',
        }}>
          {locale === 'ar' ? `أهلاً ${profile?.full_name || ''} 👋` : `Hello ${profile?.full_name || ''} 👋`}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {locale === 'ar' ? 'واصل رحلتك في حفظ القرآن الكريم' : 'Continue your Quran memorization journey'}
        </p>
      </div>

      {/* Daily Verse */}
      {verse && (
        <Card style={{
          marginBottom: '1.5rem',
          background: `linear-gradient(135deg, ${C.g900}, ${C.g850})`,
          border: `1px solid ${C.gold}20`,
          color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '0.75rem', color: C.gold, fontWeight: 700, marginBottom: '0.65rem', letterSpacing: '0.05em' }}>
              ✦ {t.dailyVerse}
            </div>
            <p style={{
              fontFamily: "'Amiri', serif", fontSize: '1.2rem',
              color: `${C.goldL}`, lineHeight: 2.2, marginBottom: '0.5rem',
            }}>
              {verse.arabic}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                {verse.surah} — {locale === 'ar' ? 'آية' : 'Ayah'} {verse.ayah}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                {verse.translation}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon="📖" label={t.pagesMemorized} value={stats?.pagesMemorized || 0} change={12} color={C.g700} />
        <StatCard icon="⏱️" label={t.hoursThisWeek} value={stats?.hoursThisWeek || 0} change={8} color={C.goldD} />
        <StatCard icon="🎯" label={t.accuracy} value={`${stats?.accuracy || 0}%`} change={3} color="#4338ca" />
        <StatCard icon="🔥" label={t.currentStreak} value={`${streak} ${t.days}`} change={null} color="#dc2626" />
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Streak visual */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              🔥 {t.streak}
            </h3>
            <span style={{
              fontSize: '1.6rem', fontWeight: 900,
              background: 'linear-gradient(135deg, #f97316, #dc2626)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {streak}
            </span>
          </div>
          {/* Mini heatmap - last 7 days */}
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'space-between' }}>
            {Array.from({ length: 7 }, (_, i) => {
              const active = i < (streak % 7 || 7);
              return (
                <div key={i} style={{
                  flex: 1, height: '8px', borderRadius: '4px',
                  background: active ? `linear-gradient(90deg, ${C.gold}, #f97316)` : 'var(--border-secondary)',
                  transition: 'background 0.3s',
                }} />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {t.longestStreak}: <strong>{useStudentStore.getState().longestStreak} {t.days}</strong>
            </span>
          </div>
        </Card>

        {/* Next Session */}
        {nxt && (
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              📅 {t.nextSession}
            </h3>
            <div style={{
              padding: '1rem', borderRadius: '0.75rem',
              background: `${C.g800}08`, border: `1px solid ${C.g800}12`,
              display: 'flex', alignItems: 'center', gap: '0.85rem',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '0.65rem',
                background: `linear-gradient(135deg, ${C.g800}, ${C.g600})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.1rem', flexShrink: 0,
              }}>
                🎓
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {locale === 'ar' ? nxt.teacher : nxt.teacherEn}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {locale === 'ar' ? nxt.day : nxt.dayEn} — {nxt.time}
                </div>
                <div style={{ fontSize: '0.75rem', color: C.gold, fontWeight: 600, marginTop: '0.15rem' }}>
                  {nxt.halqa}
                </div>
              </div>
            </div>
            {nxt.meetingUrl && (
              <a href={nxt.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{
                padding: '0.6rem', fontSize: '0.82rem', width: '100%', textAlign: 'center',
              }}>
                {locale === 'ar' ? 'انضم الآن للحصة' : 'Join Session Now'}
              </a>
            )}
          </Card>
        )}

        {/* AI Personal Assistant */}
        <Card style={{
          background: `linear-gradient(135deg, ${C.g850}, ${C.g900})`,
          border: `1px solid ${C.g600}40`,
          color: '#fff',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Decorative AI Sparkle */}
          <div style={{
            position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', 
            opacity: 0.1, pointerEvents: 'none'
          }}>🤖</div>
          
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✨ {locale === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
          </h3>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', padding: '0.85rem', borderRadius: '0.65rem',
            fontSize: '0.85rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)',
            borderInlineStart: `3px solid ${C.gold}`
          }}>
            {locale === 'ar' 
              ? 'أداءك في سورة البقرة ممتاز! أنصحك بالتركيز على مراجعة الجزء الأخير غداً لتثبيت الحفظ.' 
              : 'Your performance in Surah Al-Baqarah is great! I suggest focusing on reviewing the last part tomorrow.'}
          </div>
          
          <Button variant="outline" size="sm" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', alignSelf: 'flex-start' }}>
            {locale === 'ar' ? 'تحدث مع المساعد' : 'Talk to AI'}
          </Button>
        </Card>
      </div>
    </div>
  );
}


function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="btn-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>جارٍ التحميل...</p>
      </div>
    </div>
  );
}

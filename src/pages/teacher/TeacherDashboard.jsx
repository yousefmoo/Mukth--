// ── Teacher Dashboard ────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTeacherStore } from '../../stores/teacherStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useT, useLocale } from '../../lib/i18n';
import { C } from '../../components/shared/tokens';
import Card, { StatCard } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function TeacherDashboard() {
  const t = useT();
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const { reviewQueue: pendingRecordings, schedule: todaySessions, fetchDashboard, loading } = useTeacherStore();
  const { activeSessions, fetchActiveSessions, startSession, endSession } = useSessionStore();

  useEffect(() => {
    if (user?.id) {
      fetchDashboard(user.id);
      fetchActiveSessions('teacher', user.id);
    }
  }, [user?.id, fetchDashboard, fetchActiveSessions]);

  if (loading || !pendingRecordings) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>{t.loading}</div>;

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'IBM Plex Sans Arabic'", margin: '0 0 0.25rem' }}>
          {locale === 'ar' ? `مرحباً يا شيخ ${profile?.full_name?.split(' ')[1] || profile?.full_name || ''} 🎓` : `Hello ${profile?.full_name?.split(' ')[1] || profile?.full_name || 'Teacher'} 🎓`}
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {locale === 'ar' ? 'إليك نظرة عامة على نشاطك اليوم' : 'Here is your activity overview for today'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon="📋" label={t.pendingReviews} value={pendingRecordings.length} color="#d97706" />
        <StatCard icon="👥" label={t.totalStudents} value={0} color={C.g700} />
        <StatCard icon="📅" label={t.todaysSessions} value={todaySessions.length} color="#4338ca" />
        <StatCard icon="⭐" label={locale === 'ar' ? 'التقييم' : 'Rating'} value={4.9} color={C.goldD} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Pending Recordings */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              📋 {t.pendingReviews}
            </h3>
            <button
              onClick={() => navigate('/teacher/review')}
              style={{
                fontSize: '0.78rem', color: C.gold, fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t.viewAll} ←
            </button>
          </div>

          {pendingRecordings.slice(0, 3).map((rec) => (
            <div key={rec.id} style={{
              padding: '0.75rem', borderRadius: '0.65rem',
              background: 'var(--bg-tertiary)', marginBottom: '0.5rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onClick={() => navigate(`/teacher/review`)}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: `${C.gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', flexShrink: 0,
              }}>
                🎙️
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {rec.profiles?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {rec.surah_name} — {locale === 'ar' ? 'آيات' : 'Ayahs'} {rec.ayah_range}
                </div>
              </div>
              <Badge variant="pending" dot>{locale === 'ar' ? 'معلق' : 'Pending'}</Badge>
            </div>
          ))}
        </Card>

        {/* Today's Schedule */}
        <Card>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1rem' }}>
            📅 {t.todaysSessions}
          </h3>
          {todaySessions.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem' }}>
              {locale === 'ar' ? 'لا توجد حصص اليوم' : 'No sessions today'}
            </p>
          ) : (
            todaySessions.map((s) => {
              const active = activeSessions.find(as => as.halqa_id === s.id);
              return (
                <div key={s.id} style={{
                  padding: '0.85rem', borderRadius: '0.65rem',
                  border: `1.5px solid ${active ? C.gold : 'var(--border-secondary)'}`,
                  background: active ? `${C.gold}08` : 'transparent',
                  marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '0.55rem',
                    background: active ? `linear-gradient(135deg, ${C.gold}, ${C.goldD})` : `linear-gradient(135deg, ${C.g800}, ${C.g600})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0,
                    boxShadow: active ? `0 4px 10px ${C.gold}40` : 'none',
                  }}>
                    {s.time || '00:00'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? s.name : s.name_en}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                       {s.curriculum} — {s.capacity} {locale === 'ar' ? 'طلاب' : 'students'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {!active ? (
                      <Button variant="gold" size="sm" style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }} onClick={() => startSession(s.id, user.id)}>
                        {locale === 'ar' ? 'بدء' : 'Start'}
                      </Button>
                    ) : (
                      <>
                        <a href={active.meeting_url} target="_blank" rel="noopener noreferrer" style={{
                          padding: '0.35rem 0.7rem', borderRadius: '0.5rem', background: C.g800, color: '#fff', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none'
                        }}>
                          {locale === 'ar' ? 'انضم' : 'Join'}
                        </a>
                        <Button variant="danger" size="sm" style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }} onClick={() => endSession(active.id)}>
                          {locale === 'ar' ? 'إنهاء' : 'End'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

        </Card>
      </div>

    </div>
  );
}

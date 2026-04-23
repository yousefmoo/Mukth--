// ── Badges Page — Gamification badges showcase ──────────────────────────────
import { useT, useLocale } from '../../lib/i18n';
import { useStudentStore } from '../../stores/studentStore';
import { BADGES, BADGE_CATEGORIES, TIER_COLORS } from '../../data/badges';
import { getBadgeProgress } from '../../lib/gamification';
import Card from '../../components/ui/Card';

export default function BadgesPage() {
  const t = useT();
  const locale = useLocale();
  const unlockedBadges = useStudentStore((s) => s.unlockedBadges);
  const streak = useStudentStore((s) => s.currentStreak);
  const pages = useStudentStore((s) => s.pagesMemorized);
  const accuracy = useStudentStore((s) => s.accuracy);
  const recordings = useStudentStore((s) => s.recordings);

  const stats = {
    currentStreak: streak,
    pagesMemorized: pages,
    accuracy,
    recordings: recordings.length,
    earlySessions: 2,
    referrals: 0,
  };

  const totalUnlocked = BADGES.filter((b) => unlockedBadges.includes(b.id) || getBadgeProgress(b, stats) >= 100).length;

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'IBM Plex Sans Arabic'", margin: '0 0 0.25rem' }}>
        🏆 {t.badges}
      </h1>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        {locale === 'ar' ? `${totalUnlocked}/${BADGES.length} وسام مفتوح` : `${totalUnlocked}/${BADGES.length} badges unlocked`}
      </p>

      {BADGE_CATEGORIES.map((cat) => {
        const catBadges = BADGES.filter((b) => b.category === cat.id);
        return (
          <div key={cat.id} style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)',
              margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              {cat.icon} {locale === 'ar' ? cat.name : cat.nameEn}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {catBadges.map((badge) => {
                const progress = getBadgeProgress(badge, stats);
                const isUnlocked = unlockedBadges.includes(badge.id) || progress >= 100;
                const tier = TIER_COLORS[badge.tier];

                return (
                  <Card
                    key={badge.id}
                    hover
                    style={{
                      textAlign: 'center',
                      opacity: isUnlocked ? 1 : 0.6,
                      position: 'relative',
                      overflow: 'hidden',
                      border: isUnlocked ? `2px solid ${tier.border}` : undefined,
                    }}
                  >
                    {/* Tier glow */}
                    {isUnlocked && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                        background: `linear-gradient(90deg, transparent, ${tier.border}, transparent)`,
                      }} />
                    )}

                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{badge.icon}</div>
                    <div style={{
                      fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)',
                      marginBottom: '0.25rem',
                    }}>
                      {locale === 'ar' ? badge.name : badge.nameEn}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      {locale === 'ar' ? badge.desc : badge.descEn}
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-secondary)' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        background: isUnlocked ? `linear-gradient(90deg, ${tier.border}, ${tier.text})` : 'var(--text-tertiary)',
                        width: `${Math.min(progress, 100)}%`,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 600, marginTop: '0.35rem',
                      color: isUnlocked ? tier.text : 'var(--text-tertiary)',
                    }}>
                      {isUnlocked ? (locale === 'ar' ? '✨ مفتوح!' : '✨ Unlocked!') : `${progress}%`}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

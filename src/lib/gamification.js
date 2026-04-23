// ── Gamification Engine — Streak & Badge logic ───────────────────────────────
import { BADGES } from '../data/badges.js';

/**
 * Calculate streak from a history object { 'YYYY-MM-DD': true/false/'freeze' }
 */
export function calculateStreak(history) {
  const today = new Date();
  let streak = 0;
  let d = new Date(today);

  while (true) {
    const key = d.toISOString().split('T')[0];
    const val = history[key];
    if (val === true || val === 'freeze') {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Check which badges should be unlocked based on current stats
 */
export function checkBadgeUnlocks(stats) {
  const { currentStreak = 0, pagesMemorized = 0, accuracy = 0, recordings = 0, earlySessions = 0, referrals = 0 } = stats;
  const currentJuz = Math.floor(pagesMemorized / 20);

  const unlocked = [];

  BADGES.forEach((badge) => {
    let shouldUnlock = false;

    switch (badge.type) {
      case 'streak':
        shouldUnlock = currentStreak >= badge.requirement;
        break;
      case 'juz':
        shouldUnlock = currentJuz >= badge.requirement;
        break;
      case 'accuracy':
        shouldUnlock = accuracy >= badge.requirement;
        break;
      case 'recording':
        shouldUnlock = recordings >= badge.requirement;
        break;
      case 'earlySession':
        shouldUnlock = earlySessions >= badge.requirement;
        break;
      case 'referral':
        shouldUnlock = referrals >= badge.requirement;
        break;
    }

    if (shouldUnlock) unlocked.push(badge.id);
  });

  return unlocked;
}

/**
 * Calculate progress toward a specific badge (0-100%)
 */
export function getBadgeProgress(badge, stats) {
  const { currentStreak = 0, pagesMemorized = 0, accuracy = 0, recordings = 0, earlySessions = 0, referrals = 0 } = stats;
  const currentJuz = Math.floor(pagesMemorized / 20);

  let current = 0;
  switch (badge.type) {
    case 'streak': current = currentStreak; break;
    case 'juz': current = currentJuz; break;
    case 'accuracy': current = accuracy; break;
    case 'recording': current = recordings; break;
    case 'earlySession': current = earlySessions; break;
    case 'referral': current = referrals; break;
  }

  return Math.min(100, Math.round((current / badge.requirement) * 100));
}

/**
 * Get streak milestone message if applicable
 */
export function getStreakMilestone(streak) {
  const milestones = [
    { days: 365, msg: '🏆 عام كامل من المواظبة!', msgEn: '🏆 A full year of consistency!' },
    { days: 100, msg: '👑 ١٠٠ يوم متتالي — بارك الله فيك!', msgEn: '👑 100 consecutive days — May Allah bless you!' },
    { days: 30, msg: '💎 شهر كامل من المواظبة!', msgEn: '💎 A full month of consistency!' },
    { days: 7, msg: '🔥 أسبوع كامل — استمر!', msgEn: '🔥 A full week — Keep going!' },
    { days: 3, msg: '✨ ثلاثة أيام متتالية!', msgEn: '✨ Three consecutive days!' },
  ];

  return milestones.find((m) => streak === m.days) || null;
}

// ── Student Store — Progress, Streaks, Recordings, Badges ────────────────────
import { create } from 'zustand';
import { studentApi } from '../lib/supabaseApi';

export const useStudentStore = create((set, get) => ({
  // State
  currentStreak: 0,
  longestStreak: 0,
  streakHistory: {},
  pagesMemorized: 0,
  accuracy: 0,
  recordings: [],
  unlockedBadges: [],
  dashboardData: null,
  loading: false,

  // Actions
  fetchDashboard: async (studentId) => {
    set({ loading: true });
    try {
      const [dashboard, recordings, badges] = await Promise.all([
        studentApi.getDashboard(studentId),
        studentApi.getRecordings(studentId),
        studentApi.getBadges(studentId)
      ]);
      set({
        dashboardData: dashboard,
        recordings,
        unlockedBadges: badges.map(b => b.badge_id),
        currentStreak: dashboard.stats.currentStreak,
        pagesMemorized: dashboard.stats.pagesMemorized,
        accuracy: dashboard.stats.accuracy,
      });
    } finally {
      set({ loading: false });
    }
  },



  fetchRecordings: async (studentId) => {
    const recordings = await studentApi.getRecordings(studentId);
    set({ recordings });
  },

  addRecording: async (recordingData) => {
    const newRec = await studentApi.submitRecording(recordingData);
    set((s) => ({
      recordings: [newRec, ...s.recordings],
    }));
    return newRec;
  },

  updateProgress: (updates) => set(updates),
}));


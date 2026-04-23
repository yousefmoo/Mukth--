// ── Teacher Store — Review Queue, Feedback, Schedule ─────────────────────────
import { create } from 'zustand';
import { teacherApi } from '../lib/supabaseApi';

export const useTeacherStore = create((set, get) => ({
  // State
  reviewQueue: [],
  completedReviews: [],
  feedbackDrafts: {},
  schedule: [],
  students: [],
  loading: false,

  // Actions
  fetchDashboard: async (teacherId) => {
    set({ loading: true });
    try {
      const data = await teacherApi.getDashboard(teacherId);
      set({
        reviewQueue: data.pendingRecordings,
        schedule: data.todaySessions,
      });
    } finally {
      set({ loading: false });
    }
  },

  submitReview: async (recordingId, feedback) => {
    const result = await teacherApi.submitReview(recordingId, feedback);
    set((s) => ({
      reviewQueue: s.reviewQueue.filter((r) => r.id !== recordingId),
      completedReviews: [result, ...s.completedReviews],
    }));
    return result;
  },

  saveFeedbackDraft: (recordingId, draft) =>
    set((s) => ({
      feedbackDrafts: { ...s.feedbackDrafts, [recordingId]: draft },
    })),

  clearFeedbackDraft: (recordingId) =>
    set((s) => {
      const drafts = { ...s.feedbackDrafts };
      delete drafts[recordingId];
      return { feedbackDrafts: drafts };
    }),
}));


import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAgentStore = create((set, get) => ({
  insights: null,
  isAnalyzing: false,

  // AI Agent: Analyze Recitation (Pre-Teacher Review)
  analyzeRecitation: async (recordingId, surahName, ayahRange) => {
    set({ isAnalyzing: true });
    try {
      // 1. Invoke AI Edge Function
      const { data, error } = await supabase.functions.invoke('ai-tajweed-advisor', {
        body: { recordingId, surahName, ayahRange }
      });

      if (error) throw error;

      // 2. Update recording with AI insights
      await supabase
        .from('recordings')
        .update({ 
          ai_feedback: data.feedback,
          ai_score: data.score 
        })
        .eq('id', recordingId);

      set({ insights: data.feedback });
      return data;
    } finally {
      set({ isAnalyzing: false });
    }
  },

  // AI Agent: Get Personalized Study Plan
  getStudyAdvice: async (studentId) => {
    const { data, error } = await supabase.functions.invoke('ai-study-planner', {
      body: { studentId }
    });
    return data?.advice || 'واصل الحفظ والمراجعة يومياً لتحقيق أهدافك.';
  }
}));

import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useSessionStore = create((set, get) => ({
  activeSessions: [],
  loading: false,

  fetchActiveSessions: async (role, userId) => {
    set({ loading: true });
    let query = supabase
      .from('sessions')
      .select('*, halaqat(*), profiles:teacher_id(*)')
      .eq('status', 'active');

    if (role === 'student') {
      // Students only see sessions for halaqat they are enrolled in
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('halqa_id')
        .eq('student_id', userId);
      
      const hIds = enrollments?.map(e => e.halqa_id) || [];
      if (hIds.length === 0) {
        set({ activeSessions: [], loading: false });
        return;
      }
      query = query.in('halqa_id', hIds);
    } else if (role === 'teacher') {
      query = query.eq('teacher_id', userId);
    }

    const { data, error } = await query;
    if (!error) set({ activeSessions: data });
    set({ loading: false });
  },

  startSession: async (halqaId, teacherId) => {
    set({ loading: true });
    try {
      // 1. Call Edge Function to get Google Meet link
      // For now, we simulate or use a placeholder if the edge function isn't deployed
      const { data: meetData, error: meetError } = await supabase.functions.invoke('create-meeting', {
        body: { halqaId }
      });

      const meetingUrl = meetData?.url || `https://meet.google.com/muk-${Math.random().toString(36).substring(7)}`;

      // 2. Create session in DB
      const { data: session, error } = await supabase
        .from('sessions')
        .insert([{
          halqa_id: halqaId,
          teacher_id: teacherId,
          meeting_url: meetingUrl,
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;
      set((s) => ({ activeSessions: [...s.activeSessions, session] }));
      return session;
    } finally {
      set({ loading: false });
    }
  },

  endSession: async (sessionId) => {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'finished', end_time: new Date().toISOString() })
      .eq('id', sessionId);

    if (!error) {
      set((s) => ({ activeSessions: s.activeSessions.filter(as => as.id !== sessionId) }));
    }
  }
}));

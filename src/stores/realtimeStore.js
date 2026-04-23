import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

import { useNotificationStore } from '../stores/notificationStore';
import { useStudentStore } from '../stores/studentStore';
import { useTeacherStore } from '../stores/teacherStore';

export const useRealtimeStore = create((set, get) => ({
  subscriptions: {},

  init: (userId, role) => {
    const notify = useNotificationStore.getState();
    const studentStore = useStudentStore.getState();
    const teacherStore = useTeacherStore.getState();

    // 1. Subscribe to new feedback (for students)
    if (role === 'student') {
      const feedbackSub = supabase
        .channel('public:feedback')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'feedback' 
        }, async (payload) => {
          // Check if this feedback belongs to the student's recordings
          const { data } = await supabase
            .from('recordings')
            .select('student_id')
            .eq('id', payload.new.recording_id)
            .single();

          if (data?.student_id === userId) {
            notify.success('ملاحظات جديدة', 'لقد قام المعلم بمراجعة تسجيلك');
            studentStore.fetchDashboard(userId);
            studentStore.fetchRecordings(userId);
          }
        })
        .subscribe();
      
      set((s) => ({ subscriptions: { ...s.subscriptions, feedback: feedbackSub } }));
    }

    // 2. Subscribe to new recordings (for teachers)
    if (role === 'teacher') {
      const recordingsSub = supabase
        .channel('public:recordings')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'recordings' 
        }, (payload) => {
          notify.info('تسجيل جديد', 'تم استلام تسجيل جديد للمراجعة');
          teacherStore.fetchDashboard(userId);
        })
        .subscribe();

      set((s) => ({ subscriptions: { ...s.subscriptions, recordings: recordingsSub } }));
    }

    // 3. Subscribe to new registrations (for admins)
    if (role === 'admin') {
      const profilesSub = supabase
        .channel('public:profiles')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'profiles' 
        }, (payload) => {
          notify.success(
            'مستخدم جديد انضم!', 
            `تم تسجيل ${payload.new.full_name} في المنصة.`
          );
          // If we are on the user management page, we could refresh the list
          // But usually we'd use a dedicated adminStore for this.
          // For now, the toast is enough.
        })
        .subscribe();

      set((s) => ({ subscriptions: { ...s.subscriptions, profiles: profilesSub } }));
    }
  },

  cleanup: () => {
    const { subscriptions } = get();
    Object.values(subscriptions).forEach((sub) => sub.unsubscribe());
    set({ subscriptions: {} });
  }
}));

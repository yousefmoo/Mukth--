import { supabase } from './supabaseClient';
import { DAILY_VERSES } from '../data/quranData';

// Helper to handle responses
const handleResponse = async (promise) => {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
};

export const studentApi = {
  getDashboard: async (studentId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        streaks (*),
        enrollments (
          halaqat (
            *,
            profiles:teacher_id (*)
          )
        )
      `)
      .eq('id', studentId)
      .single();
      
    if (error) throw error;

    const verse = DAILY_VERSES[new Date().getDate() % DAILY_VERSES.length];

    const nextSessionRaw = data.enrollments?.[0]?.halaqat;
    let nextSession = null;
    
    if (nextSessionRaw) {
      nextSession = {
        teacher: nextSessionRaw.profiles?.name,
        teacherEn: nextSessionRaw.profiles?.name_en || nextSessionRaw.profiles?.name,
        halqa: nextSessionRaw.name,
        halqaEn: nextSessionRaw.name_en,
        time: nextSessionRaw.schedule?.[0]?.time,
        day: nextSessionRaw.schedule?.[0]?.day,
        dayEn: nextSessionRaw.schedule?.[0]?.day, // Add translation logic if needed
        meetingUrl: nextSessionRaw.meeting_url
      };
    }

    // Map to the expected shape
    return {
      student: data,
      dailyVerse: verse,
      stats: {
        pagesMemorized: data.pages_memorized || 0,
        hoursThisWeek: data.hours_this_week || 0,
        accuracy: data.accuracy || 0,
        currentStreak: data.streaks?.current_streak || 0,
      },
      nextSession
    };
  },



  getRecordings: async (studentId) => {
    return handleResponse(
      supabase
        .from('recordings')
        .select('*, feedback(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
    );
  },

  getBadges: async (studentId) => {
    return handleResponse(
      supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', studentId)
    );
  },

  submitRecording: async (recording) => {
    return handleResponse(
      supabase
        .from('recordings')
        .insert([recording])
        .select()
        .single()
    );
  },

  getSessions: async (studentId) => {
    const { data, error } = await supabase
      .from('halaqa_students')
      .select(`
        halaqat (
          *,
          sessions (*),
          profiles:teacher_id (full_name)
        )
      `)
      .eq('student_id', studentId);
    
    if (error) throw error;
    
    // Flatten the nested data to match UI expectations
    return data.flatMap(item => 
      (item.halaqat?.sessions || []).map(session => ({
        ...session,
        halqa_name: item.halaqat.name,
        teacher_name: item.halaqat.profiles?.full_name,
        curriculum: item.halaqat.curriculum
      }))
    );
  },

  getProgress: async (studentId) => {
    // For a real production app, we would calculate this from confirmed recordings
    // or a dedicated 'memorization_logs' table.
    // For now, we fetch the student's stats from 'profiles'
    const { data, error } = await supabase
      .from('profiles')
      .select('pages_memorized, total_juz_memorized')
      .eq('id', studentId)
      .single();
    
    if (error) throw error;

    // Build a progress structure for the 30 Juz
    const totalJuz = data.total_juz_memorized || 0;
    const juzProgress = Array.from({ length: 30 }, (_, i) => {
      const juzNum = 30 - i; // Common to show Juz 30 first
      let status = 'locked';
      let pct = 0;
      
      if (juzNum <= totalJuz) {
        status = 'completed';
        pct = 100;
      } else if (juzNum === totalJuz + 1) {
        status = 'inProgress';
        pct = 25; // Placeholder
      }
      
      return { juz: juzNum, pct, status };
    });

    return {
      totalPages: data.pages_memorized || 0,
      juzProgress
    };
  }
};

export const teacherApi = {
  getDashboard: async (teacherId) => {
    const [stats, queue, sessions] = await Promise.all([
      supabase.rpc('get_teacher_stats', { t_id: teacherId }), // You'd need to define this RPC or use multiple queries
      supabase.from('recordings').select('*, profiles:student_id(*)').eq('status', 'pending'),
      supabase.from('halaqat').select('*').eq('teacher_id', teacherId)
    ]);

    return {
      stats: stats.data || { pendingReviews: 0, totalStudents: 0, todaysSessions: 0, avgRating: 0 },
      pendingRecordings: queue.data || [],
      todaySessions: sessions.data || [],
    };
  },

  getStudents: async (teacherId) => {
    const { data: halaqat } = await supabase.from('halaqat').select('id').eq('teacher_id', teacherId);
    const hIds = halaqat?.map(h => h.id) || [];
    
    if (hIds.length === 0) return [];

    const { data: students, error: sError } = await supabase
      .from('enrollments')
      .select(`
        profiles:student_id (
          *,
          streaks (current_streak)
        )
      `)
      .in('halqa_id', hIds);

    if (sError) throw sError;

    return students.map(s => ({
      ...s.profiles,
      streak: s.profiles.streaks?.current_streak || 0
    }));
  },

  getSchedule: async (teacherId) => {
    return handleResponse(
      supabase
        .from('sessions')
        .select(`
          *,
          halaqat!inner(*)
        `)
        .eq('halaqat.teacher_id', teacherId)
    );
  },

  submitReview: async (recordingId, feedback) => {
    const { data, error } = await supabase
      .from('feedback')
      .insert([{ recording_id: recordingId, ...feedback }])
      .select()
      .single();
      
    if (error) throw error;
    
    // Update recording status
    await supabase
      .from('recordings')
      .update({ status: 'reviewed' })
      .eq('id', recordingId);
      
    return data;
  },
};

export const adminApi = {
  getUsers: async (filters = {}) => {
    let query = supabase.from('profiles').select('*');
    if (filters.role) query = query.eq('role', filters.role);
    return handleResponse(query);
  },
  
  createUser: async (user) => {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password || '123456',
      options: {
        data: {
          full_name: user.name,
          role: user.role,
          phone_number: user.phone
        }
      }
    });
    if (error) throw error;
    return data;
  },

  getDashboard: async () => {
    const [profiles, halaqat, recent] = await Promise.all([
      supabase.from('profiles').select('role'),
      supabase.from('halaqat').select('id'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    const users = profiles.data || [];
    const stats = {
      totalUsers: users.length,
      activeStudents: users.filter(u => u.role === 'student').length,
      activeTeachers: users.filter(u => u.role === 'teacher').length,
      totalHalaqat: (halaqat.data || []).length,
      monthlyGrowth: [],
      curriculumDistribution: [],
      recentActivity: (recent.data || []).map(u => ({
        type: 'registration',
        text: `مستخدم جديد: ${u.full_name}`,
        textEn: `New user: ${u.full_name}`,
        time: 'Just now',
        timeEn: 'Just now'
      }))
    };

    return stats;
  },

  updateUserRole: async (userId, role) => {
    return handleResponse(
      supabase.from('profiles').update({ role }).eq('id', userId)
    );
  },

  deleteUser: async (userId) => {
    return handleResponse(supabase.from('profiles').delete().eq('id', userId));
  },

  getHalaqat: async () => {
    return handleResponse(
      supabase
        .from('halaqat')
        .select(`
          *,
          profiles:teacher_id (full_name)
        `)
    );
  },

  createHalqa: async (halqa) => {
    return handleResponse(
      supabase.from('halaqat').insert([halqa]).select().single()
    );
  },

  deleteHalqa: async (id) => {
    return handleResponse(supabase.from('halaqat').delete().eq('id', id));
  }
};


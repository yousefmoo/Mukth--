// ── Auth Store — Zustand with Supabase ─────────────────────────────────────────
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  role: null,
  session: null,
  loading: true,

  setSession: async (session) => {
    if (!session) {
      set({ session: null, user: null, profile: null, role: null, loading: false });
      return;
    }

    const user = session.user;
    set({ session, user, loading: true });

    // 1. Hardcode Super Admin check
    if (user.email === 'mukthquran114@gmail.com') {
      set({ 
        role: 'admin', 
        profile: { 
          full_name: 'Super Admin', 
          role: 'admin',
          is_approved: true
        }, 
        loading: false 
      });
      return;
    }

    // 2. Otherwise, fetch full profile from profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        set({ 
          profile: { ...data, full_name: data.name }, 
          role: data.role, 
          is_approved: data.role === 'teacher' ? data.is_approved : true, // Only teachers need approval
          loading: false 
        });
      } else {
        // Fallback to metadata if profile doesn't exist yet
        const fallbackRole = user.user_metadata?.role || 'student';
        set({ 
          profile: { 
            full_name: user.user_metadata?.full_name || '', 
            role: fallbackRole,
            is_approved: true 
          }, 
          role: fallbackRole, 
          is_approved: true,
          loading: false 
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      set({ role: 'student', is_approved: true, loading: false });
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Note: setSession will be called by the onAuthStateChange listener in App.jsx
    return data;
  },

  register: async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: metadata,
        // Ensure email redirect is set if needed, but here we focus on data
      },
    });
    if (error) throw error;
    return data;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, session: null, loading: false });
  },

  updateProfile: async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    if (error) throw error;
    set((state) => ({
      user: { ...state.user, ...data.user },
    }));
  },
}));


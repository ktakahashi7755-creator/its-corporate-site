import { create } from 'zustand';
import { Family, FamilyMember, Child } from '../types';
import { supabase } from '../lib/supabase';

interface FamilyState {
  family: Family | null;
  members: FamilyMember[];
  children: Child[];
  loading: boolean;
  error: string | null;

  fetchFamily: (userId: string) => Promise<void>;
  addChild: (child: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateChild: (id: string, updates: Partial<Child>) => Promise<void>;
  setFamily: (family: Family | null) => void;
  reset: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  family: null,
  members: [],
  children: [],
  loading: false,
  error: null,

  fetchFamily: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      // Get family membership
      const { data: membership, error: memberErr } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .single();

      if (memberErr || !membership) {
        set({ loading: false, family: null });
        return;
      }

      const familyId = membership.family_id;

      // Fetch family, members, children in parallel
      const [familyRes, membersRes, childrenRes] = await Promise.all([
        supabase.from('families').select('*').eq('id', familyId).single(),
        supabase.from('family_members').select('*').eq('family_id', familyId),
        supabase.from('children').select('*').eq('family_id', familyId).order('birth_date'),
      ]);

      set({
        family: familyRes.data,
        members: membersRes.data ?? [],
        children: childrenRes.data ?? [],
        loading: false,
      });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },

  addChild: async (childData) => {
    const { data, error } = await supabase
      .from('children')
      .insert(childData)
      .select()
      .single();

    if (!error && data) {
      set((s) => ({ children: [...s.children, data] }));
    }
  },

  updateChild: async (id, updates) => {
    const { data, error } = await supabase
      .from('children')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      set((s) => ({
        children: s.children.map((c) => (c.id === id ? data : c)),
      }));
    }
  },

  setFamily: (family) => set({ family }),

  reset: () =>
    set({ family: null, members: [], children: [], loading: false, error: null }),
}));

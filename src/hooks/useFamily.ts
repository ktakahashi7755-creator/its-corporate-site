import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Family, FamilyMember, Child } from '../types';

export function useFamily(userId: string | undefined) {
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFamily = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    const { data: memberData } = await supabase
      .from('family_members')
      .select('*, families(*)')
      .eq('user_id', userId)
      .single();

    if (!memberData) { setLoading(false); return; }

    const fam = memberData.families as Family;
    setFamily(fam);

    const { data: membersData } = await supabase
      .from('family_members')
      .select('*, users(*)')
      .eq('family_id', fam.id);

    setMembers((membersData ?? []) as FamilyMember[]);

    const { data: childrenData } = await supabase
      .from('children')
      .select('*, institutions(*)')
      .eq('family_id', fam.id)
      .order('birth_date');

    setChildren((childrenData ?? []) as Child[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  const createFamily = async (name: string) => {
    if (!userId) return;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: fam, error } = await supabase
      .from('families')
      .insert({ name, invite_code: inviteCode })
      .select()
      .single();
    if (error) throw error;

    await supabase.from('family_members').insert({
      family_id: fam.id,
      user_id: userId,
      role: 'owner',
    });

    setFamily(fam);
    return fam as Family;
  };

  const joinFamily = async (inviteCode: string) => {
    if (!userId) return;
    const { data: fam, error } = await supabase
      .from('families')
      .select()
      .eq('invite_code', inviteCode.toUpperCase())
      .single();
    if (error || !fam) throw new Error('招待コードが見つかりません');

    await supabase.from('family_members').insert({
      family_id: fam.id,
      user_id: userId,
      role: 'member',
    });

    setFamily(fam as Family);
    return fam as Family;
  };

  const addChild = async (child: Omit<Child, 'id' | 'family_id'>) => {
    if (!family) return;
    const { data, error } = await supabase
      .from('children')
      .insert({ ...child, family_id: family.id })
      .select()
      .single();
    if (error) throw error;
    setChildren(prev => [...prev, data as Child]);
    return data as Child;
  };

  return { family, members, children, loading, createFamily, joinFamily, addChild, refetch: fetchFamily };
}

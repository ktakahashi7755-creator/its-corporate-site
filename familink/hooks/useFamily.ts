import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useFamilyStore } from '../store/familyStore';

export function useFamily() {
  const user = useAuthStore((s) => s.user);
  const { family, members, children, loading, fetchFamily } = useFamilyStore();

  useEffect(() => {
    if (user?.id) {
      fetchFamily(user.id);
    }
  }, [user?.id]);

  return { family, members, children, loading, hasFamily: !!family };
}

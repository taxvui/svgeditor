import { useEffect, useState } from 'react';

export interface AdminProfile { id: string; email: string; display_name: string; role: string }
export const sessionChanged = () => window.dispatchEvent(new Event('admin-session-changed'));

export function useAdminSession() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = response.ok ? await response.json() : null;
        if (active) setProfile(data?.authenticated ? data.profile : null);
      } catch { if (active) setProfile(null); }
      finally { if (active) setLoading(false); }
    };
    void refresh();
    window.addEventListener('admin-session-changed', refresh);
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('admin-session-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return { profile, loading };
}

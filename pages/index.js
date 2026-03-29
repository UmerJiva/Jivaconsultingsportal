import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchUser, getDashboardPath } from '../lib/auth';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    fetchUser().then(u => {
      router.replace(u ? getDashboardPath(u.role) : '/login');
    });
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}

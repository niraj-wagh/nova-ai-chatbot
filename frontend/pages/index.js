import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../utils/authStore';

export default function Home() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;
    if (user) {
      router.replace('/chat');
    } else {
      router.replace('/login');
    }
  }, [user, isInitialized, router]);

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl animate-pulse"
          style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-accent)' }}>
          ✦
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading Nova AI...</p>
      </div>
    </div>
  );
}

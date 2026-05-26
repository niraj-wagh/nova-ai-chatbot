import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '../utils/authStore';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const { initialize, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  // Apply theme from user preferences
  useEffect(() => {
    const theme = user?.preferences?.theme || 'dark';
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    }
  }, [user?.preferences?.theme]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          duration: 3000,
        }}
      />
    </>
  );
}

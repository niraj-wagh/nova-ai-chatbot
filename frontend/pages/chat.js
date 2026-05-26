import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import useAuthStore from '../utils/authStore';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [currentConvId, setCurrentConvId] = useState(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/login');
    }
  }, [user, isInitialized]);

  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl animate-pulse"
            style={{ background: 'var(--accent)', color: 'white' }}>✦</div>
        </div>
      </div>
    );
  }

  const handleNewChat = () => {
    setCurrentConvId(null);
  };

  const handleSelectConversation = (id) => {
    setCurrentConvId(id);
  };

  const handleConversationCreated = (id) => {
    setCurrentConvId(id);
    setSidebarRefresh((p) => p + 1);
  };

  return (
    <>
      <Head>
        <title>{user?.preferences?.chatbotName || 'Nova AI'} — Chat</title>
      </Head>

      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        {/* Mobile sidebar toggle */}
        <button
          className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center"
          onClick={() => setSidebarOpen((p) => !p)}
          style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>
          ☰
        </button>

        {/* Sidebar */}
        <div className={`
          fixed lg:relative z-40 h-full transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar
            currentConvId={currentConvId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            refreshTrigger={sidebarRefresh}
          />
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main chat area */}
        <div className="flex-1 min-w-0">
          <ChatWindow
            key={currentConvId || 'new'}
            conversationId={currentConvId}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>
    </>
  );
}

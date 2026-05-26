import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { chatAPI } from '../utils/api';
import useAuthStore from '../utils/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar({ currentConvId, onSelectConversation, onNewChat, refreshTrigger }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [refreshTrigger]);

  const loadConversations = async () => {
    try {
      const data = await chatAPI.getConversations({ limit: 50 });
      setConversations(data.conversations || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    try {
      const data = await chatAPI.search(q);
      setSearchResults(data.results || []);
    } catch { setSearchResults([]); }
  };

  const handleDeleteConv = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await chatAPI.deleteConversation(id);
      setConversations((p) => p.filter((c) => c._id !== id));
      if (currentConvId === id) onNewChat();
      toast.success('Conversation deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.success('Signed out');
  };

  const displayConvs = searchResults || conversations;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-3 h-full" style={{ width: 60, borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <button onClick={() => setCollapsed(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-lg hover:opacity-80 transition-opacity"
          style={{ background: 'var(--accent)', color: 'white' }} title="Expand sidebar">☰</button>
        <button onClick={onNewChat} className="w-9 h-9 rounded-xl flex items-center justify-center text-lg btn-ghost" title="New chat">✏️</button>
        <div className="flex-1" />
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ background: 'var(--accent)', color: 'white' }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ width: 260, minWidth: 260, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
            style={{ background: 'var(--accent)', color: 'white' }}>✦</div>
          <span className="font-semibold text-base" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {user?.preferences?.chatbotName || 'Nova AI'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onNewChat} className="w-8 h-8 rounded-lg flex items-center justify-center text-base btn-ghost" title="New chat">✏️</button>
          <button onClick={() => setCollapsed(true)} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs btn-ghost" title="Collapse">◀</button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ borderRadius: 10 }}
          />
        </div>
      </div>

      {/* New Chat button */}
      <div className="px-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', border: '1px solid rgba(108,99,255,0.2)' }}>
          <span>+</span> New Conversation
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {searchQuery && (
          <p className="text-xs mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            {searchResults?.length || 0} results
          </p>
        )}

        {loading ? (
          <div className="flex flex-col gap-2 mt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--bg-hover)' }} />
            ))}
          </div>
        ) : displayConvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-3xl mb-2">💬</span>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {searchQuery ? 'No results found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {displayConvs.map((conv) => (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`sidebar-item group ${currentConvId === conv._id ? 'active' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: currentConvId === conv._id ? 'var(--accent-light)' : 'var(--text-primary)' }}>
                    {conv.title || 'New Conversation'}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {conv.stats?.totalMessages || 0} msgs ·{' '}
                    {conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : ''}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteConv(e, conv._id)}
                  className="opacity-0 group-hover:opacity-100 text-xs w-6 h-6 rounded flex items-center justify-center transition-all"
                  style={{ color: 'var(--error)', background: 'rgba(239,68,68,0.1)', flexShrink: 0 }}
                  title="Delete">
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl group cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
          onClick={() => router.push('/settings')}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ background: 'var(--accent)', color: 'white' }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className="opacity-0 group-hover:opacity-100 text-xs w-7 h-7 rounded flex items-center justify-center transition-all"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-hover)' }}
            title="Sign out">
            ↪
          </button>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => router.push('/admin')}
            className="w-full mt-2 btn-ghost text-xs py-1.5 flex items-center justify-center gap-1">
            ⚙ Admin Panel
          </button>
        )}
      </div>
    </div>
  );
}

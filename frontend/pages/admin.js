import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import useAuthStore from '../utils/authStore';
import { adminAPI } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isInitialized && (!user || user.role !== 'admin')) {
      router.replace('/chat');
    }
  }, [user, isInitialized]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([adminAPI.getStats(), adminAPI.getUsers()]);
      setStats(statsData.stats);
      setUsers(usersData.users);
    } catch (err) {
      toast.error('Failed to load admin data');
    }
    setLoading(false);
  };

  const handleToggleUser = async (userId) => {
    try {
      const data = await adminAPI.toggleUser(userId);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: data.user.isActive } : u));
      toast.success(`User ${data.user.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update user'); }
  };

  const handleChangeRole = async (userId, role) => {
    try {
      const data = await adminAPI.changeRole(userId, role);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: data.user.role } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to change role'); }
  };

  if (!user || user.role !== 'admin') return null;

  const STAT_CARDS = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#6c63ff' },
    { label: 'Total Conversations', value: stats.totalConversations, icon: '💬', color: '#10b981' },
    { label: 'Total Messages', value: stats.totalMessages, icon: '📨', color: '#f59e0b' },
    { label: 'Active Today', value: stats.activeToday, icon: '🟢', color: '#06b6d4' },
  ] : [];

  return (
    <>
      <Head><title>Admin Panel — Nova AI</title></Head>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/chat')} className="btn-ghost flex items-center gap-2">← Chat</button>
            <span style={{ color: 'var(--border)' }}>|</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙</span>
              <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Admin Panel</h1>
            </div>
          </div>
          <button onClick={loadData} className="btn-ghost text-sm">🔄 Refresh</button>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {['overview', 'users'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all"
                style={{
                  background: activeTab === tab ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${activeTab === tab ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                }}>
                {tab === 'overview' ? '📊 Overview' : '👥 Users'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl animate-pulse"
                  style={{ background: 'var(--accent)', color: 'white' }}>✦</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading data...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="page-enter">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {STAT_CARDS.map((card) => (
                      <div key={card.label} className="p-5 rounded-2xl"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl">{card.icon}</span>
                          <div className="w-8 h-8 rounded-xl" style={{ background: card.color + '20' }} />
                        </div>
                        <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{card.value?.toLocaleString()}</p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent users */}
                  <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Users</h3>
                    <div className="flex flex-col gap-3">
                      {stats?.recentUsers?.map((u) => (
                        <div key={u._id} className="flex items-center justify-between py-2"
                          style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                              style={{ background: 'var(--accent)', color: 'white' }}>
                              {u.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs px-2 py-1 rounded-full capitalize"
                              style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)' }}>{u.role}</span>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="page-enter">
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                          {['User', 'Email', 'Role', 'Status', 'Messages', 'Joined', 'Actions'].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                              style={{ color: 'var(--text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <tr key={u._id} style={{
                            background: i % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                            borderBottom: '1px solid var(--border-subtle)',
                          }}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                                  style={{ background: 'var(--accent)', color: 'white' }}>
                                  {u.username[0].toUpperCase()}
                                </div>
                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.username}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                            <td className="px-4 py-3">
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeRole(u._id, e.target.value)}
                                className="text-xs px-2 py-1 rounded-lg"
                                style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 rounded-full"
                                style={{
                                  background: u.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                  color: u.isActive ? '#10b981' : '#ef4444',
                                }}>
                                {u.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {u.stats?.totalMessages || 0}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleToggleUser(u._id)}
                                className="text-xs px-3 py-1 rounded-lg transition-all"
                                style={{
                                  background: u.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                  color: u.isActive ? '#ef4444' : '#10b981',
                                  border: 'none', cursor: 'pointer',
                                }}>
                                {u.isActive ? 'Disable' : 'Enable'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

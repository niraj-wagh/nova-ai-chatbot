import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import useAuthStore from '../utils/authStore';
import { authAPI } from '../utils/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, updatePreferences, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('appearance');
  const [prefs, setPrefs] = useState(user?.preferences || {});
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleSavePrefs = async () => {
    setSaving(true);
    const result = await updatePreferences(prefs);
    setSaving(false);
    if (result.success) toast.success('Preferences saved!');
    else toast.error(result.message);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error("Passwords don't match");
    if (pwForm.newPassword.length < 6) return toast.error('New password too short');
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const TABS = [
    { id: 'appearance', label: '🎨 Appearance' },
    { id: 'ai', label: '🧠 AI Settings' },
    { id: 'security', label: '🔒 Security' },
    { id: 'account', label: '👤 Account' },
  ];

  return (
    <>
      <Head><title>Settings — Nova AI</title></Head>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/chat')} className="btn-ghost flex items-center gap-2">
              ← Back to Chat
            </button>
            <span style={{ color: 'var(--border)' }}>|</span>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'white' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{user?.username}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* Tabs */}
            <div className="flex flex-col gap-1 w-44 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`sidebar-item ${activeTab === tab.id ? 'active' : ''} text-sm justify-start`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 page-enter" key={activeTab}>
              {/* Appearance */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
                  <div className="flex flex-col gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Theme</label>
                      <div className="flex gap-3">
                        {['dark', 'light', 'system'].map((t) => (
                          <button key={t} onClick={() => setPrefs((p) => ({ ...p, theme: t }))}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all"
                            style={{
                              background: prefs.theme === t ? 'var(--accent)' : 'var(--bg-secondary)',
                              color: prefs.theme === t ? 'white' : 'var(--text-secondary)',
                              border: `1px solid ${prefs.theme === t ? 'var(--accent)' : 'var(--border)'}`,
                              cursor: 'pointer',
                            }}>
                            {t === 'dark' ? '🌙 Dark' : t === 'light' ? '☀️ Light' : '💻 System'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Font Size</label>
                      <div className="flex gap-3">
                        {[{ id: 'sm', label: 'Small' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Large' }].map((s) => (
                          <button key={s.id} onClick={() => setPrefs((p) => ({ ...p, fontSize: s.id }))}
                            className="px-5 py-2.5 rounded-xl text-sm transition-all"
                            style={{
                              background: prefs.fontSize === s.id ? 'var(--accent)' : 'var(--bg-secondary)',
                              color: prefs.fontSize === s.id ? 'white' : 'var(--text-secondary)',
                              border: `1px solid ${prefs.fontSize === s.id ? 'var(--accent)' : 'var(--border)'}`,
                              cursor: 'pointer',
                            }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Settings */}
              {activeTab === 'ai' && (
                <div>
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>AI Settings</h2>
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Assistant Name
                      </label>
                      <input
                        className="input-field max-w-sm"
                        value={prefs.chatbotName || 'Nova AI'}
                        onChange={(e) => setPrefs((p) => ({ ...p, chatbotName: e.target.value }))}
                        placeholder="Nova AI"
                      />
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                        This name will be shown in the chat interface.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        AI Model
                      </label>
                      <select
                        className="input-field max-w-sm"
                        value={prefs.aiModel || 'claude-sonnet-4-20250514'}
                        onChange={(e) => setPrefs((p) => ({ ...p, aiModel: e.target.value }))}>
                        <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
                        <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast)</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Chat Category Default
                      </label>
                      <select
                        className="input-field max-w-sm"
                        value={prefs.defaultCategory || 'general'}
                        onChange={(e) => setPrefs((p) => ({ ...p, defaultCategory: e.target.value }))}>
                        {['general', 'casual', 'professional', 'creative', 'technical'].map((c) => (
                          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
                  <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-sm">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
                      <input className="input-field" type="password" placeholder="Current password"
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                      <input className="input-field" type="password" placeholder="New password (6+ chars)"
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
                      <input className="input-field" type="password" placeholder="Repeat new password"
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))} required />
                    </div>
                    <button type="submit" className="btn-primary w-fit" disabled={saving}>
                      {saving ? 'Saving...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* Account */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Account Info</h2>
                  <div className="flex flex-col gap-4 max-w-md">
                    <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-semibold"
                          style={{ background: 'var(--accent)', color: 'white' }}>
                          {user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block capitalize"
                            style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', border: '1px solid rgba(108,99,255,0.2)' }}>
                            {user?.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <div className="text-center">
                          <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.stats?.totalConversations || 0}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Conversations</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.stats?.totalMessages || 0}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Messages</p>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => { logout(); router.push('/login'); }}
                      className="btn-ghost text-left px-4 py-3 flex items-center gap-2"
                      style={{ color: 'var(--error)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 12 }}>
                      ↪ Sign Out
                    </button>
                  </div>
                </div>
              )}

              {/* Save button (not for security tab) */}
              {activeTab !== 'security' && activeTab !== 'account' && (
                <div className="mt-8">
                  <button onClick={handleSavePrefs} className="btn-primary px-8" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and app preferences.</p>
      </div>

      <div className="glass rounded-2xl p-8 mb-6">
        <h2 className="text-xl font-semibold text-white mb-6">Profile</h2>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-3xl text-white font-bold">
              {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-lg font-medium text-white">{user?.full_name || 'No name set'}</p>
              <p className="text-slate-400">{user?.email}</p>
              {!user?.is_verified && (
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full border border-yellow-500/20">
                  Unverified Email
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Preferences</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">LLM Engine</label>
            <select className="w-full max-w-sm px-4 py-2 rounded-xl bg-surface border border-surface-border text-white outline-none focus:border-brand-500">
              <option value="openai">OpenAI GPT-4o (Default)</option>
              <option value="gemini" disabled>Google Gemini 1.5 Pro (Coming soon)</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">Change the AI model used to generate SQL.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

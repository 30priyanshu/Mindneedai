import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings, Eye, Volume2, Zap, Shield, Trash2,
  Info, EyeOff, AlertTriangle, Keyboard,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileApi } from '../service';
import { historyApi } from '@/features/history/service';
import { EmergencyContactsSection } from '@/features/emergency/components/EmergencyContactsSection';

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  color = 'text-green-500',
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-neutral-400">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-green-500' : 'bg-neutral-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage(): React.ReactElement {
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreference } = usePreferences();
  const { addToast } = useToast();
  const { role } = useAuth();
  const qc = useQueryClient();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ current_password, new_password }: PasswordValues) =>
      userProfileApi.changePassword(current_password, new_password),
    onSuccess: () => {
      reset();
      addToast({ type: 'success', message: 'Password changed successfully!' });
    },
    onError: () => addToast({ type: 'error', message: 'Failed to change password. Check your current password.' }),
  });

  const clearHistoryMutation = useMutation({
    mutationFn: historyApi.clearHistory,
    onSuccess: (result) => {
      setDeleteModalOpen(false);
      void qc.invalidateQueries({ queryKey: ['history'] });
      void qc.invalidateQueries({ queryKey: ['user-profile-stats'] });
      addToast({ type: 'success', message: `History cleared. ${result.deleted} analyses deleted.` });
    },
    onError: () => addToast({ type: 'error', message: 'Failed to clear history.' }),
  });

  const handlePrefChange = async <K extends keyof typeof preferences>(
    key: K,
    value: (typeof preferences)[K]
  ) => {
    await updatePreference(key, value);
    addToast({ type: 'success', message: 'Setting updated.', duration: 1500 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-green-500" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Customize your experience</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
        <SectionHeader icon={Eye} title="Appearance" subtitle="Customize the look and feel" />
        <div>
          <p className="text-sm font-medium text-neutral-300 mb-2">Theme</p>
          <div className="flex gap-2 flex-wrap">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-xl text-sm border capitalize transition-all ${
                  theme === t
                    ? 'bg-green-500 text-black border-green-500'
                    : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                {t === 'system' ? 'System' : t === 'light' ? 'Light Mode' : 'Dark Mode'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-300 mb-2">Font Size</p>
          <div className="flex gap-2 flex-wrap">
            {(['normal', 'large', 'extra-large'] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => void handlePrefChange('fontSize', size)}
                className={`px-4 py-2 rounded-xl text-sm border capitalize transition-all ${
                  preferences.fontSize === size
                    ? 'bg-green-500 text-black border-green-500'
                    : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                {size === 'extra-large' ? 'Extra Large' : size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <SwitchRow
          id="high-contrast"
          label="High Contrast Mode"
          description="Increase contrast for better visibility"
          checked={preferences.highContrast}
          onChange={(v) => void handlePrefChange('highContrast', v)}
        />
      </div>

      {/* Accessibility */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-2">
        <SectionHeader icon={Volume2} title="Accessibility" subtitle="Features to help you use the app" />

        <SwitchRow
          id="tts"
          label="Text-to-Speech"
          description="Read out analysis results and interface text"
          checked={preferences.textToSpeech}
          onChange={(v) => void handlePrefChange('textToSpeech', v)}
        />
        <SwitchRow
          id="reduce-motion"
          label="Reduce Motion"
          description="Minimize animations and transitions"
          checked={preferences.reduceMotion}
          onChange={(v) => void handlePrefChange('reduceMotion', v)}
        />

        {/* Keyboard shortcuts */}
        <div className="pt-3 mt-2 border-t border-neutral-800">
          <div className="flex items-center gap-2 mb-3">
            <Keyboard className="w-4 h-4 text-neutral-400" />
            <p className="text-sm font-medium text-white">Keyboard Shortcuts</p>
          </div>
          <div className="space-y-2 text-xs text-neutral-400">
            {[
              { action: 'Toggle Sidebar', key: 'Ctrl + /' },
              { action: 'Save Analysis', key: 'Ctrl + S' },
              { action: 'New Analysis', key: 'Ctrl + N' },
              { action: 'Show Shortcuts', key: '?' },
            ].map(({ action, key }) => (
              <div key={action} className="flex justify-between">
                <span>{action}</span>
                <code className="px-2 py-0.5 bg-black rounded border border-neutral-700 font-mono">{key}</code>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Preferences */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-2">
        <SectionHeader icon={Zap} title="Analysis Preferences" subtitle="Configure analysis behavior" />
        <SwitchRow
          id="auto-save"
          label="Auto-save Analyses"
          description="Automatically save all analysis results"
          checked={preferences.autoSave}
          onChange={(v) => void handlePrefChange('autoSave', v)}
        />
        <SwitchRow
          id="notifications"
          label="Notifications"
          description="Receive notifications for analysis completion"
          checked={preferences.notifications}
          onChange={(v) => void handlePrefChange('notifications', v)}
        />
      </div>

      {/* Change Password */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
        <SectionHeader icon={Shield} title="Change Password" color="text-blue-400" />
        <form onSubmit={handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
          <div>
            <label htmlFor="settings-current-pw" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                id="settings-current-pw"
                type={showCurrent ? 'text' : 'password'}
                {...register('current_password')}
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-800 bg-black text-white focus:border-green-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.current_password && <p className="mt-1 text-xs text-red-400">{errors.current_password.message}</p>}
          </div>

          <div>
            <label htmlFor="settings-new-pw" className="block text-sm font-medium text-neutral-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                id="settings-new-pw"
                type={showNew ? 'text' : 'password'}
                {...register('new_password')}
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-neutral-800 bg-black text-white focus:border-green-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.new_password && <p className="mt-1 text-xs text-red-400">{errors.new_password.message}</p>}
          </div>

          <div>
            <label htmlFor="settings-confirm-pw" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="settings-confirm-pw"
              type="password"
              {...register('confirm_password')}
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-800 bg-black text-white focus:border-green-500 focus:outline-none"
            />
            {errors.confirm_password && <p className="mt-1 text-xs text-red-400">{errors.confirm_password.message}</p>}
          </div>

          <Button type="submit" variant="primary" disabled={passwordMutation.isPending}>
            {passwordMutation.isPending ? 'Changing…' : 'Change Password'}
          </Button>
        </form>
      </div>

      {/* Emergency Contacts — users only */}
      {role === 'user' && (
        <div className="space-y-2">
          <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Emergency Alerts</p>
              <p className="text-xs text-amber-200 mt-0.5">
                Configure who gets notified when critical distress is detected. Limited to once per 30 minutes.
              </p>
            </div>
          </div>
          <EmergencyContactsSection />
        </div>
      )}

      {/* Privacy & Data */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
        <SectionHeader icon={Shield} title="Privacy &amp; Data" subtitle="Manage your data and privacy" color="text-red-400" />
        <p className="text-sm text-neutral-400">
          All your analysis data is stored securely on our servers with encryption. You can delete your history at any time.
        </p>
        <div className="pt-2 border-t border-neutral-800">
          <Button
            variant="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setDeleteModalOpen(true)}
          >
            Clear All History
          </Button>
          <p className="mt-2 text-xs text-neutral-500">This will permanently delete all your analysis history.</p>
        </div>
      </div>

      {/* About */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
        <SectionHeader icon={Info} title="About" color="text-neutral-400" />
        <div className="space-y-2 text-sm text-neutral-400">
          {[
            { label: 'Version', value: '2.0.0' },
            { label: 'License', value: 'MIT' },
            { label: 'Last Updated', value: new Date().toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span>{label}</span>
              <span className="font-medium text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clear history confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Clear All History"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => clearHistoryMutation.mutate()}
              disabled={clearHistoryMutation.isPending}
            >
              {clearHistoryMutation.isPending ? 'Clearing…' : 'Clear History'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-300">
          Are you sure you want to clear all your analysis history? This action cannot be undone and all your data will be permanently deleted.
        </p>
      </Modal>
    </div>
  );
}

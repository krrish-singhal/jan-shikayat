import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar.jsx';
import { Navbar } from './Navbar.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Modal } from '../common/Modal.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export const PortalLayout = () => {
  const { t } = useTranslation(['common', 'auth']);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, changePassword } = useAuth();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }

    try {
      setChangingPass(true);
      await changePassword({ currentPassword, newPassword });
      addToast('Password changed successfully. Your account is secured.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mandatory Password Change Modal for newly created staff */}
      {user?.mustChangePassword && (
        <Modal
          isOpen={true}
          onClose={() => {}}
          title={t('auth:changePasswordTitle', 'Security Requirement: Update Temporary Password')}
          maxWidth="max-w-md"
        >
          <div className="mb-4 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
            {t('auth:temporaryPasswordNotice', 'You are logging in with a temporary staff password. You must update your password before proceeding.')}
          </div>
          <form onSubmit={handleForcePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth:currentPassword', 'Temporary Password')}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="civic-input"
                placeholder={t('auth:currentPassword', 'Enter current password')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth:newPassword', 'New Password')}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="civic-input"
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth:confirmPassword', 'Confirm New Password')}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="civic-input"
                placeholder={t('auth:confirmPassword', 'Repeat new password')}
              />
            </div>
            <button
              type="submit"
              disabled={changingPass}
              className="civic-btn-primary w-full"
            >
              {changingPass ? t('common:processing', 'Updating...') : t('auth:updatePassword', 'Set Permanent Password')}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

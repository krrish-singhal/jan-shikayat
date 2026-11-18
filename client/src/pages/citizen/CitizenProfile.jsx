import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Phone, Mail, Lock, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { Modal } from '../../components/common/Modal.jsx';

export const CitizenProfile = () => {
  const { t } = useTranslation(['citizen', 'common', 'auth']);
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updating, setUpdating] = useState(false);

  // Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Delete Account Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await updateProfile({ name, phone });
      addToast(t('citizen:profileUpdated', 'Profile updated successfully'), 'success');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast(t('validation:passwordMatch', 'New passwords do not match'), 'error');
      return;
    }

    try {
      setPassLoading(true);
      await changePassword({ currentPassword, newPassword });
      addToast(t('auth:passwordUpdated', 'Password updated successfully'), 'success');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setPassLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await deleteAccount();
      addToast(t('citizen:accountDeleted', 'Your citizen account has been successfully anonymized and deleted.'), 'info');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-4 px-2 sm:px-0 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('citizen:profileManagementTitle', 'Citizen Profile Management')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('citizen:profileManagementSubtitle', 'Manage your personal contact details, security credentials, and account settings')}</p>
      </div>

      {/* Profile Form Card */}
      <div className="civic-card p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('citizen:contactInfo', 'Contact Information')}</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('auth:fullName', 'Full Name')}</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="civic-input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('auth:email', 'Email Address')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="civic-input pl-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{t('citizen:emailNote', 'Official registered email address cannot be modified directly.')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{t('auth:phoneNumber', 'Phone Number')}</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="civic-input pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updating}
            className="civic-btn-primary"
          >
            {updating ? t('common:loading', 'Saving Changes...') : t('common:save', 'Save Profile Changes')}
          </button>
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="civic-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('citizen:accountSecurity', 'Account Security')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('citizen:securityDesc', 'Regularly updating your password safeguards your grievance records.')}</p>
        </div>
        <button
          onClick={() => setPasswordModalOpen(true)}
          className="civic-btn-secondary text-xs shrink-0 inline-flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{t('auth:updatePassword', 'Change Password')}</span>
        </button>
      </div>

      {/* Account Deletion / Anonymization Card */}
      <div className="civic-card p-6 border-red-200 bg-red-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-red-900">{t('citizen:deleteAccount', 'Delete / Anonymize Account')}</h3>
            <p className="text-xs text-red-700/80 mt-1 max-w-md leading-relaxed">
              {t('citizen:deleteAccountNotice', 'In accordance with municipal record standards, deleting your account anonymizes all personal identifiers while retaining public complaint records for civic audits.')}
            </p>
          </div>
          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="civic-btn-danger text-xs shrink-0 inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('citizen:deleteAccountBtn', 'Delete Account')}</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={t('auth:updatePassword', 'Change Password')}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('auth:currentPassword', 'Current Password')}</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('auth:newPassword', 'New Password')}</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 chars, uppercase, number, symbol"
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t('auth:confirmPassword', 'Confirm New Password')}</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="civic-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="civic-btn-secondary"
            >
              {t('common:cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={passLoading}
              className="civic-btn-primary"
            >
              {passLoading ? t('common:loading', 'Updating...') : t('auth:updatePassword', 'Update Password')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        isDanger={true}
        loading={deleteLoading}
        title={t('citizen:confirmAnonymizeTitle', 'Confirm Account Anonymization')}
        message={t('citizen:confirmAnonymizeMsg', 'Are you sure you want to delete your account? Your personal name, email, and phone number will be permanently deleted and anonymized. Past municipal complaints will remain in municipal audit archives as public records.')}
        confirmText={t('citizen:confirmAnonymizeBtn', 'Yes, Anonymize & Delete')}
      />
    </div>
  );
};

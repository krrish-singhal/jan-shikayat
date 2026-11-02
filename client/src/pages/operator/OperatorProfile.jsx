import React, { useState } from 'react';
import { User, Mail, Shield, Building, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Modal } from '../../components/common/Modal.jsx';

export const OperatorProfile = () => {
  const { user, changePassword } = useAuth();
  const { addToast } = useToast();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }

    try {
      setLoading(true);
      await changePassword({ currentPassword, newPassword });
      addToast('Password updated successfully', 'success');
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Operator Profile</h2>
        <p className="text-xs text-slate-500 mt-1">Official Municipal Staff Credentials</p>
      </div>

      <div className="civic-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-2xl flex items-center justify-center border border-blue-200">
            {user?.name?.charAt(0) || 'O'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500 font-mono">Staff ID: {user?.staffId}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Official Email
            </span>
            <p className="font-mono text-slate-800">{user?.email}</p>
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Assigned Department
            </span>
            <p className="font-semibold text-slate-900">{user?.departmentId?.name || 'Department Desk'}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Security &amp; Password</span>
            <span className="text-[11px] text-slate-400">Update your operator account password</span>
          </div>
          <button
            onClick={() => setPasswordModalOpen(true)}
            className="civic-btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Update Staff Password"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="civic-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="civic-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="civic-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="civic-btn-primary"
            >
              {loading ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

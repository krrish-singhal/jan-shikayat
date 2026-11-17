import React, { useState } from 'react';
import { User, Mail, Shield, Building, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Modal } from '../../components/common/Modal.jsx';

export const OperatorProfile = () => {
  const { user } = useAuth();
  
  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Operator Profile</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Official Municipal Staff Credentials</p>
      </div>

      <div className="civic-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-2xl flex items-center justify-center border border-blue-200 dark:border-blue-900">
            {user?.name?.charAt(0) || 'O'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Staff ID: {user?.staffId}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Official Email
            </span>
            <p className="font-mono text-slate-800 dark:text-slate-200">{user?.email}</p>
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              Assigned Department
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.departmentId?.name || 'Department Desk'}</p>
          </div>
        </div>

      </div>


    </div>
  );
};

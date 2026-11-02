import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Power,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
} from 'lucide-react';
import api from '../../services/api.js';
import { Modal } from '../../components/common/Modal.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export const DepartmentManagement = () => {
  const { addToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [toggleDialog, setToggleDialog] = useState({ isOpen: false, dept: null });

  // Form State
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data || []);
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/admin/departments', formData);
      addToast('Department created successfully', 'success');
      setCreateModalOpen(false);
      setFormData({ name: '', description: '', isActive: true });
      fetchDepartments();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to create department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      isActive: dept.isActive,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.patch(`/admin/departments/${selectedDept._id}`, formData);
      addToast('Department updated successfully', 'success');
      setEditModalOpen(false);
      setSelectedDept(null);
      fetchDepartments();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to update department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    const dept = toggleDialog.dept;
    if (!dept) return;

    try {
      setSubmitting(true);
      if (dept.isActive) {
        // Deactivate using DELETE endpoint
        await api.delete(`/admin/departments/${dept._id}`);
        addToast('Department deactivated', 'success');
      } else {
        // Reactivate using PATCH endpoint
        await api.patch(`/admin/departments/${dept._id}`, { isActive: true });
        addToast('Department reactivated', 'success');
      }
      setToggleDialog({ isOpen: false, dept: null });
      fetchDepartments();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to update department status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Municipal Departments</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure civic divisions, desk intake categories, and operational scopes ({departments.length} active)
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', description: '', isActive: true });
            setCreateModalOpen(true);
          }}
          className="civic-btn-primary text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="civic-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search departments (e.g. Roads & Potholes, Water Supply)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="civic-input pl-9 text-xs"
          />
        </div>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="py-12 flex justify-center text-xs text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading municipal departments...</span>
          </div>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="civic-card p-8 text-center text-xs text-slate-400">
          No municipal departments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <div
              key={dept._id}
              className={`civic-card p-5 space-y-4 border transition-all ${
                dept.isActive ? 'hover:border-brand-300' : 'bg-slate-50/70 border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      dept.isActive
                        ? 'bg-brand-50 text-brand-700 border border-brand-100'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{dept.name}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full inline-block mt-0.5 ${
                        dept.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {dept.isActive ? 'Active Division' : 'Deactivated'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditClick(dept)}
                    title="Edit Department"
                    className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setToggleDialog({ isOpen: true, dept })}
                    title={dept.isActive ? 'Deactivate' : 'Reactivate'}
                    className={`p-1 rounded ${
                      dept.isActive
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {dept.description && (
                <p className="text-xs text-slate-500 line-clamp-2">{dept.description}</p>
              )}

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong className="text-slate-800 font-mono">{dept.complaintCount || 0}</strong> complaints
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong className="text-slate-800 font-mono">{dept.staffCount || 0}</strong> staff assigned
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Department Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Municipal Department"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="civic-input"
              placeholder="e.g. Street Lighting"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Operational Scope</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="civic-input"
              placeholder="Brief description of municipal duties covered by this division..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="civic-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="civic-btn-primary text-xs"
            >
              {submitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedDept(null);
        }}
        title="Edit Department"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="civic-input"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="civic-input"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                setSelectedDept(null);
              }}
              className="civic-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="civic-btn-primary text-xs"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate/Reactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={toggleDialog.isOpen}
        onClose={() => setToggleDialog({ isOpen: false, dept: null })}
        onConfirm={handleToggleActive}
        title={toggleDialog.dept?.isActive ? 'Deactivate Department' : 'Reactivate Department'}
        message={
          toggleDialog.dept?.isActive
            ? `Deactivating ${toggleDialog.dept?.name} will hide it from the citizen complaint registration dropdown. Existing complaint records and assigned staff remain safely preserved.`
            : `Reactivate ${toggleDialog.dept?.name}? Citizens will immediately be able to file complaints under this department.`
        }
        confirmText={toggleDialog.dept?.isActive ? 'Deactivate' : 'Reactivate'}
        type={toggleDialog.dept?.isActive ? 'danger' : 'info'}
        loading={submitting}
      />
    </div>
  );
};

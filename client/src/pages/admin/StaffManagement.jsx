import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  KeyRound,
  Check,
  Copy,
  AlertCircle,
  Building,
  Edit2,
  Power,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import api from '../../services/api.js';
import { Modal } from '../../components/common/Modal.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';

export const StaffManagement = () => {
  const { addToast } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [statusDialog, setStatusDialog] = useState({ isOpen: false, staff: null });
  const [resetDialog, setResetDialog] = useState({ isOpen: false, staff: null });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ROLES.OPERATOR,
    departmentId: '',
    maxActiveCases: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [page, roleFilter, deptFilter, statusFilter]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/admin/departments');
      setDepartments(res.data.data.items || res.data.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        role: roleFilter,
        departmentId: deptFilter,
        status: statusFilter,
        search,
      };
      const res = await api.get('/admin/staff', { params });
      setStaffList(res.data.data.items || []);
      setTotalPages(res.data.data.totalPages || 1);
      setTotalCount(res.data.data.total || 0);
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to load staff list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStaff();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        departmentId: formData.role !== ROLES.ADMIN ? formData.departmentId : null,
        maxActiveCases: formData.role === ROLES.ENGINEER ? Number(formData.maxActiveCases) : 5,
      };

      const res = await api.post('/admin/staff', payload);
      const newStaff = res.data.data;

      setGeneratedCredentials({
        name: newStaff.name,
        staffId: newStaff.staffId,
        email: newStaff.email,
        role: newStaff.role,
        temporaryPassword: newStaff.temporaryPassword,
      });

      setCreateModalOpen(false);
      setCredentialsModalOpen(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: ROLES.OPERATOR,
        departmentId: '',
        maxActiveCases: 5,
      });
      fetchStaff();
      addToast('Staff account created successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to create staff account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      departmentId: staff.departmentId?._id || staff.departmentId || '',
      maxActiveCases: staff.maxActiveCases || 5,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        departmentId: formData.role !== ROLES.ADMIN ? formData.departmentId : null,
        maxActiveCases: formData.role === ROLES.ENGINEER ? Number(formData.maxActiveCases) : 5,
      };

      await api.patch(`/admin/staff/${selectedStaff._id}`, payload);
      setEditModalOpen(false);
      setSelectedStaff(null);
      fetchStaff();
      addToast('Staff details updated successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to update staff', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const staff = statusDialog.staff;
    if (!staff) return;

    try {
      setSubmitting(true);
      const res = await api.patch(`/admin/staff/${staff._id}/status`);
      const { message, activeCasesRequiringReassignment } = res.data.data;

      if (activeCasesRequiringReassignment?.length > 0) {
        addToast(
          `Staff deactivated. Warning: ${activeCasesRequiringReassignment.length} active complaints require reassignment.`,
          'info'
        );
      } else {
        addToast(message || 'Staff status changed', 'success');
      }

      setStatusDialog({ isOpen: false, staff: null });
      fetchStaff();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to toggle status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    const staff = resetDialog.staff;
    if (!staff) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/admin/staff/${staff._id}/reset-password`);
      const { temporaryPassword, staffId, email, name, role } = res.data.data;

      setGeneratedCredentials({
        name,
        staffId,
        email,
        role,
        temporaryPassword,
      });

      setResetDialog({ isOpen: false, staff: null });
      setCredentialsModalOpen(true);
      addToast('Temporary password generated', 'success');
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to reset password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!generatedCredentials) return;
    const text = `JanShikayat Staff Credentials:\nName: ${generatedCredentials.name}\nStaff ID: ${generatedCredentials.staffId}\nEmail: ${generatedCredentials.email}\nTemporary Password: ${generatedCredentials.temporaryPassword}\n\nPlease change your password on first login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('Credentials copied to clipboard', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Provision and oversee Operators, Joint Engineers, and Municipal Officers ({totalCount} total)
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              phone: '',
              role: ROLES.OPERATOR,
              departmentId: departments[0]?._id || '',
              maxActiveCases: 5,
            });
            setCreateModalOpen(true);
          }}
          className="civic-btn-primary text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision New Staff</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or staff ID (e.g. OP-0001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="civic-input pl-9 text-xs"
            />
          </div>
          <button type="submit" className="civic-btn-secondary text-xs">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="civic-input py-1 px-2.5 text-xs w-auto"
          >
            <option value="ALL">All Roles</option>
            <option value={ROLES.OPERATOR}>Operators</option>
            <option value={ROLES.ENGINEER}>Joint Engineers</option>
            <option value={ROLES.ADMIN}>Admins</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="civic-input py-1 px-2.5 text-xs w-auto"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="civic-input py-1 px-2.5 text-xs w-auto"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="civic-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Staff ID</th>
                <th className="py-2.5 px-4">Official</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4 text-center">Workload / Cap</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading staff records...</span>
                    </div>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No municipal staff found matching your criteria.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {staff.staffId || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{staff.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{staff.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          staff.role === ROLES.ADMIN
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : staff.role === ROLES.ENGINEER
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {ROLE_LABELS[staff.role] || staff.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {staff.departmentId?.name || (staff.role === ROLES.ADMIN ? 'Municipal Board' : 'Unassigned')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {staff.role === ROLES.ENGINEER ? (
                        <div className="flex items-center justify-center gap-1 font-mono text-[11px]">
                          <span className="font-bold text-slate-800">{staff.activeCases || 0}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500">{staff.maxActiveCases || 5}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          staff.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {staff.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(staff)}
                          title="Edit Staff"
                          className="p-1 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setResetDialog({ isOpen: true, staff })}
                          title="Reset Password"
                          className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setStatusDialog({ isOpen: true, staff })}
                          title={staff.isActive ? 'Deactivate' : 'Reactivate'}
                          className={`p-1 rounded transition-colors ${
                            staff.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="civic-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="civic-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision Municipal Staff Account"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="civic-input"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="civic-input"
                placeholder="official@civic.gov.in"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="civic-input"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designated Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="civic-input"
              >
                <option value={ROLES.OPERATOR}>Operator (Desk Intake)</option>
                <option value={ROLES.ENGINEER}>Joint Engineer (Ground Field)</option>
                <option value={ROLES.ADMIN}>System Administrator</option>
              </select>
            </div>

            {formData.role !== ROLES.ADMIN ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="civic-input"
                >
                  <option value="">Select Department</option>
                  {departments
                    .filter((d) => d.isActive)
                    .map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col justify-center">
                <span className="text-[11px] text-slate-400">
                  System Admins hold global municipality privileges without department restrictions.
                </span>
              </div>
            )}
          </div>

          {formData.role === ROLES.ENGINEER && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <label className="block font-semibold text-amber-900 mb-1">
                Max Active Case Capacity *
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={formData.maxActiveCases}
                onChange={(e) => setFormData({ ...formData, maxActiveCases: e.target.value })}
                className="civic-input bg-white w-24 text-center"
              />
              <p className="text-[11px] text-amber-700 mt-1">
                Maximum concurrent complaints this engineer can hold in verification or work in progress.
              </p>
            </div>
          )}

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
              {submitting ? 'Provisioning...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedStaff(null);
        }}
        title={`Edit Staff Official - ${selectedStaff?.staffId || ''}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="civic-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="civic-input bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="civic-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="civic-input"
              >
                <option value={ROLES.OPERATOR}>Operator</option>
                <option value={ROLES.ENGINEER}>Joint Engineer</option>
                <option value={ROLES.ADMIN}>Admin</option>
              </select>
            </div>

            {formData.role !== ROLES.ADMIN && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="civic-input"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formData.role === ROLES.ENGINEER && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Active Case Capacity
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={formData.maxActiveCases}
                onChange={(e) => setFormData({ ...formData, maxActiveCases: e.target.value })}
                className="civic-input w-24 text-center"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                setSelectedStaff(null);
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

      {/* Generated Credentials Revealed Modal (Shown ONCE) */}
      <Modal
        isOpen={credentialsModalOpen}
        onClose={() => {
          setCredentialsModalOpen(false);
          setGeneratedCredentials(null);
        }}
        title="Official Municipal Credentials Generated"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Important Security Notice</strong>
              The temporary password is only displayed once and cannot be recovered later. Copy and securely share it with the staff member.
            </div>
          </div>

          {generatedCredentials && (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Staff ID:</span>
                <span className="font-bold text-brand-400">{generatedCredentials.staffId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Official Name:</span>
                <span>{generatedCredentials.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Email:</span>
                <span>{generatedCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="text-emerald-400">{generatedCredentials.role}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-amber-400 font-sans font-bold">Temporary Password:</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded select-all">
                  {generatedCredentials.temporaryPassword}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={copyCredentials}
              className="civic-btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Credentials'}</span>
            </button>
            <button
              onClick={() => {
                setCredentialsModalOpen(false);
                setGeneratedCredentials(null);
              }}
              className="civic-btn-primary text-xs"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate/Reactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={statusDialog.isOpen}
        onClose={() => setStatusDialog({ isOpen: false, staff: null })}
        onConfirm={handleToggleStatus}
        title={statusDialog.staff?.isActive ? 'Deactivate Municipal Official' : 'Reactivate Municipal Official'}
        message={
          statusDialog.staff?.isActive
            ? `Are you sure you want to deactivate ${statusDialog.staff?.name} (${statusDialog.staff?.staffId})? Their active sessions and tokens will be immediately revoked.`
            : `Reactivate official access for ${statusDialog.staff?.name} (${statusDialog.staff?.staffId})?`
        }
        confirmText={statusDialog.staff?.isActive ? 'Deactivate' : 'Reactivate'}
        type={statusDialog.staff?.isActive ? 'danger' : 'info'}
        loading={submitting}
      />

      {/* Reset Password Confirm Dialog */}
      <ConfirmDialog
        isOpen={resetDialog.isOpen}
        onClose={() => setResetDialog({ isOpen: false, staff: null })}
        onConfirm={handleResetPassword}
        title="Reset Official Password"
        message={`Generate a new temporary password for ${resetDialog.staff?.name} (${resetDialog.staff?.staffId})? They will be forced to change it on their next login.`}
        confirmText="Reset &amp; Generate"
        type="warning"
        loading={submitting}
      />
    </div>
  );
};

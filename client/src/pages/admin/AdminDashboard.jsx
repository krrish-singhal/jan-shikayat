import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { STATUS_LABELS } from '../../constants/complaintStatus.js';

const STATUS_COLORS = {
  SUBMITTED: '#3b82f6',
  VERIFICATION_NEEDED: '#f59e0b',
  VERIFICATION_IN_PROGRESS: '#8b5cf6',
  APPROVED: '#06b6d4',
  WORK_IN_PROGRESS: '#6366f1',
  COMPLETED: '#10b981',
  REJECTED: '#ef4444',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Aggregating municipal telemetry...</span>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const byDept = data?.byDepartment || [];
  const monthly = data?.monthlyTrends || [];
  const deptPerformance = data?.departmentPerformance || [];
  const delayedComplaints = data?.delayedComplaints || [];
  const recentComplaints = data?.recentComplaints || [];

  // Format byStatus for Pie Chart
  const statusList = Array.isArray(data?.byStatus)
    ? data.byStatus
    : Object.entries(data?.byStatus || {}).map(([status, count]) => ({ status, count }));

  const statusPieData = statusList
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: STATUS_LABELS[item.status] || item.status,
      value: item.count,
      key: item.status,
      color: STATUS_COLORS[item.status] || '#64748b',
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Municipal Command Center</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-department complaint analytics &amp; operational oversight
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="civic-btn-secondary text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={summary.totalComplaints || 0}
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          title="Registered Citizens"
          value={summary.totalCitizens || 0}
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Active Municipal Staff"
          value={summary.totalStaff || 0}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Pending Verification"
          value={summary.verificationNeeded || 0}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Work in Progress"
          value={summary.inProgress || 0}
          icon={Wrench}
          color="blue"
        />
        <StatCard
          title="Completed Cases"
          value={summary.completed || 0}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Rejected Complaints"
          value={summary.rejected || 0}
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="SLA Alert (>7 Days)"
          value={delayedComplaints.length}
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* SLA Alert Banner if any delayed complaints */}
      {delayedComplaints.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900">
              {delayedComplaints.length} Complaints Pending Beyond SLA Standard
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              These complaints have remained in initial or unassigned stages for over 7 days. Joint engineers and department desks should be reviewed.
            </p>
          </div>
          <Link
            to="/admin/complaints?status=SUBMITTED"
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline flex-shrink-0 self-center"
          >
            Review SLA Queue
          </Link>
        </div>
      )}

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume Chart */}
        <div className="civic-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Complaints by Department</h3>
            <span className="text-[11px] text-slate-400">Total volume</span>
          </div>
          <div className="h-64">
            {byDept.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDept} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No departmental data recorded
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="civic-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Status Distribution</h3>
            <span className="text-[11px] text-slate-400">Lifecycle spread</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No complaint records available
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="civic-card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Monthly Registration vs Resolution</h3>
              <p className="text-[11px] text-slate-400">Trend comparison over recent active months</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Real-time Sync
            </span>
          </div>
          <div className="h-64">
            {monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    name="Registered Complaints"
                    dataKey="registered"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    name="Resolved / Completed"
                    dataKey="completed"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Monthly trend analysis accumulating...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="civic-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Department Operational Efficiency</h3>
            <p className="text-[11px] text-slate-400">Resolution rates across active municipal divisions</p>
          </div>
          <Link
            to="/admin/departments"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Manage Departments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4 text-center">Total Ingested</th>
                <th className="py-2.5 px-4 text-center">Pending Review</th>
                <th className="py-2.5 px-4 text-center">In Progress</th>
                <th className="py-2.5 px-4 text-center">Resolved</th>
                <th className="py-2.5 px-4 text-right">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptPerformance.map((dept, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800">{dept.name}</td>
                  <td className="py-3 px-4 text-center font-mono">{dept.total}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-amber-600">{dept.pending}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-indigo-600">{dept.inProgress}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-semibold text-emerald-600">{dept.completed}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${dept.resolutionRate || 0}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-700 w-9 text-right">
                        {dept.resolutionRate || 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {deptPerformance.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    No departmental performance metrics recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Complaints Feed */}
      <div className="civic-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recent Municipal Influx</h3>
            <p className="text-[11px] text-slate-400">Latest complaints received across all civic wards</p>
          </div>
          <Link
            to="/admin/complaints"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            View All Complaints <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Ticket</th>
                <th className="py-2.5 px-4">Citizen</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Submitted</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentComplaints.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-brand-600">{c.ticketNo}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{c.citizenId?.name || 'Citizen'}</td>
                  <td className="py-3 px-4 text-slate-600">{c.departmentId?.name || 'Unassigned'}</td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-500">{c.description}</td>
                  <td className="py-3 px-4">
                    <Badge status={c.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/admin/complaints/${c._id}`}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Audit
                    </Link>
                  </td>
                </tr>
              ))}
              {recentComplaints.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                    No recent complaints.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

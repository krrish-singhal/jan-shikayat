import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench,
  CheckSquare,
  Search,
  Check,
  Award,
  Clock,
  ArrowRight,
  Briefcase,
  Building,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { CapacityBar } from '../../components/common/CapacityBar.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';

export const EngineerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    department: null,
    verificationNeededCount: 0,
    verifyingCount: 0,
    approvedPendingWorkCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    activeCases: 0,
    maxActiveCases: 5,
    availableCapacity: 5,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/engineer/dashboard');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load engineer dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner with Capacity Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="civic-card p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Joint Engineer Field Console
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Wrench className="w-6 h-6 text-emerald-400" />
              <span>{user?.name}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Department: <span className="font-semibold text-white">{stats.department?.name || user?.departmentId?.name}</span> | Staff ID: <span className="font-mono text-white">{user?.staffId}</span>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/engineer/queue"
              className="civic-btn-primary bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 text-xs sm:text-sm shadow-md"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Claim Cases from Queue ({stats.verificationNeededCount})</span>
            </Link>
            <Link
              to="/engineer/my-cases"
              className="civic-btn-secondary bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs sm:text-sm"
            >
              <Briefcase className="w-4 h-4" />
              <span>My Active Cases ({stats.activeCases})</span>
            </Link>
          </div>
        </div>

        {/* Capacity Bar Component */}
        <div className="lg:col-span-1">
          <CapacityBar
            maxActiveCases={stats.maxActiveCases}
            activeCases={stats.activeCases}
          />
        </div>
      </div>

      {/* Workflow Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Verification Needed"
          value={loading ? '—' : stats.verificationNeededCount}
          subtitle="Department queue"
          icon={CheckSquare}
          color="blue"
          onClick={() => navigate('/engineer/queue')}
        />
        <StatCard
          title="My Verifying Cases"
          value={loading ? '—' : stats.verifyingCount}
          subtitle="Ground check pending"
          icon={Search}
          color="indigo"
          onClick={() => navigate('/engineer/my-cases?tab=VERIFYING')}
        />
        <StatCard
          title="Approved (Pending Work)"
          value={loading ? '—' : stats.approvedPendingWorkCount}
          subtitle="Awaiting machinery"
          icon={Check}
          color="purple"
          onClick={() => navigate('/engineer/my-cases?tab=APPROVED')}
        />
        <StatCard
          title="Work In Progress"
          value={loading ? '—' : stats.inProgressCount}
          subtitle="On-site execution"
          icon={Wrench}
          color="amber"
          onClick={() => navigate('/engineer/my-cases?tab=IN_PROGRESS')}
        />
        <StatCard
          title="Completed"
          value={loading ? '—' : stats.completedCount}
          subtitle="Resolved cases"
          icon={Award}
          color="emerald"
          onClick={() => navigate('/engineer/my-cases?tab=COMPLETED')}
        />
      </div>

      {/* Quick Access Action Card */}
      <div className="civic-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-brand-600">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Unassigned Verification Queue ({stats.verificationNeededCount} complaints available)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Complaints accepted by department operators waiting for joint engineer ground inspection.
          </p>
        </div>
        <Link
          to="/engineer/queue"
          className="civic-btn-primary text-xs shrink-0 self-start sm:self-auto"
        >
          <span>Open Verification Queue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

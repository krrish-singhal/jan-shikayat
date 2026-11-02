import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckSquare, Eye, FileText, MapPin, AlertCircle, Wrench, ArrowRight } from 'lucide-react';
import api from '../../services/api.js';
import { DataTable } from '../../components/common/DataTable.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { CapacityBar } from '../../components/common/CapacityBar.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export const VerificationQueue = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { user } = useAuth();

  const currentPage = Number(searchParams.get('page')) || 1;
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Capacity state
  const [capacity, setCapacity] = useState({
    maxActiveCases: user?.maxActiveCases || 5,
    activeCases: 0,
    availableCapacity: 5,
    isAtCapacity: false,
  });
  const [pickingId, setPickingId] = useState(null);

  const fetchCapacity = async () => {
    try {
      const res = await api.get('/engineer/capacity');
      if (res.data?.success) {
        setCapacity(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '10');
      if (search.trim()) params.append('search', search.trim());

      const [resQueue] = await Promise.all([
        api.get(`/engineer/queue?${params.toString()}`),
        fetchCapacity(),
      ]);

      if (resQueue.data?.success) {
        setComplaints(resQueue.data.data.items);
        setTotal(resQueue.data.data.total);
        setTotalPages(resQueue.data.data.totalPages);
      }
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to load verification queue', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, addToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handlePickup = async (complaintId) => {
    if (capacity.isAtCapacity) {
      addToast('Cannot pick up complaint: Maximum active case capacity reached.', 'error');
      return;
    }

    try {
      setPickingId(complaintId);
      const res = await api.post(`/engineer/complaints/${complaintId}/pickup`);
      if (res.data?.success) {
        addToast('Complaint successfully claimed! Moved to your active Verifying cases.', 'success');
        fetchQueue();
        navigate('/engineer/my-cases?tab=VERIFYING');
      }
    } catch (err) {
      const code = err.response?.data?.error?.code;
      const message = err.response?.data?.error?.message;
      if (code === 'CAPACITY_REACHED') {
        addToast(`Capacity Reached: ${message}`, 'error');
      } else if (code === 'CONFLICT' || code === 'INVALID_TRANSITION') {
        addToast('Conflict: This complaint was already picked up by another engineer.', 'error');
        fetchQueue();
      } else {
        addToast(message || err.message, 'error');
      }
    } finally {
      setPickingId(null);
    }
  };

  const columns = [
    {
      header: 'Ticket #',
      key: 'ticketNo',
      className: 'w-36 font-mono font-bold text-slate-900',
      render: (row) => <span>{row.ticketNo}</span>,
    },
    {
      header: 'Evidence',
      key: 'imageUrl',
      className: 'w-16',
      render: (row) =>
        row.imageUrl ? (
          <img
            src={row.imageUrl}
            alt="Evidence"
            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            <FileText className="w-4 h-4" />
          </div>
        ),
    },
    {
      header: 'Description & Location',
      key: 'description',
      className: 'max-w-xs',
      render: (row) => (
        <div>
          <p className="text-xs text-slate-800 font-medium truncate max-w-xs">{row.description}</p>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            {row.location?.address}
          </span>
        </div>
      ),
    },
    {
      header: 'Informant',
      key: 'citizen',
      className: 'text-xs text-slate-700',
      render: (row) => (
        <div>
          <div>{row.citizenId?.name || 'Citizen'}</div>
          {row.citizenId?.phone && <div className="text-[10px] text-slate-400 font-mono">{row.citizenId.phone}</div>}
        </div>
      ),
    },
    {
      header: 'Accepted (FIFO)',
      key: 'createdAt',
      className: 'w-32 font-mono text-xs text-slate-500',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'w-44 text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/engineer/complaints/${row._id}`)}
            className="civic-btn-secondary text-xs py-1.5 px-2.5 inline-flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
          <button
            onClick={() => handlePickup(row._id)}
            disabled={pickingId === row._id || capacity.isAtCapacity}
            className="civic-btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 inline-flex items-center gap-1"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{pickingId === row._id ? 'Claiming...' : 'Pick Up'}</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Capacity Progress Bar at the top */}
      <CapacityBar
        maxActiveCases={capacity.maxActiveCases}
        activeCases={capacity.activeCases}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verification Needed Queue</h2>
          <p className="text-xs text-slate-500 mt-1">
            Department: <span className="font-semibold text-slate-800">{user?.departmentId?.name}</span> (Oldest Complaints First)
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg shrink-0">
          Available in Queue: {total}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={complaints}
        loading={loading}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={handlePageChange}
        searchPlaceholder="Search by ticket # or location..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No complaints waiting for verification in your department."
      />
    </div>
  );
};

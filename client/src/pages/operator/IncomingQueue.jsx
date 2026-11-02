import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, FileText, Clock, User, Phone, MapPin } from 'lucide-react';
import api from '../../services/api.js';
import { DataTable } from '../../components/common/DataTable.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export const IncomingQueue = () => {
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

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '10');
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/operator/complaints?${params.toString()}`);
      if (res.data?.success) {
        setComplaints(res.data.data.items);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to load incoming queue', 'error');
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
      header: 'Citizen Info',
      key: 'citizen',
      className: 'text-xs text-slate-800',
      render: (row) => (
        <div>
          <div className="font-semibold">{row.citizenId?.name || 'Citizen'}</div>
          {row.citizenId?.phone && (
            <div className="text-[11px] text-slate-400 font-mono">{row.citizenId.phone}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Description & Location',
      key: 'description',
      className: 'max-w-xs',
      render: (row) => (
        <div>
          <p className="text-xs text-slate-700 truncate max-w-xs">{row.description}</p>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            {row.location?.address}
          </span>
        </div>
      ),
    },
    {
      header: 'Submitted (FIFO)',
      key: 'createdAt',
      className: 'w-36 font-mono text-xs text-slate-500',
      render: (row) => (
        <div>
          <div>{new Date(row.createdAt).toLocaleDateString()}</div>
          <div className="text-[10px] text-slate-400">
            {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      header: 'Forward Count',
      key: 'forwardCount',
      className: 'w-24 text-center',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
            row.forwardCount > 3 ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.forwardCount || 0}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'w-28 text-right',
      render: (row) => (
        <button
          onClick={() => navigate(`/operator/complaints/${row._id}`)}
          className="civic-btn-primary text-xs py-1.5 px-3"
        >
          <span>Process</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Department Incoming Queue</h2>
          <p className="text-xs text-slate-500 mt-1">
            Displaying complaints for <span className="font-semibold text-slate-800">{user?.departmentId?.name}</span> (FIFO Order: Oldest First)
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg shrink-0">
          Status: SUBMITTED ({total})
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
        searchPlaceholder="Search ticket # or description..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage="No pending complaints in your department's incoming queue."
      />
    </div>
  );
};

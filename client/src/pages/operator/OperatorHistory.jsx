import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { History, Eye, CheckCircle2, XCircle, Share2 } from 'lucide-react';
import api from '../../services/api.js';
import { DataTable } from '../../components/common/DataTable.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export const OperatorHistory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentAction = searchParams.get('action') || 'ALL';

  const [historyItems, setHistoryItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '10');
      if (currentAction !== 'ALL') params.append('action', currentAction);

      const res = await api.get(`/operator/history?${params.toString()}`);
      if (res.data?.success) {
        setHistoryItems(res.data.data.items);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      addToast('Failed to load operator action history', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentAction, addToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleActionFilter = (actionKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('action', actionKey);
    params.set('page', '1');
    setSearchParams(params);
  };

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
      header: 'Action Taken',
      key: 'action',
      className: 'w-32',
      render: (row) => {
        let badge = 'bg-slate-100 text-slate-700';
        if (row.action === 'ACCEPT') badge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        else if (row.action === 'REJECT') badge = 'bg-red-50 text-red-700 border border-red-200';
        else if (row.action === 'FORWARD') badge = 'bg-purple-50 text-purple-700 border border-purple-200';
        return <span className={`px-2 py-0.5 rounded text-xs font-bold ${badge}`}>{row.action}</span>;
      },
    },
    {
      header: 'Current Status',
      key: 'currentStatus',
      className: 'w-36',
      render: (row) => <StatusBadge status={row.currentStatus} />,
    },
    {
      header: 'Citizen',
      key: 'citizen',
      className: 'text-xs text-slate-800 font-medium',
      render: (row) => row.citizenName,
    },
    {
      header: 'Action Notes / Remarks',
      key: 'note',
      className: 'max-w-xs truncate text-xs text-slate-600',
      render: (row) => <span className="truncate block max-w-xs">{row.note || '—'}</span>,
    },
    {
      header: 'Date & Time',
      key: 'actionDate',
      className: 'w-36 font-mono text-xs text-slate-500',
      render: (row) => new Date(row.actionDate).toLocaleString(),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'w-24 text-right',
      render: (row) => (
        <button
          onClick={() => navigate(`/operator/complaints/${row.complaintId}`)}
          className="civic-btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Operator Action History</h2>
          <p className="text-xs text-slate-500 mt-1">Audit log of all grievances triaged by your operator account</p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          {['ALL', 'ACCEPT', 'REJECT', 'FORWARD'].map((act) => (
            <button
              key={act}
              onClick={() => handleActionFilter(act)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentAction === act
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {act === 'ALL' ? 'All Actions' : act}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={historyItems}
        loading={loading}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={handlePageChange}
        emptyMessage="No actions recorded in your operator history."
      />
    </div>
  );
};

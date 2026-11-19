import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, FileText, Filter, Search } from 'lucide-react';
import api from '../../services/api.js';
import { DataTable } from '../../components/common/DataTable.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { TranslatedContent } from '../../components/common/TranslatedContent.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getImageUrl, formatDate } from '../../utils/formatters.js';

export const MyComplaints = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { t, i18n } = useTranslation(['citizen', 'common']);

  const currentTab = searchParams.get('status') || 'ALL';
  const currentPage = Number(searchParams.get('page')) || 1;

  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const filterTabs = [
    { key: 'ALL', label: t('common:all', 'All Complaints') },
    { key: 'Pending', label: t('common:statusMap.PENDING', 'Pending') },
    { key: 'Approved', label: t('common:statusMap.APPROVED', 'Approved') },
    { key: 'Work in Progress', label: t('common:statusMap.WORK_IN_PROGRESS', 'In Progress') },
    { key: 'Completed', label: t('common:statusMap.COMPLETED', 'Completed') },
    { key: 'Rejected', label: t('common:statusMap.REJECTED', 'Rejected') },
  ];

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '10');
      if (currentTab !== 'ALL') params.append('status', currentTab);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/complaints?${params.toString()}`);
      if (res.data?.success) {
        setComplaints(res.data.data.items);
        setTotal(res.data.data.total);
        setTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      addToast('Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentTab, currentPage, search, addToast]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleTabChange = (key) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', key);
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
      header: t('common:ticketNo', 'Ticket #'),
      key: 'ticketNo',
      className: 'w-36 font-mono font-bold text-slate-900 dark:text-slate-100',
      render: (row) => <span>{row.ticketNo}</span>,
    },
    {
      header: t('common:photoEvidence', 'Evidence'),
      key: 'image',
      className: 'w-16',
      render: (row) =>
        row.imageUrl ? (
          <img
            src={getImageUrl(row.imageUrl)}
            alt="Complaint thumbnail"
            className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/uploads/sample-road.svg';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <FileText className="w-4 h-4" />
          </div>
        ),
    },
    {
      header: t('common:department', 'Department'),
      key: 'department',
      className: 'font-medium text-slate-800 dark:text-slate-200',
      render: (row) => t(`common:departments.${row.department}`, row.department),
    },
    {
      header: t('common:description', 'Description'),
      key: 'description',
      className: 'max-w-xs text-slate-600 dark:text-slate-300',
      render: (row) => (
        <div className="max-w-xs truncate">
          <TranslatedContent text={row.description} complaintId={row._id} />
        </div>
      ),
    },
    {
      header: t('common:date', 'Date Filed'),
      key: 'createdAt',
      className: 'w-32 font-mono text-xs text-slate-500 dark:text-slate-400',
      render: (row) => formatDate(row.createdAt, i18n.language),
    },
    {
      header: t('common:status', 'Status'),
      key: 'status',
      className: 'w-55',
      render: (row) => <StatusBadge status={row.status} isCitizenView={true} />,
    },
    {
      header: t('common:actions', 'Actions'),
      key: 'actions',
      className: 'w-65 text-right',
      render: (row) => (
        <button
          onClick={() => navigate(`/citizen/complaints/${row._id}`)}
          className="civic-btn-secondary text-xs py-1.5 px-2.5 inline-flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t('common:viewDetails', 'Details')}</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('citizen:myComplaintsTitle', 'My Registered Complaints')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('citizen:myComplaintsSubtitle', 'Track the resolution lifecycle of all your submitted municipal grievances')}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {filterTabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-brand-600 dark:bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Complaints Table */}
      <DataTable
        columns={columns}
        data={complaints}
        loading={loading}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={handlePageChange}
        searchPlaceholder={t('citizen:searchPlaceholder', 'Search complaints by ticket, description, location...')}
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage={t('common:noResultsFound', 'No complaints match this filter.')}
      />
    </div>
  );
};

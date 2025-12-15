'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Edit, Trash2, ChevronRight, X, Save, Eye
} from 'lucide-react';

import OrderService from '../../../../services/OrderService';

const STATUS_MAP = {
  0: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  1: { label: 'New', color: 'bg-blue-100 text-blue-800' },
  2: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800' },
  3: { label: 'Completed', color: 'bg-green-100 text-green-800' }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Selected order for view / status change
  const [selected, setSelected] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const fetchOrders = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const payload = await OrderService.getList({ page, limit: 10, search });
      console.debug('OrderService.getList payload:', payload);
      if (payload && payload.status) {
        setOrders(payload.data || []);
        setPagination({
          current_page: payload.meta?.current_page ?? 1,
          last_page: payload.meta?.last_page ?? 1,
          total: payload.meta?.total ?? 0,
          per_page: payload.meta?.per_page ?? 10
        });
      } else if (Array.isArray(payload)) {
        setOrders(payload);
      } else {
        setOrders(payload?.data ?? []);
        setPagination(prev => prev);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchOrders(pagination.current_page, searchTerm);
    }, 300);
    return () => clearTimeout(t);
  }, [fetchOrders, pagination.current_page, searchTerm]);

  const openView = async (order) => {
    setLoading(true);
    try {
      const payload = await OrderService.getById(order.id);
      console.debug('OrderService.getById payload:', payload);
      if (payload && payload.status) {
        setSelected(payload.data);
      } else {
        setSelected(order);
      }
      setShowViewModal(true);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết order:', error);
      setSelected(order);
      setShowViewModal(true);
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (order) => {
    setSelected(order);
    setNewStatus(order.status ?? '');
    setStatusNote('');
    setShowStatusModal(true);
  };

  const submitStatus = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (newStatus === '') {
      alert('Vui lòng chọn trạng thái mới.');
      return;
    }
    setLoading(true);
    try {
      const payload = await OrderService.updateStatus(selected.id, { status: Number(newStatus), note: statusNote });
      console.debug('OrderService.updateStatus payload:', payload);
      if (payload && payload.status) {
        alert('Cập nhật trạng thái thành công');
        setShowStatusModal(false);
        setShowViewModal(false);
        fetchOrders(pagination.current_page, searchTerm);
      } else {
        alert(payload?.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      alert('Lỗi hệ thống khi cập nhật trạng thái.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;
    setLoading(true);
    try {
      const payload = await OrderService.delete(id);
      console.debug('OrderService.delete payload:', payload);
      if (payload && payload.status) {
        alert('Đã xóa đơn hàng');
        fetchOrders(pagination.current_page, searchTerm);
      } else {
        alert(payload?.message || 'Xóa thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi xóa order:', error);
      alert('Không thể xóa đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  const formatCurrency = (v) => {
    if (v == null) return '-';
    return Number(v).toLocaleString() + '₫';
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '-';

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Orders</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order List</h2>
            <div className="flex gap-3">
              <button onClick={() => fetchOrders(1, '')} className="px-4 py-2 border rounded hover:bg-gray-50">Refresh</button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone or note..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, current_page: 1})); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {loading && <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">Loading...</div>}

          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Address</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Note</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created At</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-gray-600">#{o.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{o.name || '-'}</div>
                    <div className="text-xs text-gray-500">{o.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{o.phone || '-'}</td>
                  <td className="px-6 py-4 text-gray-700">{o.address || '-'}</td>
                  <td className="px-6 py-4 text-gray-900">{o.note ? (o.note.length > 80 ? o.note.slice(0, 80) + '...' : o.note) : '-'}</td>
                  <td className="px-6 py-4">
                    {STATUS_MAP[o.status] ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[o.status].color}`}>
                        {STATUS_MAP[o.status].label}
                      </span>
                    ) : <span className="text-sm text-gray-500">Unknown</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(o.created_at)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openView(o)} title="View" className="p-2 hover:bg-blue-50 rounded-lg group">
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </button>
                      <button onClick={() => openView(o)} className="p-2 hover:bg-blue-50 rounded-lg group">
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </button>
                      <button onClick={() => openStatusModal(o)} className="p-2 hover:bg-indigo-50 rounded-lg group">
                        <Save className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                      </button>
                      <button onClick={() => handleDelete(o.id)} className="p-2 hover:bg-red-50 rounded-lg group">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500">Page {pagination.current_page} of {pagination.last_page}</div>
          <div className="flex gap-2">
            <button onClick={() => changePage(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <button onClick={() => changePage(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Detail</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-500">Customer</div>
                <div className="font-medium text-lg">{selected.name || '-'}</div>
                <div className="text-sm text-gray-500">{selected.email || '-'}</div>
                <div className="text-sm mt-2">{selected.phone || '-'}</div>
                <div className="text-sm mt-2 text-gray-700">{selected.address || '-'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Note</div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded whitespace-pre-wrap">{selected.note || '-'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="mt-1">
                  {STATUS_MAP[selected.status] ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[selected.status].color}`}>
                      {STATUS_MAP[selected.status].label}
                    </span>
                  ) : <span>Unknown</span>}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowViewModal(false); openStatusModal(selected); }} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Change Status</button>
                <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border rounded">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Change Order Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={submitStatus} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                  <option value="">Select status</option>
                  {Object.keys(STATUS_MAP).map(k => (
                    <option key={k} value={k}>{STATUS_MAP[k].label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Note (optional)</label>
                <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={4} className="w-full px-4 py-3 border rounded-lg resize-none" />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowStatusModal(false)} className="px-6 py-3 border rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

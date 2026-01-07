'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Edit, Trash2, ChevronRight, X, Eye } from 'lucide-react';
import OrderService from '../../../../services/OrderService';

const STATUS_MAP = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  shipping: { label: 'Shipping', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-800' },
  1: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  2: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'Shipping', color: 'bg-yellow-100 text-yellow-800' },
  4: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  0: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://placehold.co/50x50?text=No+Img';
  if (imagePath.startsWith('http')) return imagePath;
  return `http://127.0.0.1:8000/storage/${imagePath}`;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const formatCurrency = (v) =>
    v == null ? '-' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');
  const calculateTotal = (items) =>
    !items || !Array.isArray(items) ? 0 : items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);

  // Items: ưu tiên details, sau đó order_details, order_items, items
  const getOrderItems = (order) =>
    order?.details ||
    order?.order_details ||
    order?.order_items ||
    order?.items ||
    [];

  // Customer info
  const customerName = (o) => o.customer_name || o.name || o.user?.name || 'N/A';
  const customerEmail = (o) => o.customer_email || o.email || o.user?.email || 'N/A';
  const customerPhone = (o) => o.customer_phone || o.phone || o.user?.phone || 'N/A';
  const shippingAddress = (o) => o.shipping_address || o.address || o.user?.address || 'Không có địa chỉ';

  // Chuẩn hóa list
  const normalizeOrders = (payload, page, perPage) => {
    // hỗ trợ cả trường hợp payload.data là axios response
    const body = payload?.data?.data ? payload.data : payload;
    let list = [];
    let meta = { current_page: page, last_page: 1, total: 0, per_page: perPage };

    const root = body?.data ?? body;

    if (Array.isArray(root?.data?.data)) {
      list = root.data.data;
      meta = {
        current_page: root.data.current_page ?? root.data.meta?.current_page ?? page,
        last_page: root.data.last_page ?? root.data.meta?.last_page ?? 1,
        total: root.data.total ?? root.data.meta?.total ?? list.length,
        per_page: root.data.per_page ?? root.data.meta?.per_page ?? perPage,
      };
    } else if (Array.isArray(root?.data)) {
      list = root.data;
      meta = {
        current_page: root.meta?.current_page ?? page,
        last_page: root.meta?.last_page ?? 1,
        total: root.meta?.total ?? list.length,
        per_page: root.meta?.per_page ?? perPage,
      };
    } else if (Array.isArray(root)) {
      list = root;
      meta = { current_page: page, last_page: 1, total: list.length, per_page: perPage };
    }

    return {
      list,
      meta: {
        current_page: meta.current_page ?? page,
        last_page: meta.last_page ?? 1,
        total: meta.total ?? list.length,
        per_page: meta.per_page ?? perPage,
      },
    };
  };

  const fetchOrders = useCallback(
    async (page = 1, search = '') => {
      setLoading(true);
      try {
        const payload = await OrderService.getList({ page, limit: pagination.per_page, search });
        const { list, meta } = normalizeOrders(payload, page, pagination.per_page);
        setOrders(list);
        setPagination(meta);
      } catch (error) {
        console.error('Lỗi lấy danh sách:', error);
        setOrders([]);
        setPagination((prev) => ({ ...prev, current_page: 1, last_page: 1, total: 0 }));
      } finally {
        setLoading(false);
      }
    },
    [pagination.per_page]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchOrders(pagination.current_page, searchTerm), 300);
    return () => clearTimeout(t);
  }, [fetchOrders, pagination.current_page, searchTerm]);

  const openView = async (order) => {
    setLoading(true);
    try {
      const payload = await OrderService.getById(order.id);
      // hỗ trợ axios trả payload.data
      const body = payload?.data?.data ? payload.data : payload;
      const detail = body?.data ?? body;
      if (detail) setSelected(detail);
      else setSelected(order);
    } catch (error) {
      // fallback dùng record list
      setSelected(order);
    } finally {
      setShowViewModal(true);
      setLoading(false);
    }
  };

  const openStatusModal = (order) => {
    setSelected(order);
    setNewStatus(order.status ?? '');
    setStatusNote(order.status_note || '');
    setShowStatusModal(true);
  };

  const submitStatus = async (e) => {
    e.preventDefault();
    if (!selected || newStatus === '') return alert('Vui lòng chọn trạng thái.');
    setLoading(true);
    try {
      const payload = await OrderService.updateStatus(selected.id, { status: newStatus, note: statusNote });
      const ok = payload?.status ?? payload?.data?.status;
      if (ok) {
        alert('Cập nhật thành công');
        setShowStatusModal(false);
        setShowViewModal(false);
        fetchOrders(pagination.current_page, searchTerm);
      } else alert(payload?.message || payload?.data?.message || 'Thất bại');
    } catch (error) {
      alert('Lỗi hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa đơn hàng này?')) return;
    setLoading(true);
    try {
      const payload = await OrderService.delete(id);
      const ok = payload?.status ?? payload?.data?.status;
      if (ok) {
        alert('Đã xóa');
        fetchOrders(pagination.current_page, searchTerm);
      } else alert('Xóa thất bại');
    } catch (error) {
      alert('Lỗi khi xóa.');
    } finally {
      setLoading(false);
    }
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page)
      setPagination((prev) => ({ ...prev, current_page: newPage }));
  };

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
            <button onClick={() => fetchOrders(1, '')} className="px-4 py-2 border rounded hover:bg-gray-50">
              Refresh
            </button>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination((p) => ({ ...p, current_page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
              Loading...
            </div>
          )}
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Address</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {Array.isArray(orders) && orders.length > 0 ? (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 text-gray-600">#{o.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{customerName(o)}</div>
                      <div className="text-xs text-gray-500">{customerEmail(o)}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{customerPhone(o)}</td>
                    <td className="px-6 py-4 text-gray-700 truncate max-w-xs" title={shippingAddress(o)}>
                      {shippingAddress(o)}
                    </td>
                    <td className="px-6 py-4">
                      {STATUS_MAP[o.status] ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[o.status].color}`}
                        >
                          {STATUS_MAP[o.status].label}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">{o.status}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(o.created_at)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openView(o)} className="p-2 hover:bg-blue-50 rounded-lg group">
                          <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </button>
                        <button onClick={() => openStatusModal(o)} className="p-2 hover:bg-indigo-50 rounded-lg group">
                          <Edit className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                        </button>
                        <button onClick={() => handleDelete(o.id)} className="p-2 hover:bg-red-50 rounded-lg group">
                          <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {pagination.current_page} of {pagination.last_page}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => changePage(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => changePage(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      {showViewModal && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gray-50 dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Chi tiết đơn hàng #{selected.id}
                  {STATUS_MAP[selected.status] && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_MAP[selected.status].color}`}>
                      {STATUS_MAP[selected.status].label}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Ngày đặt: {formatDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">👤 Thông tin khách hàng</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500 w-20 inline-block">Họ tên:</span>{' '}
                      <span className="font-medium">{customerName(selected)}</span>
                    </p>
                    <p>
                      <span className="text-gray-500 w-20 inline-block">Email:</span>{' '}
                      <span className="font-medium">{customerEmail(selected)}</span>
                    </p>
                    <p>
                      <span className="text-gray-500 w-20 inline-block">SĐT:</span>{' '}
                      <span className="font-medium">{customerPhone(selected)}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">🚚 Giao hàng & Ghi chú</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-500 block mb-1">Địa chỉ:</span>
                      <span className="font-medium">{shippingAddress(selected)}</span>
                    </p>
                    {selected.note && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-500 block mb-1">Ghi chú:</span>
                        <p className="text-gray-700 dark:text-gray-300 italic text-xs bg-white p-2 rounded border border-dashed">
                          {selected.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-white">📦 Danh sách sản phẩm</h3>
                <div className="border rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 font-semibold border-b">
                      <tr>
                        <th className="px-4 py-3 text-left w-12">#</th>
                        <th className="px-4 py-3 text-left">Sản phẩm</th>
                        <th className="px-4 py-3 text-center w-24">Size</th>
                        <th className="px-4 py-3 text-center w-24">Số lượng</th>
                        <th className="px-4 py-3 text-right w-32">Đơn giá</th>
                        <th className="px-4 py-3 text-right w-32">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {getOrderItems(selected).map((item, index) => (
                        <tr key={item.id || `${item.product_id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-4 py-3 text-center text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded border shrink-0 overflow-hidden">
                                <img
                                  src={getImageUrl(item.product?.thumbnail || item.product?.image || item.product?.image_url)}
                                  alt={item.product?.name || item.name || `Sản phẩm #${item.product_id || '-'}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/40?text=Img';
                                  }}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                  {item.product?.name || item.name || `Sản phẩm #${item.product_id || '-'}`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.size ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                {item.size}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">{item.qty}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-600">
                            {formatCurrency(Number(item.price) * Number(item.qty || 0))}
                          </td>
                        </tr>
                      ))}

                      {getOrderItems(selected).length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-400 italic">
                            Không tìm thấy chi tiết sản phẩm.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold border-t">
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-right text-gray-600">
                          Tổng cộng:
                        </td>
                        <td className="px-4 py-3 text-right text-lg text-blue-700">
                          {formatCurrency(selected.total_amount || calculateTotal(getOrderItems(selected)))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border-t px-6 py-4 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openStatusModal(selected);
                }}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 transition-colors"
              >
                Cập nhật trạng thái
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MODAL */}
      {showStatusModal && selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cập nhật trạng thái</h2>
              <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitStatus} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Trạng thái mới</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Chọn trạng thái</option>
                  {Object.keys(STATUS_MAP).map((k) => (
                    <option key={k} value={k}>
                      {STATUS_MAP[k].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Ghi chú (Tùy chọn)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập lý do hoặc ghi chú..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowStatusModal(false)} className="px-6 py-2.5 border rounded-lg hover:bg-gray-50">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
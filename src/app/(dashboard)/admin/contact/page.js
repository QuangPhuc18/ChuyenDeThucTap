'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus,
  Edit, Trash2, ChevronRight, X, Save
} from 'lucide-react';

import ContactService from '../../../../services/ContactService';

export default function ContactPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, total: 0, per_page: 10
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  const fetchItems = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      // Get payload from service (expected shape: { status, message, data, meta })
      const payload = await ContactService.getList({ page, limit: 10, search });
      console.debug('ContactService.getList payload:', payload);

      if (payload && payload.status) {
        setItems(payload.data || []);
        setPagination({
          current_page: payload.meta?.current_page ?? 1,
          last_page: payload.meta?.last_page ?? 1,
          total: payload.meta?.total ?? 0,
          per_page: payload.meta?.per_page ?? 10
        });
      } else if (Array.isArray(payload)) {
        // fallback: service returned array directly
        console.debug('ContactService.getList returned array directly', payload);
        setItems(payload);
        setPagination(prev => ({ ...prev, total: payload.length }));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Lỗi kết nối khi fetch contacts:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchItems(pagination.current_page, searchTerm);
    }, 300);
    return () => clearTimeout(t);
  }, [fetchItems, pagination.current_page, searchTerm]);

  const openView = async (item) => {
    setLoading(true);
    try {
      const payload = await ContactService.getById(item.id);
      console.debug('ContactService.getById payload:', payload);
      if (payload && payload.status) {
        setSelected(payload.data);
      } else {
        setSelected(item);
      }
      setShowModal(true);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết contact:', error);
      setSelected(item);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReplyOpen = (item) => {
    setSelected(item);
    setReplyContent('');
    setShowReplyModal(true);
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!replyContent.trim()) {
      alert('Nội dung trả lời không được để trống.');
      return;
    }
    setLoading(true);
    try {
      const payload = await ContactService.reply(selected.id, { content: replyContent });
      console.debug('ContactService.reply payload:', payload);
      if (payload && payload.status) {
        alert('Trả lời thành công');
        setShowReplyModal(false);
        setShowModal(false);
        fetchItems(pagination.current_page, searchTerm);
      } else {
        alert(payload?.message || 'Trả lời thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi reply:', error);
      alert('Lỗi hệ thống khi trả lời.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa liên hệ này?')) return;
    try {
      const payload = await ContactService.delete(id);
      console.debug('ContactService.delete payload:', payload);
      if (payload && payload.status) {
        alert('Đã xóa liên hệ');
        fetchItems(pagination.current_page, searchTerm);
      } else {
        alert(payload?.message || 'Xóa thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi xóa contact:', error);
      alert('Không thể xóa liên hệ.');
    }
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  // Render unchanged UI
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Contacts</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Contact List</h2>
            <div className="flex gap-3">
              <button onClick={() => fetchItems(1, '')} className="px-4 py-2 border rounded hover:bg-gray-50">Refresh</button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone or content..."
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Snippet</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Replies</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created At</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {items.map(it => (
                <tr key={it.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-gray-600">#{it.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{it.name}</div>
                    <div className="text-xs text-gray-500">{it.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{it.phone || '-'}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{it.content ? (it.content.length > 80 ? it.content.slice(0, 80) + '...' : it.content) : '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{(it.replies && it.replies.length) ? it.replies.length : 0}</td>
                  <td className="px-6 py-4 text-gray-600">{it.created_at ? new Date(it.created_at).toLocaleString() : '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openView(it)} className="p-2 hover:bg-blue-50 rounded-lg group">
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </button>
                      <button onClick={() => handleReplyOpen(it)} className="p-2 hover:bg-green-50 rounded-lg group">
                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                      </button>
                      <button onClick={() => handleDelete(it.id)} className="p-2 hover:bg-red-50 rounded-lg group">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No contacts found</td>
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
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Detail</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="text-sm text-gray-500">From</div>
                <div className="text-lg font-medium">{selected.name} — {selected.email}</div>
                <div className="text-sm text-gray-500">{selected.phone || '-'}</div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-gray-500">Message</div>
                <div className="whitespace-pre-wrap p-4 bg-gray-50 dark:bg-gray-800 rounded">{selected.content}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Replies</div>
                {selected.replies && selected.replies.length > 0 ? (
                  <div className="space-y-3">
                    {selected.replies.map(r => (
                      <div key={r.id} className="p-3 border rounded">
                        <div className="text-xs text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleString() : ''} — {r.created_by ? `By ${r.created_by}` : 'Admin'}</div>
                        <div className="mt-1 whitespace-pre-wrap">{r.content}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No replies yet.</div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => { setShowModal(false); handleReplyOpen(selected); }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Reply</button>
                <button onClick={() => { setShowModal(false); }} className="px-4 py-2 border rounded">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reply to {selected.name}</h2>
              <button onClick={() => setShowReplyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={submitReply} className="p-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Your reply</label>
                <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={6} className="w-full px-4 py-3 border rounded-lg resize-none" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowReplyModal(false)} className="px-6 py-3 border rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Send Reply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
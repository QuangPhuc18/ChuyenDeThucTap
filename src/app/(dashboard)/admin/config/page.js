'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, ChevronRight, X, Save } from 'lucide-react';
import ConfigService from '../../../../services/ConfigService';

export default function ConfigPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, total: 0, per_page: 20
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    site_name: '',
    email: '',
    phone: '',
    hotline: '',
    address: '',
    status: 1
  });

  // Fetch list and handle different response shapes defensively
  const fetchItems = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const payload = await ConfigService.getList({ page, limit: pagination.per_page, search });
      console.debug('ConfigService.getList ->', payload);

      // payload may be:
      // - { status, message, data, meta }
      // - an array (fallback)
      // - axios response already normalized -> we expect service returns res.data
      if (!payload) {
        setItems([]);
        setPagination(prev => ({ ...prev, total: 0, last_page: 1, current_page: 1 }));
        return;
      }

      if (Array.isArray(payload)) {
        setItems(payload);
        setPagination(prev => ({ ...prev, total: payload.length, last_page: 1, current_page: 1 }));
        return;
      }

      if (typeof payload === 'object' && 'status' in payload) {
        if (payload.status === true) {
          setItems(payload.data || []);
          setPagination({
            current_page: payload.meta?.current_page ?? page,
            last_page: payload.meta?.last_page ?? 1,
            total: payload.meta?.total ?? (payload.data ? payload.data.length : 0),
            per_page: payload.meta?.per_page ?? pagination.per_page
          });
        } else {
          // status false -> treat as no data
          console.warn('ConfigService returned status false', payload);
          setItems([]);
          setPagination(prev => ({ ...prev, total: 0, last_page: 1 }));
        }
        return;
      }

      // Unexpected shape
      console.warn('Unexpected payload shape from ConfigService.getList', payload);
      setItems([]);
    } catch (error) {
      console.error('Lỗi khi lấy cấu hình:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.per_page]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchItems(pagination.current_page, searchTerm);
    }, 300);
    return () => clearTimeout(t);
  }, [fetchItems, pagination.current_page, searchTerm]);

  const handleAdd = () => {
    setEditMode(false);
    setFormData({ id: '', site_name: '', email: '', phone: '', hotline: '', address: '', status: 1 });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditMode(true);
    setFormData({
      id: item.id,
      site_name: item.site_name || '',
      email: item.email || '',
      phone: item.phone || '',
      hotline: item.hotline || '',
      address: item.address || '',
      status: Number(item.status ?? 1)
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic client validation
    if (!formData.site_name?.trim()) {
      alert('Tên website (site_name) là bắt buộc.');
      return;
    }
    if (!formData.email?.trim()) {
      alert('Email là bắt buộc.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        site_name: formData.site_name,
        email: formData.email,
        phone: formData.phone,
        hotline: formData.hotline,
        address: formData.address,
        status: formData.status
      };

      let res;
      if (editMode) {
        res = await ConfigService.update(formData.id, payload);
      } else {
        res = await ConfigService.create(payload);
      }

      console.debug('Config create/update result:', res);

      if (res && res.status) {
        alert(editMode ? 'Cập nhật thành công!' : 'Tạo cấu hình thành công!');
        setShowModal(false);
        // refresh list — after create, go to first page
        if (!editMode) {
          setPagination(prev => ({ ...prev, current_page: 1 }));
          fetchItems(1, searchTerm);
        } else {
          fetchItems(pagination.current_page, searchTerm);
        }
      } else {
        const errors = res?.errors;
        if (errors) {
          const first = Object.keys(errors)[0];
          alert(errors[first][0]);
        } else {
          alert(res?.message || 'Lỗi server.');
        }
      }
    } catch (error) {
      const err = error.response?.data;
      if (err?.errors) {
        const first = Object.keys(err.errors)[0];
        alert(err.errors[first][0]);
      } else {
        alert('Lỗi hệ thống.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa cấu hình này?')) return;
    try {
      const res = await ConfigService.delete(id);
      console.debug('Config delete result:', res);
      if (res && res.status) {
        alert('Đã xóa cấu hình');
        // if last item on page deleted, could adjust page - simple approach: refetch current page
        fetchItems(pagination.current_page, searchTerm);
      } else {
        alert(res?.message || 'Xóa thất bại');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi xóa.');
    }
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Settings</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Website Settings</h2>
            <div className="flex gap-3">
              <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> <span className="font-medium">Add Setting</span>
              </button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search site_name, email, phone, hotline or address..."
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Site Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hotline</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Address</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {items.map(it => (
                <tr key={it.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-gray-600">#{it.id}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{it.site_name}</td>
                  <td className="px-6 py-4 text-gray-600">{it.email}</td>
                  <td className="px-6 py-4 text-gray-600">{it.phone || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{it.hotline || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{it.address || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{Number(it.status) === 1 ? 'Active' : 'Inactive'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(it)} className="p-2 hover:bg-blue-50 rounded-lg group">
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
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
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No settings found</td>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editMode ? 'Edit Setting' : 'Add New Setting'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Site Name *</label>
                  <input type="text" name="site_name" value={formData.site_name} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Hotline</label>
                  <input type="text" name="hotline" value={formData.hotline} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full px-4 py-3 border rounded-lg resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <Save className="w-5 h-5" /> {editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, ChevronRight, X, Save, Layers } from 'lucide-react';
import TopicService from '../../../../services/TopicService'; // Đảm bảo bạn đã tạo service này

export default function TopicPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, total: 0, per_page: 10
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // Lọc theo trạng thái
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    status: 1
  });

  // --- Fetch Data ---
  const fetchItems = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (search) params.search = search;
      if (filterStatus !== '') params.status = filterStatus;

      const payload = await TopicService.getList(params); // Giả sử TopicService.getList trả về format tương tự PostService
      console.debug('TopicService.getList payload:', payload);

      if (!payload) {
        setItems([]);
        setPagination(prev => ({ ...prev, total: 0, last_page: 1, current_page: 1 }));
        return;
      }

      if (payload.status === true) {
        const list = payload.data || [];
        setItems(list);
        setPagination({
          current_page: payload.meta?.current_page ?? page,
          last_page: payload.meta?.last_page ?? 1,
          total: payload.meta?.total ?? (Array.isArray(list) ? list.length : 0),
          per_page: payload.meta?.per_page ?? pagination.per_page
        });
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy chủ đề:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, pagination.per_page]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchItems(pagination.current_page, searchTerm);
    }, 250);
    return () => clearTimeout(t);
  }, [fetchItems, pagination.current_page, searchTerm]);

  // --- Handlers ---
  const handleAdd = () => {
    setEditMode(false);
    setFormData({ 
      id: '', name: '', slug: '', 
      description: '', sort_order: 0, status: 1 
    });
    setShowModal(true);
  };

  const handleEdit = (topic) => {
    setEditMode(true);
    setFormData({
      id: topic.id,
      name: topic.name || '',
      slug: topic.slug || '',
      description: topic.description || '',
      sort_order: topic.sort_order ?? 0,
      status: Number(topic.status ?? 1)
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Với Topic, thường gửi JSON thay vì FormData vì không có file upload (trừ khi bạn muốn thêm icon)
      // Nhưng để nhất quán, ta vẫn có thể dùng object JSON
      const data = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        sort_order: formData.sort_order,
        status: formData.status
      };

      let response;
      if (editMode) {
        response = await TopicService.update(formData.id, data);
      } else {
        response = await TopicService.create(data);
      }

      const isSuccess = response?.status === true;

      if (isSuccess) {
        alert(editMode ? 'Cập nhật chủ đề thành công!' : 'Tạo chủ đề thành công!');
        setShowModal(false);
        
        // Reload list
        if (!editMode) {
          setPagination(prev => ({ ...prev, current_page: 1 }));
          fetchItems(1, '');
        } else {
          fetchItems(pagination.current_page, searchTerm);
        }
      } else {
        // Handle errors similar to PostPage
        const errors = response?.errors;
        if (errors) {
          const firstKey = Object.keys(errors)[0];
          alert(`Lỗi: ${errors[firstKey][0]}`);
        } else {
          alert(response?.message || 'Có lỗi xảy ra khi lưu chủ đề');
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Lỗi hệ thống khi lưu chủ đề');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa chủ đề này? Các bài viết thuộc chủ đề này có thể bị ảnh hưởng.')) return;
    
    setLoading(true);
    try {
      const res = await TopicService.delete(id);
      
      if (res && res.status === true) {
        alert('Đã xóa chủ đề thành công');
        fetchItems(pagination.current_page, searchTerm);
      } else {
        alert(res?.message || 'Xóa thất bại');
      }
    } catch (err) {
      console.error('Lỗi khi xóa chủ đề:', err);
      alert('Lỗi khi xóa chủ đề.');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Topics</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Topics</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Topics List</h2>
            <div className="flex gap-3">
              <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> <span className="font-medium">Add Topic</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name/description..."
                value={searchTerm}
                onChange={(e) => { 
                  setSearchTerm(e.target.value); 
                  setPagination(p => ({ ...p, current_page: 1 })); 
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            
            <button 
              onClick={() => fetchItems(1, searchTerm)} 
              className="px-3 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
              <div className="text-gray-600 dark:text-gray-300">Loading...</div>
            </div>
          )}

          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Description</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Sort Order</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {items.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-gray-900 dark:text-white">#{t.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{t.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{t.slug}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs truncate" title={t.description}>
                    {t.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">{t.sort_order}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      Number(t.status) === 1 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {Number(t.status) === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(t)} 
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)} 
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No topics found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {pagination.current_page} of {pagination.last_page} 
            {pagination.total > 0 && ` (Total: ${pagination.total})`}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => changePage(pagination.current_page - 1)} 
              disabled={pagination.current_page === 1} 
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Prev
            </button>
            <button 
              onClick={() => changePage(pagination.current_page + 1)} 
              disabled={pagination.current_page === pagination.last_page} 
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editMode ? 'Edit Topic' : 'Add New Topic'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Topic Name *
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="E.g., Coffee News, Promotions..."
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Slug
                  </label>
                  <input 
                    type="text" 
                    name="slug" 
                    value={formData.slug} 
                    onChange={handleChange} 
                    placeholder="Leave empty to auto-generate"
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows={3} 
                    placeholder="Brief description of the topic"
                    className="w-full px-4 py-3 border rounded-lg resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Sort Order
                    </label>
                    <input 
                      type="number" 
                      name="sort_order" 
                      value={formData.sort_order} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleChange} 
                      className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" /> 
                  {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus,
  Edit, Trash2, ChevronRight, X, Save
} from 'lucide-react';

import BannerService from '../../../../services/BannerService';

const IMAGE_BASE_URL = 'http://localhost:8000/storage/';

export default function BannerPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, total: 0, per_page: 10
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    image: null,
    link: '',
    position: '',
    sort_order: 0,
    description: '',
    status: 1
  });

  // normalize responses
  const normalize = (res) => res?.data ?? res;

  const fetchBanners = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await BannerService.getList({ page, limit: 10, search });
      const payload = normalize(res);
      if (payload && payload.status) {
        setBanners(payload.data || []);
        setPagination({
          current_page: payload.meta?.current_page ?? 1,
          last_page: payload.meta?.last_page ?? 1,
          total: payload.meta?.total ?? 0,
          per_page: payload.meta?.per_page ?? 10
        });
      } else if (Array.isArray(payload)) {
        setBanners(payload);
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchBanners(pagination.current_page, searchTerm);
    }, 400);
    return () => clearTimeout(t);
  }, [fetchBanners, pagination.current_page, searchTerm]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdd = () => {
    setEditMode(false);
    setImagePreview(null);
    setFormData({
      id: '', name: '', image: null, link: '', position: '', sort_order: 0, description: '', status: 1
    });
    setShowModal(true);
  };

  const handleEdit = (banner) => {
    setEditMode(true);
    const previewUrl = banner.image_url ? banner.image_url : (banner.image ? IMAGE_BASE_URL + banner.image : null);
    setImagePreview(previewUrl);
    setFormData({
      id: banner.id,
      name: banner.name,
      image: banner.image,
      link: banner.link || '',
      position: banner.position || '',
      sort_order: banner.sort_order || 0,
      description: banner.description || '',
      status: banner.status
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name || '');
      data.append('link', formData.link || '');
      data.append('position', formData.position || '');
      data.append('sort_order', String(formData.sort_order ?? 0));
      if (formData.description) data.append('description', formData.description);
      data.append('status', String(formData.status ?? 1));

      if (formData.image instanceof File) {
        data.append('image', formData.image);
      }

      let response;
      if (editMode) {
        response = await BannerService.update(formData.id, data);
      } else {
        response = await BannerService.create(data);
      }

      const resData = normalize(response);
      if (resData && resData.status) {
        alert(editMode ? 'Cập nhật banner thành công!' : 'Tạo banner thành công!');
        setShowModal(false);
        fetchBanners(pagination.current_page, searchTerm);
      } else {
        const errors = resData?.errors;
        if (errors) {
          const first = Object.keys(errors)[0];
          alert(errors[first][0]);
        } else {
          alert(resData?.message || 'Lỗi server.');
        }
      }
    } catch (error) {
      const errData = error.response?.data;
      if (errData?.errors) {
        const first = Object.keys(errData.errors)[0];
        alert(errData.errors[first][0]);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Lỗi hệ thống.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa banner này?')) return;
    try {
      const res = await BannerService.delete(id);
      const resData = normalize(res);
      if (resData && resData.status) {
        alert('Đã xóa banner!');
        fetchBanners(pagination.current_page, searchTerm);
      } else {
        alert(resData?.message || 'Xóa thất bại');
      }
    } catch (error) {
      console.error(error);
      alert('Không thể xóa banner này.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banners</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Banners</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Banner List</h2>
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> <span className="font-medium">Add Banner</span>
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, current_page: 1})); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Image</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {banners.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-gray-600">#{b.id}</td>
                  <td className="px-6 py-4">
                    <img
                      src={b.image_url || (b.image ? IMAGE_BASE_URL + b.image : 'https://via.placeholder.com/80')}
                      alt={b.name}
                      className="w-16 h-12 object-cover rounded bg-gray-100"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/80' }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{b.name}</div>
                    <div className="text-xs text-gray-500">{b.link}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{b.position || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${b.status == 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {b.status == 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(b)} className="p-2 hover:bg-blue-50 rounded-lg group">
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-2 hover:bg-red-50 rounded-lg group">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editMode ? 'Edit Banner' : 'Add New Banner'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6" encType="multipart/form-data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Banner Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Link</label>
                  <input type="text" name="link" value={formData.link} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Position</label>
                  <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="e.g. home_top" className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Sort Order</label>
                  <input type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <div className="w-24 h-16 border rounded overflow-hidden shrink-0 bg-gray-50">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input type="file" name="image" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-3 border rounded-lg resize-none" />
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
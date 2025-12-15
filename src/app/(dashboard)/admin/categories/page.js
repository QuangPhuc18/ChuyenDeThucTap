'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus,
  Edit, Trash2, ChevronRight, X, Save, FolderTree
} from 'lucide-react';

// Import Service
import CategoryService from '../../../../services/CategoryService';

// Cấu hình URL ảnh
const IMAGE_BASE_URL = 'http://localhost:8000/storage/';

export default function CategoryPage() {
  // --- STATE ---
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State phân trang
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  });

  const [searchTerm, setSearchTerm] = useState('');

  // State Modal & Form
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Preview ảnh
  const [imagePreview, setImagePreview] = useState(null);

  // Form Data khớp với DB Category
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    image: null, // File hoặc String
    parent_id: 0,
    sort_order: 0,
    description: '',
    status: 1
  });

  // --- API HANDLERS ---

  const fetchCategories = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await CategoryService.getList({
        page: page,
        limit: 10,
        search: search
      });

      if (data.data && data.data.status === undefined) {
        // In case axios returns raw response.data as data
        // but earlier code expected { status, data, meta }
      }

      // The API returns {status, message, data, meta}
      if (data.data && data.data.status === true) {
        // If you used httpAxios wrapper that returns response.data directly,
        // adapt accordingly. Here we attempt to support both shapes.
        const payload = data.data;
        setCategories(payload.data);
        setPagination({
          current_page: payload.meta.current_page,
          last_page: payload.meta.last_page,
          total: payload.meta.total,
          per_page: payload.meta.per_page
        });
      } else if (data && data.status) {
        // scenario when service returns response.data directly
        setCategories(data.data);
        setPagination({
          current_page: data.meta.current_page,
          last_page: data.meta.last_page,
          total: data.meta.total,
          per_page: data.meta.per_page
        });
      } else if (data && Array.isArray(data)) {
        // fallback: if service returned array
        setCategories(data);
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories(pagination.current_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchCategories, pagination.current_page, searchTerm]);

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('slug', formData.slug);
      data.append('parent_id', String(formData.parent_id));
      data.append('sort_order', String(formData.sort_order));
      if (formData.description) data.append('description', formData.description);
      data.append('status', String(formData.status));

      // Xử lý ảnh: Chỉ gửi nếu là File mới
      if (formData.image instanceof File) {
        data.append('image', formData.image);
      }

      let response;
      
      if (editMode) {
        // Do NOT append _method here; service will method-spoof if needed
        response = await CategoryService.update(formData.id, data);
      } else {
        response = await CategoryService.create(data);
      }

      // Handle different axios wrapper shapes:
      const resData = response.data ?? response;

      if (resData && resData.status) {
        alert(editMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        setShowModal(false);
        // Refresh list: go to first page if adding new item
        fetchCategories(pagination.current_page, searchTerm);
      } 
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData && errorData.errors) {
        const firstErrorKey = Object.keys(errorData.errors)[0];
        alert(`Lỗi: ${errorData.errors[firstErrorKey][0]}`);
      } else if (error.response?.data?.message) {
        alert(`Lỗi: ${error.response.data.message}`);
      } else {
        alert('Lỗi hệ thống.');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      const res = await CategoryService.delete(id);
      const resData = res.data ?? res;
      if (resData && resData.status) {
        alert('Đã xóa thành công!');
        fetchCategories(pagination.current_page, searchTerm);
      }
    } catch (error) {
      console.error('Lỗi xóa:', error);
      alert('Không thể xóa danh mục này.');
    }
  };

  // --- HELPER FUNCTIONS ---

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
      id: '', name: '', slug: '', image: null,
      parent_id: 0, sort_order: 0, description: '', status: 1
    });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setEditMode(true);
    
    // Hiển thị ảnh cũ
    const previewUrl = category.image_url 
      ? category.image_url 
      : (category.image ? IMAGE_BASE_URL + category.image : null);
    setImagePreview(previewUrl);

    setFormData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image, // Giữ tên ảnh cũ (string) hoặc File
      parent_id: category.parent_id || 0,
      sort_order: category.sort_order || 0,
      description: category.description || '',
      status: category.status
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

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = String(name || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  // --- RENDER ---
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Categories</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Categories List</h2>
            <div className="flex gap-3">
              <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> <span className="font-medium">Add Category</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, current_page: 1})); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Image</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Parent ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">#{item.id}</td>
                  <td className="px-6 py-4">
                    <img 
                      src={item.image_url || (item.image ? IMAGE_BASE_URL + item.image : 'https://via.placeholder.com/50')} 
                      alt={item.name} 
                      className="w-10 h-10 rounded object-cover bg-gray-100" 
                      onError={(e) => {e.target.src = 'https://via.placeholder.com/50'}} 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                    <div className="text-xs text-gray-500">{item.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {item.parent_id === 0 ? 'Root' : `ID: ${item.parent_id}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      Number(item.status) === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {Number(item.status) === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 hover:bg-blue-50 rounded-lg group">
                        <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg group">
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
           <div className="text-sm text-gray-500">
            Page {pagination.current_page} of {pagination.last_page}
           </div>
           <div className="flex gap-2">
            <button onClick={() => changePage(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button onClick={() => changePage(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
           </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editMode ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6" encType="multipart/form-data">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Tên danh mục */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Category Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleNameChange} required className="w-full px-4 py-3 border rounded-lg" />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Slug</label>
                  <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                {/* Parent ID */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Parent Category</label>
                  <select name="parent_id" value={formData.parent_id} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
                    <option value={0}>-- Root Category --</option>
                    {/* Hiển thị danh sách category để chọn làm cha, trừ chính nó khi edit */}
                    {categories
                      .filter(c => c.id !== formData.id) 
                      .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Sort Order</label>
                  <input type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg" />
                </div>

                {/* UPLOAD ẢNH */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Image</label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <div className="w-20 h-20 border rounded-lg overflow-hidden shrink-0 bg-gray-50">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input 
                      type="file" 
                      name="image" 
                      onChange={handleFileChange} 
                      accept="image/*"
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {/* Mô tả */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-3 border rounded-lg resize-none" />
                </div>

                {/* Status */}
                <div>
                   <label className="block text-sm font-semibold mb-2">Status</label>
                   <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                   </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border rounded-lg hover:bg-gray-50">Cancel</button>
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
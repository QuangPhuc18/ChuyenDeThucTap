'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, ChevronRight, X, Save } from 'lucide-react';
import PostService from '../../../../services/PostService';

const IMAGE_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000') + '/storage/';

const IMAGE_PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48" viewBox="0 0 80 48" fill="none">' +
  '<rect width="80" height="48" fill="%23E5E7EB"/>' +
  '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="10" fill="%23999">No image</text>' +
  '</svg>'
);

export default function PostPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, total: 0, per_page: 10
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    topic_id: '',
    title: '',
    slug: '',
    image: null,
    content: '',
    description: '',
    post_type: 'post',
    status: 1
  });

  const fetchItems = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.per_page };
      if (search) params.search = search;
      if (filterTopic) params.topic_id = filterTopic;
      if (filterType) params.post_type = filterType;

      const payload = await PostService.getList(params);
      console.debug('PostService.getList payload:', payload);

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

      if (payload.status === true) {
        const list = payload.data || [];
        setItems(list);
        setPagination({
          current_page: payload.meta?.current_page ?? page,
          last_page: payload.meta?.last_page ?? 1,
          total: payload.meta?.total ?? (Array.isArray(list) ? list.length : 0),
          per_page: payload.meta?.per_page ?? pagination.per_page
        });
        return;
      }

      if (payload.data && Array.isArray(payload.data)) {
        setItems(payload.data);
        setPagination({
          current_page: payload.meta?.current_page ?? page,
          last_page: payload.meta?.last_page ?? 1,
          total: payload.meta?.total ?? payload.data.length,
          per_page: payload.meta?.per_page ?? pagination.per_page
        });
        return;
      }

      console.warn('Unexpected payload shape:', payload);
      setItems([]);
      setPagination(prev => ({ ...prev, total: 0, last_page: 1 }));
    } catch (error) {
      console.error('Lỗi khi lấy bài viết:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterTopic, filterType, pagination.per_page]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchItems(pagination.current_page, searchTerm);
    }, 250);
    return () => clearTimeout(t);
  }, [fetchItems, pagination.current_page, searchTerm]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(url);
    }
  };

  const handleAdd = () => {
    setEditMode(false);
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setFormData({ 
      id: '', topic_id: '', title: '', slug: '', 
      image: null, content: '', description: '', 
      post_type: 'post', status: 1 
    });
    setShowModal(true);
  };

  const handleEdit = (post) => {
    setEditMode(true);
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    
    // Use image_url from response
    setImagePreview(post.image_url || IMAGE_PLACEHOLDER);
    
    setFormData({
      id: post.id,
      topic_id: post.topic_id || '',
      title: post.title || '',
      slug: post.slug || '',
      image: null, // Don't set old image as File object
      content: post.content || '',
      description: post.description || '',
      post_type: post.post_type || 'post',
      status: Number(post.status ?? 1)
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
      const data = new FormData();
      data.append('title', formData.title || '');
      data.append('slug', formData.slug || '');
      data.append('topic_id', String(formData.topic_id || ''));
      data.append('post_type', formData.post_type || 'post');
      data.append('description', formData.description || '');
      data.append('content', formData.content || '');
      data.append('status', String(formData.status ?? 1));
      
      // Only append image if user selected new file
      if (formData.image instanceof File) {
        data.append('image', formData.image);
      }

      let response;
      if (editMode) {
        response = await PostService.update(formData.id, data);
      } else {
        response = await PostService.create(data);
      }

      console.log('Submit response:', response);

      // Check if successful
      const isSuccess = response?.status === true;

      if (isSuccess) {
        alert(editMode ? 'Cập nhật thành công!' : 'Tạo bài viết thành công!');
        setShowModal(false);
        
        // Clean up
        if (imagePreview && imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        setFormData({
          id: '', topic_id: '', title: '', slug: '', 
          image: null, content: '', description: '', 
          post_type: 'post', status: 1
        });
        
        // Reload list
        if (!editMode) {
          setPagination(prev => ({ ...prev, current_page: 1 }));
          fetchItems(1, '');
        } else {
          fetchItems(pagination.current_page, searchTerm);
        }
      } else {
        // Handle errors
        const errors = response?.errors;
        if (errors) {
          const firstKey = Object.keys(errors)[0];
          alert(`Lỗi: ${errors[firstKey][0]}`);
        } else {
          alert(response?.message || 'Có lỗi xảy ra khi lưu bài viết');
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      
      const errData = err?.response?.data;
      if (errData?.errors) {
        const firstKey = Object.keys(errData.errors)[0];
        alert(`Lỗi: ${errData.errors[firstKey][0]}`);
      } else {
        alert(errData?.message || 'Lỗi hệ thống khi lưu bài viết');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    
    setLoading(true);
    try {
      const res = await PostService.delete(id);
      console.debug('delete result:', res);
      
      if (res && res.status === true) {
        alert('Đã xóa bài viết thành công');
        fetchItems(pagination.current_page, searchTerm);
      } else {
        alert(res?.message || 'Xóa thất bại');
      }
    } catch (err) {
      console.error('Lỗi khi xóa bài viết:', err);
      alert('Lỗi khi xóa bài viết.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Posts</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Posts</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Posts List</h2>
            <div className="flex gap-3">
              <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> <span className="font-medium">Add Post</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search title/content..."
                value={searchTerm}
                onChange={(e) => { 
                  setSearchTerm(e.target.value); 
                  setPagination(p => ({ ...p, current_page: 1 })); 
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <input 
              type="text" 
              placeholder="Filter by topic_id" 
              value={filterTopic} 
              onChange={(e) => setFilterTopic(e.target.value)} 
              className="px-3 py-2 border rounded w-40 dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
            />
            
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)} 
              className="px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">All types</option>
              <option value="post">Post</option>
              <option value="page">Page</option>
              <option value="news">News</option>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Image</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {items.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-gray-900 dark:text-white">#{p.id}</td>
                  <td className="px-6 py-4">
                    <img 
                      src={p.image_url || IMAGE_PLACEHOLDER} 
                      alt={p.title} 
                      className="w-20 h-12 object-cover rounded" 
                      onError={(e) => { e.currentTarget.src = IMAGE_PLACEHOLDER; }} 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{p.title}</div>
                    <div className="text-xs text-gray-500">{p.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{p.topic_id || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{p.post_type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      Number(p.status) === 1 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {Number(p.status) === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(p)} 
                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
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
                    No posts found
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editMode ? 'Edit Post' : 'Add New Post'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Title *
                  </label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
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
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Topic ID
                  </label>
                  <input 
                    type="number" 
                    name="topic_id" 
                    value={formData.topic_id} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Post Type
                  </label>
                  <select 
                    name="post_type" 
                    value={formData.post_type} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    <option value="post">Post</option>
                    <option value="page">Page</option>
                    <option value="news">News</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Image
                  </label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <div className="w-24 h-16 border rounded overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    <input 
                      type="file" 
                      name="image" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="block w-full text-sm text-gray-500 dark:text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        dark:file:bg-blue-900 dark:file:text-blue-300" 
                    />
                  </div>
                  {editMode && !formData.image && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to keep current image
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows={3} 
                    className="w-full px-4 py-3 border rounded-lg resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Content
                  </label>
                  <textarea 
                    name="content" 
                    value={formData.content} 
                    onChange={handleChange} 
                    rows={6} 
                    className="w-full px-4 py-3 border rounded-lg resize-y dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
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
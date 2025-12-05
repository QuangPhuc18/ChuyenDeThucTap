'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, Plus, SlidersHorizontal,
  Edit, Trash2, ChevronRight, X, Save, ChevronLeft
} from 'lucide-react';

// Cấu hình API URL gốc (Thay đổi port nếu backend của bạn khác)
const API_URL = 'http://localhost:8000/api/products';

export default function ProductsPage() {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State phân trang (Structure khớp với Laravel paginate)
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10
  });

  // State tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');

  // State Modal & Form
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    category_id: '',
    name: '',
    slug: '',
    thumbnail: '',
    content: '',
    description: '',
    price_buy: '', // Lưu ý: Backend mẫu của bạn dùng 'price', hãy chắc chắn mapping đúng field
    status: 1
  });

  // Mock Categories (Nếu có API categories thì nên fetch riêng)
  const categories = [
    { id: 1, name: 'Cà phê' },
    { id: 2, name: 'Trà' },
    { id: 3, name: 'Freeze' },
    { id: 4, name: 'Bánh ngọt' }
  ];

  // --- API HANDLERS ---

  // 1. Fetch Data (GET)
  const fetchProducts = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      // Tạo query params: ?page=1&limit=10&search=...
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search
      });

      const res = await fetch(`${API_URL}?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.status) {
        setProducts(data.data); // Laravel: $products->items()
        setPagination({
          current_page: data.meta.current_page,
          last_page: data.meta.last_page,
          total: data.meta.total,
          per_page: data.meta.per_page
        });
      } else {
        console.error('Lỗi lấy dữ liệu:', data.message);
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi fetch khi component mount hoặc khi page/search thay đổi
  useEffect(() => {
    // Debounce search để tránh gọi API liên tục khi gõ
    const timer = setTimeout(() => {
      fetchProducts(pagination.current_page, searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchProducts, pagination.current_page, searchTerm]);


  // 2. Submit (POST / PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mapping dữ liệu React -> Laravel (Lưu ý field name phải khớp backend nhận)
      const payload = {
        category_id: formData.category_id,
        name: formData.name,
        slug: formData.slug,
        thumbnail: formData.thumbnail,
        content: formData.content,
        description: formData.description,
        price_buy: Number(formData.price_buy), // Backend mẫu dùng 'price', frontend dùng 'price_buy'
        status: formData.status
      };

      let url = API_URL;
      let method = 'POST';

      if (editMode) {
        url = `${API_URL}/${formData.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer ...' // Thêm token nếu cần
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.status) {
        alert(editMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        setShowModal(false);
        fetchProducts(pagination.current_page, searchTerm); // Reload data
      } else {
        alert(`Lỗi: ${data.message || JSON.stringify(data.errors)}`);
      }
    } catch (error) {
      alert('Lỗi hệ thống khi lưu dữ liệu.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete (DELETE)
  const handleDeleteProduct = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.status) {
        alert('Đã xóa sản phẩm thành công!');
        // Reset về trang 1 nếu xóa hết item ở trang hiện tại (optional logic)
        fetchProducts(pagination.current_page, searchTerm);
      } else {
        alert('Không thể xóa sản phẩm.');
      }
    } catch (error) {
      console.error('Lỗi xóa:', error);
    }
  };

  // --- HELPER FUNCTIONS ---

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatPrice = (price) => {
    if (price === '' || price === null || price === undefined) return '-';
    return Number(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫';
  };

  const generateSlug = (name) => {
    return String(name || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  };

  const handleAddProduct = () => {
    setEditMode(false);
    setFormData({
      id: '', category_id: '', name: '', slug: '', thumbnail: '',
      content: '', description: '', price_buy: '', status: 1
    });
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditMode(true);
    // Backend trả về 'price', frontend đang dùng 'price_buy'. Cần map lại nếu API trả về khác.
    // Giả sử API trả về data giống hệt cấu trúc DB.
    setFormData({
      ...product,
      price_buy: product.price || product.price_buy, // Fallback
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, current_page: 1 })); // Reset về trang 1 khi tìm kiếm
  };

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  // --- RENDER ---
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Products</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Products List</h2>
            <div className="flex gap-3">
              <button onClick={handleAddProduct} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> <span className="font-medium">Add Product</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Created</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {products.length === 0 && !loading ? (
                <tr>
                   <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No products found.
                   </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">#{product.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.thumbnail || 'https://via.placeholder.com/50'} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white block">{product.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{product.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {categories.find(c => c.id === Number(product.category_id))?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {/* Xử lý hiển thị giá: Backend mẫu dùng 'price', UI của bạn dùng 'price_buy' */}
                      {formatPrice(product.price || product.price_buy)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        Number(product.status) === 1
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {Number(product.status) === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">{formatDate(product.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditProduct(product)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group">
                          <Edit className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group">
                          <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
           <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} entries)
           </div>
           <div className="flex gap-2">
              <button
                 onClick={() => changePage(pagination.current_page - 1)}
                 disabled={pagination.current_page === 1}
                 className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-white"
              >
                 Previous
              </button>
              <button
                 onClick={() => changePage(pagination.current_page + 1)}
                 disabled={pagination.current_page === pagination.last_page}
                 className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-white"
              >
                 Next
              </button>
           </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editMode ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                  <select name="category_id" value={formData.category_id} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg dark:text-white">
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleNameChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Slug</label>
                  <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price (VNĐ) *</label>
                  <input type="number" name="price_buy" value={formData.price_buy} onChange={handleChange} required min="0" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg dark:text-white" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Thumbnail URL *</label>
                  <input type="url" name="thumbnail" value={formData.thumbnail} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg dark:text-white" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                  <input type="text" name="description" value={formData.description} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg dark:text-white" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content</label>
                  <textarea name="content" value={formData.content} onChange={handleChange} rows={4} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg dark:text-white resize-none" />
                </div>

                <div>
                   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                   <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg dark:text-white">
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                   </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800">Cancel</button>
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
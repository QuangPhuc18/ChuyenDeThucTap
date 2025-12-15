'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus,
  Edit, Trash2, ChevronRight, X, Save
} from 'lucide-react';

import UserService from '../../../../services/UserService';

const IMAGE_BASE_URL = 'http://localhost:8000/storage/';

export default function UserPage() {
  // --- STATE ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [pagination, setPagination] = useState({
    current_page: 1, last_page: 1, total: 0, per_page: 10
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    roles: 'customer',
    avatar: null,
    status: 1
  });

  // Helper to normalize service response shapes
  const normalize = (res) => {
    // If service returned axios response, res.data exists
    // If service returned response.data already, then res is that payload
    return res?.data ?? res;
  };

  // --- API HANDLERS ---
  const fetchUsers = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await UserService.getList({ page, limit: 10, search });
      const payload = normalize(res);

      if (payload && payload.status) {
        setUsers(payload.data || []);
        setPagination({
          current_page: payload.meta?.current_page ?? 1,
          last_page: payload.meta?.last_page ?? 1,
          total: payload.meta?.total ?? 0,
          per_page: payload.meta?.per_page ?? 10
        });
      } else if (Array.isArray(payload)) {
        // fallback: service returned array
        setUsers(payload);
        setPagination(prev => ({ ...prev, total: payload.length }));
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(pagination.current_page, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchUsers, pagination.current_page, searchTerm]);

  // --- SUBMIT ---
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name || '');
      data.append('email', formData.email || '');
      data.append('phone', formData.phone || '');
      data.append('username', formData.username || '');
      data.append('roles', formData.roles || 'customer');
      data.append('status', String(formData.status ?? 1));

      // Chỉ gửi password nếu có nhập
      if (formData.password) {
        data.append('password', formData.password);
      }

      // Chỉ gửi avatar nếu user có chọn file mới (kiểu File object)
      if (formData.avatar instanceof File) {
        data.append('avatar', formData.avatar);
      }

      let response;
      
      // GỌI API
      if (editMode) {
        // Lưu ý: Trong UserService.update phải có logic thêm: data.append('_method', 'PUT')
        response = await UserService.update(formData.id, data);
      } else {
        response = await UserService.create(data);
      }

      // XỬ LÝ KẾT QUẢ TRẢ VỀ
      // Giả sử hàm normalize lấy ra data sạch
      // (Nếu UserService trả về trực tiếp response của axios thì resData = response.data)
      const resData = response.data ? response.data : response; 

      if (resData && resData.status) {
        alert(editMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        setShowModal(false);
        fetchUsers(pagination.current_page, searchTerm);
      } else {
        // Trường hợp API trả về 200 nhưng logic báo lỗi (status: false)
        alert(resData?.message || 'Lỗi server khi lưu user.');
      }

    } catch (error) {
      // --- KHU VỰC DEBUG LỖI 422 ---
      if (error.response && error.response.status === 422) {
        console.log("🔥 CHI TIẾT LỖI VALIDATION TỪ LARAVEL:", error.response.data.errors);
        
        // Hiển thị lỗi đầu tiên lên alert cho người dùng thấy
        const errorData = error.response.data;
        if (errorData.errors) {
             const firstKey = Object.keys(errorData.errors)[0];
             alert(`Lỗi dữ liệu: ${errorData.errors[firstKey][0]}`);
        } else {
             alert(`Lỗi: ${errorData.message}`);
        }
      } 
      // --- CÁC LỖI KHÁC ---
      else if (error.response && error.response.data && error.response.data.message) {
         alert(`Lỗi: ${error.response.data.message}`);
      } else {
         console.error(error);
         alert('Lỗi hệ thống hoặc mất kết nối.');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa user này?')) return;
    try {
      const res = await UserService.delete(id);
      const resData = normalize(res);
      if (resData && resData.status) {
        alert('Đã xóa thành công!');
        fetchUsers(pagination.current_page, searchTerm);
      } else {
        alert(resData?.message || 'Xóa thất bại.');
      }
    } catch (error) {
      alert('Không thể xóa user này.');
      console.error(error);
    }
  };

  // --- HELPER ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdd = () => {
    setEditMode(false);
    setImagePreview(null);
    setFormData({
      id: '', name: '', email: '', phone: '', username: '',
      password: '', roles: 'customer', avatar: null, status: 1
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditMode(true);
    const previewUrl = user.avatar_url 
      ? user.avatar_url 
      : (user.avatar ? IMAGE_BASE_URL + user.avatar : null);
    setImagePreview(previewUrl);

    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      password: '', // Để trống khi edit, nhập mới mới đổi
      roles: user.roles,
      avatar: user.avatar,
      status: user.status
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>Home</span> <ChevronRight className="w-4 h-4" /> <span>Users</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">User List</h2>
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> <span className="font-medium">Add User</span>
            </button>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({...p, current_page: 1})); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">Loading...</div>}
          
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Avatar</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Info</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <img 
                      src={item.avatar_url || 'https://via.placeholder.com/50'} 
                      alt={item.name} 
                      className="w-10 h-10 rounded-full object-cover bg-gray-100" 
                      onError={(e) => {e.target.src = 'https://via.placeholder.com/50'}} 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-xs text-gray-500">@{item.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{item.email}</div>
                    <div className="text-xs text-gray-500">{item.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${item.roles === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {item.roles}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${item.status == 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.status == 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t dark:border-gray-700 flex justify-between">
           <div className="text-sm text-gray-500">Page {pagination.current_page} of {pagination.last_page}</div>
           <div className="flex gap-2">
             <button onClick={() => changePage(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
             <button onClick={() => changePage(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
           </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-6 py-4 flex justify-between z-10">
              <h2 className="text-2xl font-bold dark:text-white">{editMode ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Username *</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone *</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Password {editMode && '(Leave blank to keep current)'}</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editMode} className="w-full px-4 py-3 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Role</label>
                  <select name="roles" value={formData.roles} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg">
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                {/* Avatar */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Avatar</label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <div className="w-16 h-16 border rounded-full overflow-hidden shrink-0">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input type="file" name="avatar" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
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
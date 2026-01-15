'use client';

import { useState, useEffect } from 'react';
import MenuService from '@/services/MenuService';
import { 
  Plus, Edit, Trash2, Save, X, Loader2, 
  ArrowUpDown, Link as LinkIcon, Layers 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function MenuManager() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    type: 'custom',       // custom, category, page...
    position: 'mainmenu', // mainmenu, footermenu
    parent_id: 0,
    sort_order: 0,
    status: 1
  });

  // --- 1. Fetch Data ---
  const fetchMenus = async () => {
    setLoading(true);
    try {
      const res = await MenuService.getList(); // Lấy toàn bộ menu
      if (res.status) {
        setMenus(res.data);
      }
    } catch (error) {
      toast.error("Lỗi tải danh sách menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // --- 2. Handle Form ---
  const resetForm = () => {
    setFormData({
      name: '',
      link: '',
      type: 'custom',
      position: 'mainmenu',
      parent_id: 0,
      sort_order: 0,
      status: 1
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (menu) => {
    setFormData({
      name: menu.name,
      link: menu.link,
      type: menu.type,
      position: menu.position,
      parent_id: menu.parent_id,
      sort_order: menu.sort_order,
      status: menu.status
    });
    setIsEditing(true);
    setEditId(menu.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate cơ bản
    if (!formData.name || !formData.link) {
      toast.error("Tên menu và đường dẫn không được để trống!");
      return;
    }

    try {
      let res;
      if (isEditing) {
        res = await MenuService.update(editId, formData);
      } else {
        res = await MenuService.create(formData);
      }

      if (res.status) {
        toast.success(res.message);
        setShowModal(false);
        fetchMenus(); // Reload lại danh sách
        resetForm();
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Lỗi kết nối server");
    }
  };

  // --- 3. Handle Delete ---
  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa menu này không?")) {
      try {
        const res = await MenuService.delete(id);
        if (res.status) {
          toast.success(res.message);
          fetchMenus();
        } else {
          toast.error(res.message);
        }
      } catch (error) {
        toast.error("Lỗi khi xóa");
      }
    }
  };

  // Helper hiển thị badge trạng thái
  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {status === 1 ? 'Hiển thị' : 'Ẩn'}
    </span>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="text-blue-600" /> Quản Lý Menu
          </h1>
          <p className="text-gray-500 text-sm">Quản lý thanh điều hướng và menu chân trang</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} /> Thêm Menu
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Tên Menu</th>
                  <th className="px-6 py-4">Đường dẫn (Link)</th>
                  <th className="px-6 py-4">Vị trí</th>
                  <th className="px-6 py-4 text-center">Thứ tự</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {menus.length > 0 ? (
                  menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {menu.name}
                        {menu.parent_id > 0 && <span className="ml-2 text-xs text-gray-400">(Con)</span>}
                      </td>
                      <td className="px-6 py-4 text-blue-600 truncate max-w-xs">{menu.link}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
                          {menu.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">{menu.sort_order}</td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={menu.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(menu)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded transition" title="Sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(menu.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition" title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                      Chưa có menu nào. Hãy thêm mới!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                {isEditing ? 'Cập Nhật Menu' : 'Thêm Menu Mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Tên Menu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Menu <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ví dụ: Trang chủ"
                />
              </div>

              {/* Đường dẫn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn (Link) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    value={formData.link}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="/san-pham hoặc https://google.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Vị trí */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                  <select 
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="mainmenu">Main Menu (Header)</option>
                    <option value="footermenu">Footer Menu</option>
                  </select>
                </div>

                {/* Loại Menu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="custom">Tùy chỉnh (Custom)</option>
                    <option value="category">Danh mục (Category)</option>
                    <option value="page">Trang đơn (Page)</option>
                    <option value="topic">Chủ đề (Topic)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Thứ tự */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự hiển thị</label>
                  <input 
                    type="number" 
                    value={formData.sort_order}
                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* ID Cha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Menu Cha (0 là gốc)</label>
                  <input 
                    type="number" 
                    value={formData.parent_id}
                    onChange={(e) => setFormData({...formData, parent_id: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Trạng thái */}
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="status"
                  checked={formData.status === 1}
                  onChange={(e) => setFormData({...formData, status: e.target.checked ? 1 : 0})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="status" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                  Kích hoạt hiển thị
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition font-medium flex items-center gap-2"
                >
                  <Save size={18} /> Lưu Menu
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
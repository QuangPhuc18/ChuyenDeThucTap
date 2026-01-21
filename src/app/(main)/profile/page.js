'use client'

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ShoppingBag, Camera, LogOut, Package, Trash2, Edit2, Save, X, Minus, Plus, Search } from 'lucide-react';
import UserService from '@/services/UserService';

// --- CẤU HÌNH ---
const API_BASE_URL = 'http://127.0.0.1:8000';

const AVATAR_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150" fill="none">' +
      '<rect width="150" height="150" rx="75" fill="%23F3F4F6"/>' +
      '<text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%239CA3AF">Avatar</text>' +
      '</svg>'
  );

// --- HELPERS ---

const getImageUrl = (product) => {
  const path = product?.thumbnail || product?.image;
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^\//, '').replace(/^public\//, '').replace(/^storage\//, '');
  return `${API_BASE_URL}/storage/${cleanPath}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency:  'VND' }).format(amount);
};

const getOrderItems = (order) =>
  order?.order_details || order?.details || order?.order_items || order?.items || [];

const calcTotal = (order) => {
  if (order?.total_money != null && order.total_money > 0) {
    return Number(order.total_money);
  }
  if (order?.total_amount != null && order.total_amount > 0) {
    return Number(order.total_amount);
  }

  const items = getOrderItems(order);
  if (items.length === 0) return 0;

  const total = items.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || item.quantity || 1);
    const discount = Number(item.discount || 0);
    return sum + (price * qty - discount);
  }, 0);

  return total;
};

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  
  // State cho Form thông tin cá nhân
  const [formData, setFormData] = useState({ name: '', email: '', phone:  '', address: '', avatar: null });
  const [passData, setPassData] = useState({ current_password: '', new_password:  '', new_password_confirmation: '' });
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // State cho chức năng Sửa Đơn Hàng 
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editFormData, setEditFormData] = useState({ address: '', items: [] });

  // State MỚI cho chức năng Tìm kiếm Đơn hàng
  const [orderSearchTerm, setOrderSearchTerm] = useState('');

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null), []);

  useEffect(() => {
    const init = async () => {
      if (! token) { router.push('/auth/login'); return; }
      setLoading(true);
      try {
        const profile = await UserService.getProfile();
        if (profile?.data) {
          setUser(profile.data);
          setFormData({
            name: profile.data.name || '',
            email: profile.data.email || '',
            phone: profile.data.phone || '',
            address: profile.data.address || '',
            avatar: null,
          });
          
          const path = profile.data.avatar;
          const avtUrl = path ?  (path.startsWith('http') ? path : `${API_BASE_URL}/storage/${path.replace('public/', '')}`) : null;
          setPreviewAvatar(avtUrl || AVATAR_PLACEHOLDER);
        } else { throw new Error('No profile data'); }

        const ordersRes = await UserService.getMyOrders();
        if (ordersRes?.status) {
          const sortedOrders = (ordersRes.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setOrders(sortedOrders);
        }
      } catch (err) {
        console.error(err);
        router.push('/auth/login');
      } finally { setLoading(false); }
    };
    init();
  }, [router, token]);

  // --- LOGIC CẬP NHẬT USER ---
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('phone', formData.phone);
      fd.append('address', formData.address || '');
      if (formData.avatar instanceof File) fd.append('avatar', formData.avatar);

      const res = await UserService.updateProfile(fd);
      if (res?.status) {
        alert('Cập nhật thông tin thành công!');
        if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(res.data));
        
        const path = res.data.avatar;
        const url = path ? (path.startsWith('http') ? path : `${API_BASE_URL}/storage/${path.replace('public/', '')}`) : null;
        setPreviewAvatar(url || AVATAR_PLACEHOLDER);
      } else { alert(res?.message || 'Không thể cập nhật'); }
    } catch (error) { alert('Lỗi cập nhật'); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.new_password !== passData.new_password_confirmation) { alert('Mật khẩu xác nhận không khớp'); return; }
    try {
      const res = await UserService.changePassword(passData);
      if (res?.status) {
        alert('Đổi mật khẩu thành công!');
        setPassData({ current_password: '', new_password: '', new_password_confirmation: '' });
      } else { alert(res?.message || 'Đổi mật khẩu thất bại'); }
    } catch (error) { alert('Lỗi đổi mật khẩu'); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewAvatar && previewAvatar.startsWith('blob:')) URL.revokeObjectURL(previewAvatar);
      setFormData({ ...formData, avatar: file });
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleLogout = async () => {
    await UserService.logout();
    router.push('/auth/login');
  };

  // --- LOGIC ĐƠN HÀNG (CANCEL & HIDE) ---
  const handleCancelOrder = async (orderId) => {
    if (!confirm('Bạn chắc chắn muốn hủy đơn hàng này? ')) return;
    try {
      const res = await UserService.cancelOrder(orderId);
      if (res?.status) {
        alert('Đã hủy đơn hàng');
        // Refresh orders
        const orderRes = await UserService.getMyOrders();
        if (orderRes?.status) setOrders(orderRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } else { alert(res?.message || 'Không thể hủy đơn hàng'); }
    } catch (error) { alert('Không thể hủy đơn hàng này. '); }
  };

  const handleHideOrder = (orderId) => {
    if (confirm('Xóa đơn hàng này khỏi danh sách? (Dữ liệu vẫn lưu trong hệ thống)')) {
      setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
    }
  };

  // --- LOGIC SỬA ĐƠN HÀNG ---
  const handleStartEdit = (order) => {
    setEditingOrderId(order.id);
    const items = getOrderItems(order).map(item => ({
      ...item,
      qty: Number(item.qty || item.quantity || 1)
    }));
    setEditFormData({
      address: order.address || user.address || '',
      items: items
    });
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditFormData({ address: '', items: [] });
  };

  const handleQuantityChange = (index, change) => {
    const newItems = [...editFormData.items];
    const currentQty = newItems[index].qty;
    const newQty = currentQty + change;
    if (newQty < 1) return;
    newItems[index].qty = newQty;
    setEditFormData({ ...editFormData, items: newItems });
  };

  const handleSaveOrder = async (orderId) => {
    if (!confirm('Lưu thay đổi cho đơn hàng này?')) return;
    try {
      const payload = {
        address: editFormData.address,
        items: editFormData.items.map(i => ({
          product_id: i.product_id,
          qty: i.qty
        }))
      };
      const res = await UserService.updateOrder(orderId, payload); 
      if (res?.status) {
        alert('Cập nhật đơn hàng thành công!');
        setEditingOrderId(null);
        const orderRes = await UserService.getMyOrders();
        if (orderRes?.status) setOrders(orderRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } else {
        alert(res?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi cập nhật đơn hàng.');
    }
  };

  // --- LOGIC LỌC ĐƠN HÀNG (MỚI) ---
  const filteredOrders = orders.filter(order => {
      const term = orderSearchTerm.toLowerCase();
      // Tìm theo ID
      if (String(order.id).includes(term)) return true;
      // Tìm theo tên sản phẩm
      const items = getOrderItems(order);
      const hasProduct = items.some(item => {
          const pName = item.product?.name || item.name || '';
          return pName.toLowerCase().includes(term);
      });
      if (hasProduct) return true;
      // Tìm theo trạng thái
      const statusText = order.status == 1 ? 'chờ xác nhận' : order.status == 0 ? 'đã hủy' : 'hoàn thành';
      if (statusText.includes(term)) return true;

      return false;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải hồ sơ...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header Profile */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hồ sơ thành viên</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý thông tin cá nhân và đơn hàng</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* SIDEBAR */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6 text-center border-b border-gray-100">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img
                    src={previewAvatar || AVATAR_PLACEHOLDER}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-4 border-amber-100"
                    onError={(e) => { e.currentTarget.src = AVATAR_PLACEHOLDER; }}
                  />
                  <label className="absolute bottom-0 right-0 bg-amber-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-amber-700 transition">
                    <Camera size={14} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                <h3 className="font-bold text-gray-800">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <nav className="p-2">
                {['info', 'orders', 'password'].map((tab) => {
                  const icon = tab === 'info' ? <User size={18} /> : tab === 'orders' ? <ShoppingBag size={18} /> : <Lock size={18} />;
                  const label = tab === 'info' ?  'Thông tin tài khoản' : tab === 'orders' ? 'Lịch sử đơn hàng' : 'Đổi mật khẩu';
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${
                        activeTab === tab ?  'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {icon} {label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6 min-h-[400px] border border-gray-100">
              
              {/* TAB: INFO */}
              {activeTab === 'info' && (
                <form onSubmit={handleUpdateInfo} className="space-y-4 max-w-lg">
                  <h2 className="text-xl font-bold mb-4">Cập nhật thông tin</h2>
                  {['name', 'email', 'phone', 'address'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field === 'name' ?  'Họ tên' : field === 'email' ? 'Email' : field === 'phone' ? 'Số điện thoại' : 'Địa chỉ'}
                      </label>
                      <input
                        type={field === 'email' ? 'email' : 'text'}
                        value={formData[field]}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-200 outline-none"
                        required={field !== 'address'}
                        placeholder={field === 'address' ? 'Nhập địa chỉ giao hàng mặc định' : ''}
                      />
                    </div>
                  ))}
                  <button type="submit" className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition">
                    Lưu thay đổi
                  </button>
                </form>
              )}

              {/* TAB: PASSWORD */}
              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                  <h2 className="text-xl font-bold mb-4">Đổi mật khẩu</h2>
                  {[
                    { key: 'current_password', label: 'Mật khẩu hiện tại' },
                    { key: 'new_password', label: 'Mật khẩu mới' },
                    { key: 'new_password_confirmation', label: 'Xác nhận mật khẩu mới' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                      <input
                        type="password"
                        value={passData[f.key]}
                        onChange={(e) => setPassData({ ...passData, [f.key]: e.target.value })}
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-200 outline-none"
                        required
                      />
                    </div>
                  ))}
                  <button type="submit" className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition">
                    Đổi mật khẩu
                  </button>
                </form>
              )}

              {/* TAB: ORDERS */}
              {activeTab === 'orders' && (
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">Lịch sử đơn hàng</h2>
                    
                    {/* INPUT TÌM KIẾM ĐƠN HÀNG (MỚI) */}
                    <div className="relative w-full md:w-64">
                        <input 
                            type="text" 
                            placeholder="Tìm theo ID, tên sp..." 
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200"
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        {orderSearchTerm && (
                            <button 
                                onClick={() => setOrderSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-4">
                      {filteredOrders.length === orders.length 
                        ? `Tổng: ${orders.length} đơn` 
                        : `Tìm thấy ${filteredOrders.length} đơn phù hợp`
                      }
                  </div>
                  
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">
                          {orderSearchTerm ? 'Không tìm thấy đơn hàng nào phù hợp.' : 'Bạn chưa có đơn hàng nào.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => {
                        const isEditing = editingOrderId === order.id;
                        const items = isEditing ? editFormData.items : getOrderItems(order);
                        
                        const totalAmount = isEditing 
                            ? items.reduce((sum, i) => sum + (Number(i.price) * Number(i.qty) - Number(i.discount||0)), 0)
                            : calcTotal(order);

                        return (
                          <div key={order.id} className={`border rounded-xl p-4 transition bg-gray-50 group ${isEditing ? 'border-amber-400 ring-1 ring-amber-400 bg-white' : 'hover:border-amber-200'}`}>
                            {/* Header Order */}
                            <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-300 pb-2">
                              <div>
                                <span className="font-bold text-gray-800">Đơn hàng #{order.id}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {new Date(order.created_at).toLocaleDateString('vi-VN', { 
                                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                                
                                {!isEditing && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        📍 {order.address || 'Chưa cập nhật địa chỉ'}
                                    </p>
                                )}

                                {isEditing && (
                                    <div className="mt-2">
                                        <label className="text-xs font-semibold text-gray-700 block mb-1">Địa chỉ nhận hàng:</label>
                                        <input 
                                            type="text" 
                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                                            value={editFormData.address}
                                            onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                                        />
                                    </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <button 
                                            onClick={() => handleSaveOrder(order.id)}
                                            className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition"
                                        >
                                            <Save size={14} /> Lưu
                                        </button>
                                        <button 
                                            onClick={handleCancelEdit}
                                            className="flex items-center gap-1 text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 transition"
                                        >
                                            <X size={14} /> Hủy
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                          ${order.status == 1 ? 'bg-yellow-100 text-yellow-700' 
                                          : order.status == 0 ? 'bg-red-100 text-red-700' 
                                          : 'bg-green-100 text-green-700'}`}
                                        >
                                          {order.status == 1 ? 'Chờ xác nhận' : order.status == 0 ? 'Đã hủy' : 'Hoàn thành'}
                                        </span>
                                        
                                        {order.status == 1 && (
                                          <>
                                            <button 
                                                onClick={() => handleStartEdit(order)}
                                                className="text-xs text-blue-600 hover:underline border border-blue-200 px-2 py-1 rounded bg-white hover:bg-blue-50 transition flex items-center gap-1"
                                            >
                                                <Edit2 size={12} /> Sửa
                                            </button>

                                            <button 
                                              onClick={() => handleCancelOrder(order.id)} 
                                              className="text-xs text-red-600 hover:underline border border-red-200 px-2 py-1 rounded bg-white hover:bg-red-50 transition"
                                            >
                                              Hủy đơn
                                            </button>
                                          </>
                                        )}

                                        <button 
                                          onClick={() => handleHideOrder(order.id)} 
                                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                          title="Xóa khỏi danh sách"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                              </div>
                            </div>

                            {/* Chi tiết sản phẩm */}
                            <div className="space-y-3 mb-3">
                              {items.map((item, index) => {
                                const product = item.product;
                                const imageUrl = getImageUrl(product);
                                const productName = product?.name || item.name || 'Sản phẩm';
                                const itemPrice = Number(item.price || 0);
                                const itemQty = Number(item.qty || item.quantity || 1);
                                const itemSubtotal = itemPrice * itemQty;

                                return (
                                  <div key={index} className="flex gap-3 items-center">
                                    <div className="w-14 h-14 border border-gray-200 rounded-md overflow-hidden bg-white flex-shrink-0">
                                      {imageUrl ? (
                                        <img 
                                          src={imageUrl} 
                                          alt={productName} 
                                          className="w-full h-full object-cover"
                                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                        />
                                      ) : null}
                                      <div 
                                        className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400" 
                                        style={{display: imageUrl ? 'none' : 'flex'}}
                                      >
                                        <Package size={20}/>
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-800 line-clamp-2">{productName}</h4>
                                      {item.size && <p className="text-xs text-gray-500 mt-0.5">Size: {item.size}</p>}
                                      
                                      <div className="flex justify-between items-center mt-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-600">{formatCurrency(itemPrice)}</span>
                                          
                                          {!isEditing ? (
                                              <>
                                                <span className="text-xs text-gray-400">×</span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{itemQty}</span>
                                              </>
                                          ) : (
                                              <div className="flex items-center ml-2 border border-gray-300 rounded bg-white">
                                                  <button 
                                                    type="button"
                                                    onClick={() => handleQuantityChange(index, -1)}
                                                    className="px-2 py-0.5 hover:bg-gray-100 text-gray-600"
                                                  >
                                                    <Minus size={10} />
                                                  </button>
                                                  <span className="px-2 text-xs font-semibold select-none">{itemQty}</span>
                                                  <button 
                                                    type="button"
                                                    onClick={() => handleQuantityChange(index, 1)}
                                                    className="px-2 py-0.5 hover:bg-gray-100 text-gray-600"
                                                  >
                                                    <Plus size={10} />
                                                  </button>
                                              </div>
                                          )}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">
                                          {formatCurrency(itemSubtotal)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Footer Tổng tiền */}
                            <div className="flex justify-between items-center border-t border-dashed border-gray-300 pt-3">
                              <span className="text-sm text-gray-600">
                                Tổng cộng ({items.length} sản phẩm):
                              </span>
                              <span className="font-bold text-amber-600 text-lg">
                                {formatCurrency(totalAmount)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
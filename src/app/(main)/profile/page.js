'use client'

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ShoppingBag, Camera, LogOut } from 'lucide-react';
import UserService from '@/services/UserService';

const IMAGE_BASE_URL = 'http://127.0.0.1:8000/storage/';
const AVATAR_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150" fill="none">' +
      '<rect width="150" height="150" rx="75" fill="%23F3F4F6"/>' +
      '<text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%239CA3AF">Avatar</text>' +
      '</svg>'
  );

// Helpers để lấy items và tính tổng
const getOrderItems = (order) =>
  order?.order_details || order?.details || order?.order_items || order?.items || [];

const calcTotal = (order) => {
  if (order?.total_amount != null) return Number(order.total_amount);
  if (order?.total_money != null) return Number(order.total_money);
  const items = getOrderItems(order);
  return items.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || 0), 0);
};

const countItems = (order) => getOrderItems(order).length;

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', avatar: null });
  const [passData, setPassData] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [previewAvatar, setPreviewAvatar] = useState(null);

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null), []);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        router.push('/auth/login');
        return;
      }
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
          const avtUrl = profile.data.avatar_url || (profile.data.avatar ? IMAGE_BASE_URL + profile.data.avatar : null);
          setPreviewAvatar(avtUrl || AVATAR_PLACEHOLDER);
        } else {
          throw new Error('No profile data');
        }

        const ordersRes = await UserService.getMyOrders();
        if (ordersRes?.status) setOrders(ordersRes.data || []);
      } catch (err) {
        console.error(err);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, token]);

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
        const avtUrl = res.data.avatar_url || (res.data.avatar ? IMAGE_BASE_URL + res.data.avatar : null);
        setPreviewAvatar(avtUrl || AVATAR_PLACEHOLDER);
      } else {
        alert(res?.message || 'Không thể cập nhật');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi cập nhật: ' + (error?.message || 'Vui lòng kiểm tra lại.'));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.new_password !== passData.new_password_confirmation) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      const res = await UserService.changePassword(passData);
      if (res?.status) {
        alert('Đổi mật khẩu thành công!');
        setPassData({ current_password: '', new_password: '', new_password_confirmation: '' });
      } else {
        alert(res?.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      const msg = error?.errors ? Object.values(error.errors)[0][0] : error?.message;
      alert('Lỗi: ' + msg);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return;
    try {
      const res = await UserService.cancelOrder(orderId);
      if (res?.status) {
        alert('Đã hủy đơn hàng');
        const orderRes = await UserService.getMyOrders();
        if (orderRes?.status) setOrders(orderRes.data || []);
      } else {
        alert(res?.message || 'Không thể hủy đơn hàng');
      }
    } catch (error) {
      alert('Không thể hủy đơn hàng này.');
    }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Đang tải hồ sơ...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-5xl">
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
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6 text-center border-b border-gray-100">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <img
                    src={previewAvatar || AVATAR_PLACEHOLDER}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-4 border-amber-100"
                    onError={(e) => {
                      e.currentTarget.src = AVATAR_PLACEHOLDER;
                    }}
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
                  const icon =
                    tab === 'info' ? <User size={18} /> : tab === 'orders' ? <ShoppingBag size={18} /> : <Lock size={18} />;
                  const label =
                    tab === 'info' ? 'Thông tin tài khoản' : tab === 'orders' ? 'Lịch sử đơn hàng' : 'Đổi mật khẩu';
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${
                        activeTab === tab ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {icon} {label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6 min-h-[400px] border border-gray-100">
              {activeTab === 'info' && (
                <form onSubmit={handleUpdateInfo} className="space-y-4 max-w-lg">
                  <h2 className="text-xl font-bold mb-4">Cập nhật thông tin</h2>
                  {['name', 'email', 'phone', 'address'].map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field === 'name'
                          ? 'Họ tên'
                          : field === 'email'
                          ? 'Email'
                          : field === 'phone'
                          ? 'Số điện thoại'
                          : 'Địa chỉ'}
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

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Lịch sử đơn hàng</h2>
                  {orders.length === 0 ? (
                    <p className="text-gray-500">Bạn chưa có đơn hàng nào.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-xl p-4 hover:border-amber-200 transition bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-bold text-gray-800">#{order.id}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {new Date(order.created_at).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium 
                                ${
                                  order.status == 1
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : order.status == 0
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {order.status == 1 ? 'Chờ xác nhận' : order.status == 0 ? 'Đã hủy' : 'Thành công'}
                              </span>
                              {order.status == 1 && (
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="text-xs text-red-600 hover:underline border border-red-200 px-2 py-1 rounded bg-white"
                                >
                                  Hủy đơn
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Tổng tiền:{' '}
                            <span className="font-bold text-amber-600">
                              {new Intl.NumberFormat('vi-VN').format(calcTotal(order))}đ
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {countItems(order)} sản phẩm...
                          </div>
                        </div>
                      ))}
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
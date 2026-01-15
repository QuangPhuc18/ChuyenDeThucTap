'use client';

import { useState, useEffect } from 'react';
import ContactService from '@/services/ContactService';
import ConfigService from '@/services/ConfigService'; // Import thêm service lấy cấu hình
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  
  // State lưu thông tin công ty lấy từ API
  const [companyInfo, setCompanyInfo] = useState({
    address: 'Đang tải địa chỉ...',
    phone: 'Đang tải...',
    email: 'Đang tải...',
    hotline: 'Đang tải...',
    mapUrl: '' // URL iframe bản đồ
  });

  // State form liên hệ
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    content: '',
    user_id: null
  });

  // 1. Lấy thông tin User & Config khi vào trang
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Lấy user từ localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setFormData(prev => ({ ...prev, user_id: user.id, name: user.name || '', email: user.email || '' }));
        } catch (e) {
          console.error("Lỗi parse user", e);
        }
      }
    }

    // Gọi API lấy thông tin cấu hình (Địa chỉ, SĐT, Map...)
    const fetchConfig = async () => {
      try {
        // Gọi API lấy config (limit=1 để lấy dòng đầu tiên/mới nhất)
        const res = await ConfigService.getList({ limit: 1, status: 1 });
        
        if (res && res.status && res.data && res.data.length > 0) {
          const config = res.data[0];
          
          // Tạo link Google Maps Embed từ địa chỉ
          // encodeURIComponent giúp chuyển đổi ký tự đặc biệt (dấu cách, dấu phẩy...) thành format URL an toàn
          const mapQuery = encodeURIComponent(config.address || 'Hồ Chí Minh');
          const googleMapUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

          setCompanyInfo({
            address: config.address || 'Chưa cập nhật',
            phone: config.phone || 'Chưa cập nhật',
            email: config.email || 'Chưa cập nhật',
            hotline: config.hotline || 'Chưa cập nhật',
            mapUrl: googleMapUrl
          });
        }
      } catch (error) {
        console.error("Lỗi lấy cấu hình công ty:", error);
      }
    };

    fetchConfig();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.content) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setLoading(true);

    try {
        const res = await ContactService.submitContact(formData);

        if (res.status === true) {
            toast.success(res.message || "Gửi liên hệ thành công!");
            setFormData(prev => ({
                ...prev,
                content: '',
            }));
        } else {
            if (res.errors) {
                const errorMessages = Object.values(res.errors).flat();
                errorMessages.forEach(msg => toast.error(msg));
            } else {
                toast.error(res.message || "Gửi thất bại.");
            }
        }
    } catch (error) {
        toast.error("Lỗi hệ thống, vui lòng thử lại.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Toaster position="top-right" reverseOrder={false} />

      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">Liên Hệ Hỗ Trợ</h1>
          <p className="text-slate-400">Chúng tôi luôn sẵn sàng lắng nghe ý kiến của bạn</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 shadow-xl rounded-2xl overflow-hidden bg-white">
          
          {/* --- LEFT COLUMN: FORM --- */}
          <div className="p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 uppercase tracking-wide border-l-4 border-blue-600 pl-4">
              Gửi thắc mắc
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
                  <input 
                    type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input 
                    type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="090xxxxxxx"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung <span className="text-red-500">*</span></label>
                <textarea 
                  name="content" rows="5" value={formData.content} onChange={handleChange} placeholder="Nhập nội dung bạn cần hỗ trợ..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                {loading ? 'Đang gửi thông tin...' : 'Gửi liên hệ'}
              </button>
            </form>
          </div>

          {/* --- RIGHT COLUMN: INFO & MAP --- */}
          <div className="bg-slate-50 p-8 lg:p-12 border-l border-gray-100 flex flex-col justify-between">
            
            <div className="space-y-8 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Thông tin liên hệ</h3>
                    <p className="text-gray-500 text-sm">Thông tin chi tiết được cập nhật từ hệ thống.</p>
                </div>
                
                <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Địa chỉ</h4>
                            <p className="text-gray-600 text-sm">{companyInfo.address}</p>
                        </div>
                    </li>

                    <li className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                            <Phone size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Hotline</h4>
                            <p className="text-gray-600 text-sm hover:text-green-600 cursor-pointer">{companyInfo.hotline}</p>
                            <p className="text-gray-500 text-xs">CSKH: {companyInfo.phone}</p>
                        </div>
                    </li>

                    <li className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Email</h4>
                            <p className="text-gray-600 text-sm hover:text-purple-600 cursor-pointer">{companyInfo.email}</p>
                        </div>
                    </li>

                    <li className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Giờ làm việc</h4>
                            <p className="text-gray-600 text-sm">Thứ 2 - CN: 08:00 - 22:00</p>
                        </div>
                    </li>
                </ul>
            </div>

            {/* DYNAMIC MAP EMBED */}
            <div className="w-full h-64 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-gray-200 relative">
               {companyInfo.mapUrl ? (
                   <iframe 
                     src={companyInfo.mapUrl} 
                     width="100%" 
                     height="100%" 
                     style={{border:0}} 
                     allowFullScreen="" 
                     loading="lazy" 
                     referrerPolicy="no-referrer-when-downgrade"
                   ></iframe>
               ) : (
                   <div className="flex items-center justify-center h-full text-gray-500">
                       Đang tải bản đồ...
                   </div>
               )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
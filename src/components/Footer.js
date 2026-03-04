'use client';

import { useEffect, useState } from 'react';
import ConfigService from '@/services/ConfigService';
import Link from 'next/link';
import { 
  Twitter, Instagram, Facebook, Linkedin, 
  MapPin, Phone, Mail, Clock, ShieldCheck, 
  HelpCircle, MessageSquare 
} from 'lucide-react';

export default function Footer() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Gọi getList với tham số limit=1 để lấy cấu hình mới nhất
        const res = await ConfigService.getList({ limit: 1, status: 1 });
        
        // Cấu trúc Controller trả về: { status: true, data: [item1, item2], meta: ... }
        if (res && res.status && res.data && res.data.length > 0) {
          setConfig(res.data[0]); // Lấy phần tử đầu tiên trong mảng
        }
      } catch (error) {
        console.error("Lỗi tải thông tin Footer:", error);
      }
    };
    fetchConfig();
  }, []);

  // Dữ liệu hiển thị (ưu tiên từ API, nếu chưa có thì dùng fallback)
  const siteInfo = {
    name: config?.site_name || 'Coffee Brand',
    address: config?.address || 'Đang cập nhật địa chỉ...',
    phone: config?.phone || '1900 xxxx',
    hotline: config?.hotline || '0909 xxx xxx',
    email: config?.email || 'contact@domain.com',
  };

  return (
    <footer className="bg-neutral-900 text-gray-400 border-t border-neutral-800 font-sans">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* CỘT 1: THÔNG TIN CÔNG TY */}
          <div className="space-y-6">
            <h2 className="text-white text-3xl font-serif italic tracking-wide">
              {siteInfo.name}
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>{siteInfo.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p>Hỗ trợ: <span className="text-white">{siteInfo.phone}</span></p>
                  <p>Hotline: <span className="text-white font-bold">{siteInfo.hotline}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span>{siteInfo.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span>08:00 - 22:00 (Hàng ngày)</span>
              </div>
            </div>
          </div>

          {/* CỘT 2: DANH MỤC LIÊN KẾT */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase mb-6 tracking-wider border-b-2 border-amber-600 inline-block pb-1">
              Về Chúng Tôi
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="hover:text-amber-500 transition flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></span> Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/Contact" className="hover:text-amber-500 transition flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></span> Liên hệ
                </Link>
              </li>
              <li>
                <Link href="/posts/chinh-sach-doi-tra-hoan-tien-cam-ket-chat-luong" className="hover:text-amber-500 transition flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></span> Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-500 transition flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full"></span> Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 3: HỖ TRỢ KHÁCH HÀNG */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase mb-6 tracking-wider border-b-2 border-amber-600 inline-block pb-1">
              Hỗ Trợ Khách Hàng
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/guide" className="hover:text-amber-500 transition flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" /> Hướng dẫn mua hàng
                </Link>
              </li>
              <li>
                <Link href="/posts/chinh-sach-doi-tra-hoan-tien-cam-ket-chat-luong" className="hover:text-amber-500 transition flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Chính sách đổi trả & Hoàn tiền
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-amber-500 transition flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-amber-500 transition flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* CỘT 4: KẾT NỐI MẠNG XÃ HỘI */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase mb-6 tracking-wider border-b-2 border-amber-600 inline-block pb-1">
              Kết Nối Với Chúng Tôi
            </h3>
            <p className="text-sm mb-6 leading-relaxed">
              Theo dõi chúng tôi trên các nền tảng xã hội để nhận thông tin ưu đãi mới nhất.
            </p>
            <div className="flex gap-4">
              <SocialIcon href="#" icon={<Facebook className="w-5 h-5" />} color="hover:bg-blue-600" />
              <SocialIcon href="#" icon={<Instagram className="w-5 h-5" />} color="hover:bg-pink-600" />
              <SocialIcon href="#" icon={<Twitter className="w-5 h-5" />} color="hover:bg-sky-500" />
              <SocialIcon href="#" icon={<Linkedin className="w-5 h-5" />} color="hover:bg-blue-700" />
            </div>
            
            {/* Logo Bộ Công Thương */}
            <div className="mt-8">
                <img 
                    src="http://online.gov.vn/Content/EndUser/LogoCCDVSaleNoti/logoSaleNoti.png" 
                    alt="Đã thông báo bộ công thương" 
                    className="h-10 w-auto opacity-80 hover:opacity-100 transition"
                />
            </div>
          </div>

        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-neutral-950 py-6 border-t border-neutral-800">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} <span className="text-white font-medium">{siteInfo.name}</span>. All rights reserved.
          </p>
          <div className="flex gap-2">
             <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png" className="h-6 w-6 rounded" alt="Momo" />
             <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" className="h-6 w-auto bg-white rounded px-1" alt="VNPAY" />
             <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6 w-auto bg-white rounded px-1" alt="Mastercard" />
          </div>
        </div>
      </div>
    </footer>
  );
}

// Component phụ cho Icon MXH
function SocialIcon({ href, icon, color }) {
    return (
        <a 
            href={href} 
            className={`w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-white transition-all duration-300 ${color} hover:-translate-y-1 shadow-lg`}
        >
            {icon}
        </a>
    )
}
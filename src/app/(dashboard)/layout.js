'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Menu, Bell, Moon, Sun, ShoppingCart, Package,
  Users, Settings, Home, ChevronDown, LogOut
} from 'lucide-react';
import UserService from '../../services/UserService'; // Import để dùng logout nếu cần

const IMAGE_BASE_URL = 'http://localhost:8000/storage/';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [ecommerceOpen, setEcommerceOpen] = useState(true);
  
  // State lưu thông tin Admin
  const [adminInfo, setAdminInfo] = useState({
    name: 'Admin',
    avatar: null,
    avatar_url: null
  });

  const pathname = usePathname();
  const router = useRouter();

  // Lấy thông tin user từ LocalStorage khi mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setAdminInfo(user);
        } catch (e) {
          console.error("Lỗi đọc dữ liệu user", e);
        }
      }
    }
  }, []);

  // Xử lý đăng xuất
  const handleLogout = async () => {
      await UserService.logout();
      router.push('/auth/login');
  };

  // Helper hiển thị ảnh đại diện
  const getAvatarUrl = () => {
      if (adminInfo.avatar_url) return adminInfo.avatar_url;
      if (adminInfo.avatar) return IMAGE_BASE_URL + adminInfo.avatar;
      // Fallback: Tạo avatar theo tên
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(adminInfo.name)}&background=random`;
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar - GIỮ NGUYÊN CODE CŨ */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col fixed left-0 h-full z-20`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            {sidebarOpen && <span className="font-bold text-xl dark:text-white">CoffeaShop</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-2">
              {sidebarOpen ? 'MENU' : ''}
            </p>
          </div>

          <div className="space-y-1 px-3">
            <Link 
              href="/admin"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                pathname === '/admin' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Package className="w-5 h-5" />
              {sidebarOpen && <span>Dashboard</span>}
            </Link>

            <div>
              <button
                onClick={() => setEcommerceOpen(!ecommerceOpen)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left font-medium">E-commerce</span>
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">NEW</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${ecommerceOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {sidebarOpen && ecommerceOpen && (
                <div className="pl-11 pr-3 pb-2 space-y-1 mt-1">
                  <Link 
                    href="/admin/product"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/product')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Product
                  </Link>
                  <Link 
                    href="/admin/categories"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/categories')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Categories
                  </Link>
                  <Link 
                    href="/admin/user"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/user')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    User
                  </Link>
                  <Link 
                    href="/admin/banner"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/banner')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Banner
                  </Link>
                   <Link 
                    href="/admin/contact"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/contact')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Contact
                  </Link>
                   <Link 
                    href="/admin/config"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/config')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Config
                  </Link>
                   <Link 
                    href="/admin/post"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/post')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Post
                  </Link>
                   <Link 
                    href="/admin/order"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/order')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Order
                  </Link>
                   <Link 
                    href="/admin/product_sales"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/product_sales')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Product Sales
                  </Link>
                   <Link 
                    href="/admin/product_store"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/product_store')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Product Store
                  </Link>
                   <Link 
                    href="/admin/menu"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/menu')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Menu
                  </Link>
                   <Link 
                    href="/admin/topic"
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg ${
                      pathname.includes('/admin/topic')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Topic
                  </Link>
                </div>
              )}
            </div>

            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Users className="w-5 h-5" />
              {sidebarOpen && <span>Users</span>}
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
              {sidebarOpen && <span>Settings</span>}
            </button>
          </div>
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Home className="w-5 h-5" />
            {sidebarOpen && <span>Back to Site</span>}
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        
        {/* Top Header - [ĐÃ CẬP NHẬT PHẦN USER] */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <Menu className="w-5 h-5 dark:text-gray-300" />
            </button>

            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search or type command..."
                className="w-full pl-10 pr-16 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded font-mono">
                ⌘ K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative"
            >
              {darkMode ? <Sun className="w-5 h-5 text-gray-300" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative">
              <Bell className="w-5 h-5 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
            
            {/* --- KHU VỰC HIỂN THỊ ADMIN --- */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              <img
                src={getAvatarUrl()}
                alt={adminInfo.name}
                className="w-9 h-9 rounded-full object-cover border border-gray-200"
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminInfo.name)}` }}
              />
              <div className="flex items-center gap-2 cursor-pointer">
                <span className="font-medium dark:text-white truncate max-w-[150px]">{adminInfo.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {/* --- HẾT KHU VỰC HIỂN THỊ ADMIN --- */}

          </div>
        </header>

        {/* Nội dung trang con sẽ render ở đây */}
        <main className="flex-1 overflow-y-auto p-6">
           {children}
        </main>
      </div>
    </div>
  );
}
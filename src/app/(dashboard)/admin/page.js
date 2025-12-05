'use client'

import React from 'react';
import { Package, ShoppingCart, DollarSign, Users, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  // Giả lập dữ liệu giống hệt bên trang Products để tính toán số liệu
  const products = [
    { id: 1, status: 1 }, // Active
    { id: 2, status: 1 }, // Active
    { id: 3, status: 0 }  // Inactive
  ];

  const categories = [
    { id: 1, name: 'Cà phê' },
    { id: 2, name: 'Trà' },
    { id: 3, name: 'Freeze' },
    { id: 4, name: 'Bánh ngọt' }
  ];

  // Tính toán số liệu
  const totalProducts = products.length;
  const inStock = products.filter(p => p.status === 1).length;
  const outOfStock = products.filter(p => p.status === 0).length;
  const totalCategories = categories.length;

  // Cấu hình hiển thị cho từng thẻ (Màu sắc và Icon)
  const stats = [
    { 
      label: 'Total Products', 
      value: totalProducts, 
      icon: Package, 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-600 dark:text-blue-400' 
    },
    { 
      label: 'In Stock', 
      value: inStock, 
      icon: ShoppingCart, 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-600 dark:text-green-400' 
    },
    { 
      label: 'Out of Stock', 
      value: outOfStock, 
      icon: DollarSign, // Dùng icon $ để giống ảnh mẫu bạn gửi
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-600 dark:text-red-400' 
    },
    { 
      label: 'Categories', 
      value: totalCategories, 
      icon: Users, 
      bg: 'bg-purple-100 dark:bg-purple-900/30', 
      text: 'text-purple-600 dark:text-purple-400' 
    }
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-white">Dashboard</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </h3>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Vùng nội dung bên dưới (nếu cần biểu đồ hoặc bảng) */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
          <p>Chart or Recent Orders will go here...</p>
        </div>
      </div>
    </>
  );
}
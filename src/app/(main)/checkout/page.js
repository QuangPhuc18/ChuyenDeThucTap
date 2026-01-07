"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { 
  ShoppingCart, User, Mail, Phone, MapPin, FileText, 
  CreditCard, Check, Package, Trash2, Edit, Copy,
  Calendar, Clock, AlertCircle, ChevronRight
} from 'lucide-react';

import OrderService from '@/services/OrderService'; 

export default function CheckoutPage() {
  const router = useRouter();

  // --- STATE ---
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dữ liệu khách hàng mẫu
  const [customers] = useState([
    {
      id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0901234567',
      address: '12 Nguyễn Trãi, Q.1, TP.HCM', note: 'Khách thích uống cà phê rang mộc.'
    },
    {
      id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', phone: '0908888999',
      address: '45 Lê Lợi, Q.3, TP.HCM', note: 'Giao giờ hành chính.'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'cod'
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerList, setShowCustomerList] = useState(false);

  // --- LOAD CART ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        const items = JSON.parse(storedCart);
        setCartItems(items);
        if (items.length === 0) router.push('/cart');
      } else {
        router.push('/cart');
      }
    }
  }, [router]);

  // --- TÍNH TOÁN ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);
  };

  // [SỬA ĐỔI] Luôn trả về 0 (Miễn phí vận chuyển)
  const calculateShipping = () => {
    return 0; 
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  // --- XỬ LÝ FORM ---
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const selectCustomer = (customer) => {
    setFormData({
      ...formData,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      note: customer.note || ''
    });
    setSelectedCustomer(customer);
    setShowCustomerList(false);
  };

  const copyCustomer = (customer) => {
    selectCustomer(customer);
  };

  // --- [QUAN TRỌNG] XỬ LÝ ĐẶT HÀNG ---
  const handleSubmitOrder = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, SĐT, Địa chỉ)!');
      return;
    }

    if (cartItems.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }

    setLoading(true);

    try {
        // 1. Xử lý User ID
        let userId = 1; 
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    userId = user.id ? user.id : 1;
                } catch (e) {
                    userId = 1;
                }
            }
        }

        // 2. Chuẩn bị Payload
        const payload = {
            user_id: userId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            note: formData.note,
            payment_method: formData.paymentMethod,
            total_money: calculateTotal(),
            
            // 3. Mapping chi tiết (FIX SIZE VÀ QTY Ở ĐÂY)
            details: cartItems.map(item => {
                // Lấy size từ item (có thể là .size hoặc .option)
                const sizeValue = item.size || item.option || '';
                
                return {
                    product_id: item.id,
                    qty: item.quantity, // Đổi quantity thành qty cho khớp backend
                    price: item.price,
                    // Gửi cả 2 trường để Backend bắt trường nào cũng được
                    size: sizeValue,   
                    option: sizeValue  
                };
            })
        };

        // 4. Gọi API
        const response = await OrderService.createOrder(payload);

        // 5. Xử lý kết quả
        if (response.status) {
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cart:update'));
            alert('🎉 Đặt hàng thành công!');
            
            if (response.id || response.order_id) {
               // Chuyển hướng về trang chủ hoặc chi tiết đơn hàng tùy ý
               router.push('/');
            } else {
               router.push('/');
            }
        } else {
            const errorDetails = response.errors 
                ? Object.values(response.errors).flat().join('\n') 
                : response.message;
            alert('Lỗi đặt hàng:\n' + errorDetails);
        }

    } catch (error) {
        console.error("Checkout Error:", error);
        if (error.response && error.response.data && error.response.data.errors) {
             const errorMsg = Object.values(error.response.data.errors).flat().join('\n');
             alert('Vui lòng kiểm tra lại thông tin:\n' + errorMsg);
        } else {
             alert('Lỗi kết nối server hoặc hệ thống.');
        }
    } finally {
        setLoading(false);
    }
  };

  // --- RENDER UI (GIỮ NGUYÊN) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg mb-4">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Thanh Toán Đơn Hàng
            </h1>
          </div>
          <p className="text-slate-600">Vui lòng kiểm tra thông tin và hoàn tất đơn hàng của bạn</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column - Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Selection */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-white" />
                    <h2 className="text-lg font-bold text-white">Thông tin khách hàng</h2>
                  </div>
                  <button
                    onClick={() => setShowCustomerList(!showCustomerList)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium"
                  >
                    {showCustomerList ? 'Ẩn danh sách' : 'Chọn từ danh sách'}
                  </button>
                </div>
              </div>

              {showCustomerList && (
                <div className="border-b border-slate-200 bg-slate-50">
                  <div className="p-6">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {customers.map((customer) => (
                        <div
                          key={customer.id}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedCustomer?.id === customer.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-slate-200 bg-white hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1" onClick={() => selectCustomer(customer)}>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-slate-800">{customer.name}</h3>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  ID: {customer.id}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {customer.email}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {customer.phone}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {customer.address}
                                </div>
                                {customer.note && (
                                  <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                    <span className="text-amber-700 text-xs">{customer.note}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => copyCustomer(customer)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Copy thông tin"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Input Fields */}
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <User className="w-4 h-4" />
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <Phone className="w-4 h-4" />
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0901234567"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    Địa chỉ giao hàng <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FileText className="w-4 h-4" />
                    Ghi chú đơn hàng
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Phương thức thanh toán</h2>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <label className="flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-green-500 transition-all group">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 group-hover:text-green-600 transition-colors">
                      Thanh toán khi nhận hàng (COD)
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Thanh toán bằng tiền mặt khi nhận hàng
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-green-500 transition-all group">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={formData.paymentMethod === 'bank'}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 group-hover:text-green-600 transition-colors">
                      Chuyển khoản ngân hàng
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Chuyển khoản qua Internet Banking
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-green-500 transition-all group">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={formData.paymentMethod === 'momo'}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 group-hover:text-green-600 transition-colors">
                      Ví MoMo
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Thanh toán qua ví điện tử MoMo
                    </div>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">Đơn hàng của bạn</h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                      ) : (
                          <Package className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800 mb-1 line-clamp-1">{item.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            SL: {item.quantity} 
                            {(item.size || item.option) && (
                                <span className="ml-1 px-1 bg-amber-100 text-amber-800 rounded text-xs">
                                    {item.size || item.option}
                                </span>
                            )}
                        </div>
                        <span className="font-semibold text-blue-600">{formatCurrency((Number(item.price) || 0) * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Order Summary */}
                <div className="space-y-3 pt-4 border-t-2 border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium">{formatCurrency(calculateShipping())}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-800 pt-3 border-t border-slate-200">
                    <span>Tổng cộng</span>
                    <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                  {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>

                <div className="flex items-center gap-2 text-sm text-slate-500 justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                  Thanh toán an toàn và bảo mật
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
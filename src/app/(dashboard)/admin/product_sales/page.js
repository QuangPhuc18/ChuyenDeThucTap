"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, ShoppingBag, Plus, Trash2, AlertCircle, Search, X, Check } from 'lucide-react';
import ProductSaleService from '../../../../services/ProductSaleService'; // Đảm bảo đường dẫn đúng

export default function ProductSalesAdmin() {
  // --- STATE ---
  // Danh sách sản phẩm ĐÃ CHỌN để sale (hiển thị ở màn hình chính)
  const [selectedProducts, setSelectedProducts] = useState([]); 
  
  // Form Data
  const [saleName, setSaleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Quick Settings (Thiết lập nhanh)
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState(20);

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [modalProducts, setModalProducts] = useState([]); // List SP từ API hiển thị trong modal
  const [tempSelectedIds, setTempSelectedIds] = useState([]); // Các ID được tích chọn tạm trong modal
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [modalLastPage, setModalLastPage] = useState(1);
  const [modalSearch, setModalSearch] = useState('');

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const calculateTotalReduction = () => {
    return selectedProducts.reduce((sum, p) => sum + (p.price_buy - p.salePrice), 0);
  };

  const hasError = (product) => {
    return product.salePrice >= product.price_buy;
  };

  // --- API: LOAD PRODUCTS FOR MODAL ---
  const fetchModalProducts = async (page = 1, keyword = '') => {
    setLoadingModal(true);
    try {
      // Gọi API lấy sản phẩm
      const res = await ProductSaleService.getProducts({ page, keyword });
      if (res.status) {
        setModalProducts(res.data.data);
        setModalLastPage(res.data.last_page);
        setModalPage(page);
      }
    } catch (e) {
      console.error("Lỗi tải sản phẩm:", e);
    } finally {
      setLoadingModal(false);
    }
  };

  // Khi mở modal thì load dữ liệu trang 1
  useEffect(() => {
    if (showModal) {
      fetchModalProducts(1, '');
      setTempSelectedIds([]); // Reset lựa chọn tạm khi mở lại modal
    }
  }, [showModal]);

  // --- LOGIC TRONG MODAL ---
  
  // Toggle chọn sản phẩm trong modal
  const toggleTempSelect = (productId) => {
    setTempSelectedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId); // Bỏ chọn
      } else {
        return [...prev, productId]; // Chọn thêm
      }
    });
  };

  // Bấm nút "Xác nhận thêm" trong Modal
  const confirmSelection = () => {
    const newItems = modalProducts.filter(p => tempSelectedIds.includes(p.id));
    
    // Lọc bỏ những món đã có sẵn trong selectedProducts để tránh trùng
    const uniqueNewItems = newItems.filter(newItem => !selectedProducts.some(existing => existing.id === newItem.id));

    // Map sang cấu trúc dữ liệu cho màn hình chính (thêm field salePrice mặc định)
    const itemsToAdd = uniqueNewItems.map(p => ({
      ...p,
      salePrice: p.price_buy, // Mặc định giá sale = giá gốc (giảm 0%)
      discount_percent: 0
    }));

    setSelectedProducts([...selectedProducts, ...itemsToAdd]);
    setShowModal(false);
  };

  // --- LOGIC MÀN HÌNH CHÍNH ---

  // Áp dụng giảm giá hàng loạt
  const applyDiscount = () => {
    const updated = selectedProducts.map(p => {
      let newPrice = Number(p.price_buy);
      let percent = 0;

      if (discountType === 'percent') {
        newPrice = p.price_buy * (1 - discountValue / 100);
        percent = discountValue;
      } else {
        newPrice = p.price_buy - discountValue;
        percent = Math.round(((p.price_buy - newPrice) / p.price_buy) * 100);
      }
      
      // Làm tròn & không âm
      newPrice = Math.max(0, Math.round(newPrice));
      
      return {
        ...p,
        salePrice: newPrice,
        discount_percent: percent
      };
    });
    setSelectedProducts(updated);
  };

  // Sửa giá thủ công từng dòng
  const handleManualPriceChange = (id, newPrice) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const percent = p.price_buy > 0 ? Math.round(((p.price_buy - newPrice) / p.price_buy) * 100) : 0;
      return { ...p, salePrice: newPrice, discount_percent: percent };
    }));
  };

  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!saleName || !startDate || !endDate) {
      alert("Vui lòng nhập tên chương trình và thời gian!");
      return;
    }
    if (selectedProducts.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm!");
      return;
    }

    // Chuẩn bị payload gửi lên API
    const payload = {
      name: saleName,
      date_begin: startDate,
      date_end: endDate,
      products: selectedProducts.map(p => ({
        id: p.id,
        price_sale: p.salePrice
      }))
    };

    try {
      const res = await ProductSaleService.create(payload);
      if (res.status) {
        alert("Tạo chương trình khuyến mãi thành công!");
        // Reset form
        setSaleName('');
        setStartDate('');
        setEndDate('');
        setSelectedProducts([]);
      } else {
        alert(res.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      const msg = error.response?.data?.details?.[0] || error.response?.data?.message || "Lỗi hệ thống";
      alert("Lỗi: " + msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-3xl font-bold text-slate-800">Tạo Khuyến Mãi Mới</h1>
             <p className="text-slate-500 mt-1">Thiết lập chương trình giảm giá cho sản phẩm</p>
           </div>
           <button onClick={handleSubmit} className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg font-bold flex items-center gap-2 transition-transform hover:scale-105">
              <SaveIcon className="w-5 h-5"/> LƯU CHƯƠNG TRÌNH
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT PANEL: THÔNG TIN CHUNG */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Thông tin & Thời gian</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên chương trình <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={saleName}
                    onChange={e => setSaleName(e.target.value)}
                    placeholder="VD: Flash Sale 12.12"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bắt đầu <span className="text-red-500">*</span></label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Kết thúc <span className="text-red-500">*</span></label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Lưu ý: Thời gian sale không được trùng lặp với các chương trình khác của cùng sản phẩm (cách nhau tối thiểu 1 ngày).</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: DANH SÁCH SẢN PHẨM */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* Header Panel */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Sản phẩm áp dụng</h2>
                    <p className="text-blue-100 text-sm">{selectedProducts.length} sản phẩm đã chọn</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-bold shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Thêm sản phẩm
                </button>
              </div>

              {/* Quick Settings Bar */}
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">Thiết lập nhanh:</span>
                  <div className="flex items-center bg-white rounded-lg border border-slate-300 overflow-hidden">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="px-3 py-2 bg-transparent border-r border-slate-300 outline-none text-sm font-medium"
                    >
                      <option value="percent">Giảm theo %</option>
                      <option value="amount">Giảm tiền mặt</option>
                    </select>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-20 px-3 py-2 outline-none text-sm text-center font-bold text-blue-600"
                    />
                    <span className="px-3 py-2 bg-slate-100 text-slate-500 text-sm font-bold border-l border-slate-300">
                      {discountType === 'percent' ? '%' : 'đ'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={applyDiscount}
                  className="text-sm px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-bold transition-colors"
                >
                  Áp dụng tất cả
                </button>
              </div>

              {/* Table List */}
              <div className="p-6">
                <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-5">Thông tin sản phẩm</div>
                  <div className="col-span-2 text-right">Giá gốc</div>
                  <div className="col-span-4 text-right">Giá khuyến mãi</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-4 mt-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedProducts.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                      <p>Chưa có sản phẩm nào được chọn</p>
                      <button onClick={() => setShowModal(true)} className="mt-2 text-blue-600 font-medium hover:underline">Thêm ngay</button>
                    </div>
                  ) : (
                    selectedProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border transition-all ${
                          hasError(product) ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="col-span-5 flex items-center gap-4">
                          <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                            {/* --- ĐÃ SỬA: Dùng image_url và thêm onError --- */}
                            <img 
                              src={product.image_url || 'https://placehold.co/60'} 
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = "https://placehold.co/60";
                              }}
                              className="w-full h-full object-cover" 
                              alt={product.name} 
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 line-clamp-1 text-sm md:text-base">{product.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">ID: {product.id}</p>
                          </div>
                        </div>

                        <div className="col-span-2 flex md:block justify-between items-center text-right">
                          <span className="md:hidden text-xs text-slate-500 font-medium">Giá gốc:</span>
                          <span className="font-medium text-slate-600 line-through decoration-slate-400 decoration-2 text-sm">{formatCurrency(product.price_buy)}</span>
                        </div>

                        <div className="col-span-4 flex md:block justify-between items-center text-right">
                          <span className="md:hidden text-xs text-slate-500 font-medium">Giá KM:</span>
                          <div className="flex items-center justify-end gap-2">
                            <div className="relative">
                              <input
                                type="number"
                                value={product.salePrice}
                                onChange={(e) => handleManualPriceChange(product.id, Number(e.target.value))}
                                className={`w-32 px-3 py-2 border rounded-lg text-right font-bold focus:ring-2 outline-none transition-all ${
                                  hasError(product) ? 'border-red-400 text-red-600 focus:ring-red-200' : 'border-slate-300 text-blue-600 focus:ring-blue-200'
                                }`}
                              />
                            </div>
                            {product.discount_percent > 0 && (
                              <span className="hidden md:inline-block px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-md">
                                -{product.discount_percent}%
                              </span>
                            )}
                          </div>
                          {hasError(product) && <p className="text-[10px] text-red-500 font-medium mt-1 text-right">Giá KM phải thấp hơn giá gốc</p>}
                        </div>

                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => removeProduct(product.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Summary */}
                {selectedProducts.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">Đang áp dụng cho <strong className="text-slate-800">{selectedProducts.length}</strong> sản phẩm</p>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Tổng giảm giá dự kiến</p>
                      <p className="text-2xl font-black text-blue-600">{formatCurrency(calculateTotalReduction())}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL CHỌN SẢN PHẨM --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Thêm sản phẩm</h3>
                <p className="text-sm text-slate-500">Chọn sản phẩm muốn áp dụng khuyến mãi</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6"/>
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-5 bg-slate-50 border-b border-slate-100">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchModalProducts(1, modalSearch)}
                  placeholder="Tìm kiếm sản phẩm theo tên..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
              {loadingModal ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modalProducts.map(p => {
                    const isAlreadyAdded = selectedProducts.some(sp => sp.id === p.id);
                    const isTempSelected = tempSelectedIds.includes(p.id);
                    
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => !isAlreadyAdded && toggleTempSelect(p.id)}
                        className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden group
                          ${isAlreadyAdded 
                            ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed grayscale' 
                            : isTempSelected 
                              ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-md' 
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                          }`}
                      >
                        {/* Checkbox UI */}
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                          ${isTempSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}
                        `}>
                          {isTempSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>

                        <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                          {/* --- ĐÃ SỬA: Dùng image_url và thêm onError trong MODAL --- */}
                          <img 
                            src={p.image_url || 'https://placehold.co/60'} 
                            onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = "https://placehold.co/60";
                            }}
                            className="w-full h-full object-cover" 
                            alt=""
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Giá: {formatCurrency(p.price_buy)}</p>
                        </div>

                        {isAlreadyAdded && (
                          <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center">
                            <span className="px-3 py-1 bg-slate-600 text-white text-xs font-bold rounded-full">Đã thêm</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <button 
                   disabled={modalPage === 1} 
                   onClick={() => fetchModalProducts(modalPage - 1, modalSearch)}
                   className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
                 >
                   Trước
                 </button>
                 <span className="text-sm font-medium text-slate-600">Trang {modalPage} / {modalLastPage}</span>
                 <button 
                   disabled={modalPage === modalLastPage} 
                   onClick={() => fetchModalProducts(modalPage + 1, modalSearch)}
                   className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50"
                 >
                   Sau
                 </button>
               </div>

               <div className="flex items-center gap-3">
                 <span className="text-sm text-slate-500 hidden sm:inline-block">Đã chọn: <strong className="text-blue-600">{tempSelectedIds.length}</strong></span>
                 <button 
                   onClick={() => setShowModal(false)}
                   className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                 >
                   Hủy bỏ
                 </button>
                 <button 
                   onClick={confirmSelection}
                   disabled={tempSelectedIds.length === 0}
                   className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"
                 >
                   Thêm {tempSelectedIds.length} sản phẩm
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Helper component icon */}
      <div className="hidden"><SaveIcon/></div>
    </div>
  );
}

// Icon Helper
function SaveIcon(props) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  )
}
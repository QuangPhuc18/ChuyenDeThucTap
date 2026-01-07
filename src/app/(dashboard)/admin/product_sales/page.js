"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, ShoppingBag, Plus, Trash2, AlertCircle, Search, X, Check, CheckCircle2, Clock, ListFilter } from 'lucide-react';
import ProductSaleService from '../../../../services/ProductSaleService'; 

export default function ProductSalesAdmin() {
  // --- STATE ---
  const [selectedProducts, setSelectedProducts] = useState([]); 
  const [saleName, setSaleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Quick Settings
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState(20);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalProducts, setModalProducts] = useState([]);
  const [tempSelectedIds, setTempSelectedIds] = useState([]); 
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [modalLastPage, setModalLastPage] = useState(1);
  const [modalSearch, setModalSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const calculateTotalReduction = () => {
    // Chỉ tính tổng giảm cho các sản phẩm MỚI (phần dưới)
    const newItems = selectedProducts.filter(p => !p.isSaved);
    return newItems.reduce((sum, p) => sum + (p.price_buy - p.salePrice), 0);
  };

  const hasError = (product) => {
    return Number(product.salePrice) >= Number(product.price_buy);
  };

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchActiveSales();
  }, []);

  const fetchActiveSales = async () => {
    try {
      const res = await ProductSaleService.getActiveSales();
      if (res.status && res.data.length > 0) {
        const savedItems = res.data.map(item => ({
          id: item.product_id,      
          sale_id: item.sale_id,    
          name: item.name,
          price_buy: item.price_buy,
          salePrice: item.salePrice,
          discount_percent: item.discount_percent,
          image_url: item.image_url || 'https://placehold.co/60',
          date_begin: item.date_begin, // Lưu thêm ngày bắt đầu để hiển thị
          date_end: item.date_end,     // Lưu thêm ngày kết thúc
          isSaved: true,
          isExpired: item.is_expired,
          uniqueKey: `saved_${item.sale_id}` 
        }));
        setSelectedProducts(savedItems);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    }
  };

  // --- 2. MODAL LOGIC ---
  const fetchModalProducts = async (page = 1, keyword = '') => {
    setLoadingModal(true);
    try {
      const res = await ProductSaleService.getProducts({ page, keyword });
      if (res.status) {
        setModalProducts(res.data.data);
        setModalLastPage(res.data.last_page);
        setModalPage(page);
      }
    } catch (e) { console.error(e); } finally { setLoadingModal(false); }
  };

  useEffect(() => {
    if (showModal) {
      fetchModalProducts(1, '');
      setTempSelectedIds([]); 
    }
  }, [showModal]);

  const toggleTempSelect = (productId) => {
    setTempSelectedIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const confirmSelection = () => {
    const newItems = modalProducts.filter(p => tempSelectedIds.includes(p.id));
    const itemsToAdd = newItems.map(p => ({
      ...p,
      salePrice: Math.round(p.price_buy * 0.8), 
      discount_percent: 20,
      isSaved: false, 
      uniqueKey: `new_${p.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
    setSelectedProducts([...selectedProducts, ...itemsToAdd]);
    setShowModal(false);
  };

  // --- 3. SUBMIT ---
  const handleSubmit = async () => {
    const newItems = selectedProducts.filter(p => !p.isSaved);

    if (!saleName || !startDate || !endDate) return alert("Vui lòng nhập đầy đủ tên và thời gian cho chương trình mới!");
    if (newItems.length === 0) return alert("Vui lòng chọn ít nhất một sản phẩm MỚI để lưu!");

    if (new Date(startDate) >= new Date(endDate)) return alert("Ngày kết thúc phải sau ngày bắt đầu!");

    const payload = {
      name: saleName,
      products: newItems.map(p => ({ id: p.id, price_sale: p.salePrice })),
      time_slots: [{ date_begin: startDate, date_end: endDate }]
    };

    setIsSubmitting(true);
    try {
      const res = await ProductSaleService.create(payload);
      if (res.status) {
        alert(res.message || "Thành công!");
        fetchActiveSales(); 
        // Reset form sau khi lưu thành công
        setSaleName(''); setStartDate(''); setEndDate('');
      } else {
        alert(res.message || "Có lỗi xảy ra");
      }
    } catch (error) {
        const msg = error.response?.data?.message || "Lỗi hệ thống";
        const details = error.response?.data?.details;
        alert(Array.isArray(details) ? `${msg}\n- ${details.join('\n- ')}` : "Lỗi: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 4. DELETE ---
  const removeProduct = async (product) => {
    if (!window.confirm(`Xóa khuyến mãi của "${product.name}"?`)) return;

    if (product.isSaved && product.sale_id) {
        try {
            await ProductSaleService.delete(product.sale_id); 
            setSelectedProducts(prev => prev.filter(p => p.uniqueKey !== product.uniqueKey));
            alert("Đã xóa.");
        } catch (error) {
            alert("Lỗi xóa: " + (error.response?.data?.message || error.message));
        }
    } else {
        setSelectedProducts(prev => prev.filter(p => p.uniqueKey !== product.uniqueKey));
    }
  };

  // --- UI HELPER ---
  const applyDiscount = () => {
    // Chỉ áp dụng cho sản phẩm MỚI (chưa lưu)
    const updated = selectedProducts.map(p => {
      if (p.isSaved) return p; // Bỏ qua sản phẩm đã lưu
      
      let newPrice = Number(p.price_buy);
      let percent = 0;
      if (discountType === 'percent') {
        newPrice = p.price_buy * (1 - discountValue / 100);
        percent = discountValue;
      } else {
        newPrice = p.price_buy - discountValue;
        percent = p.price_buy > 0 ? Math.round(((p.price_buy - newPrice) / p.price_buy) * 100) : 0;
      }
      return { ...p, salePrice: Math.max(0, Math.round(newPrice)), discount_percent: percent };
    });
    setSelectedProducts(updated);
  };

  const handleManualPriceChange = (uniqueKey, newPrice) => {
    setSelectedProducts(prev => prev.map(p => {
      if (p.uniqueKey !== uniqueKey) return p;
      const percent = p.price_buy > 0 ? Math.round(((p.price_buy - newPrice) / p.price_buy) * 100) : 0;
      return { ...p, salePrice: newPrice, discount_percent: percent };
    }));
  };

  // Tách danh sách ra làm 2
  const savedProducts = selectedProducts.filter(p => p.isSaved);
  const newProducts = selectedProducts.filter(p => !p.isSaved);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-3xl font-bold text-slate-800">Quản Lý Khuyến Mãi</h1>
             <p className="text-slate-500 mt-1">Thiết lập và quản lý các sản phẩm giảm giá</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- CỘT TRÁI: FORM NHẬP LIỆU (Chỉ áp dụng cho MỚI) --- */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg"><Plus className="w-6 h-6 text-blue-600" /></div>
                <h2 className="text-xl font-bold text-slate-800">Tạo chương trình mới</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên chương trình <span className="text-red-500">*</span></label>
                  <input type="text" value={saleName} onChange={e => setSaleName(e.target.value)} placeholder="VD: Flash Sale 12.12" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bắt đầu</label>
                    <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Kết thúc</label>
                    <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none" />
                  </div>
                </div>
                
                {/* Nút Submit nằm ở đây cho thuận tiện */}
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || newProducts.length === 0}
                    className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-md font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Đang lưu...' : <><SaveIcon className="w-5 h-5"/> LƯU CHƯƠNG TRÌNH</>}
                </button>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Lưu ý: Thời gian sale không được trùng lặp với các chương trình đang chạy bên phải.</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: DANH SÁCH --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* PHẦN 1: SẢN PHẨM ĐANG KHUYẾN MÃI (Saved) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ListFilter className="w-5 h-5 text-slate-600"/>
                        <h3 className="font-bold text-slate-700">Đang khuyến mãi ({savedProducts.length})</h3>
                    </div>
                </div>
                
                <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {savedProducts.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">Chưa có chương trình nào đang chạy.</div>
                    ) : (
                        <div className="space-y-3">
                            {savedProducts.map((product) => (
                                <div key={product.uniqueKey} className={`flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-white ${product.isExpired ? 'opacity-60 grayscale' : ''}`}>
                                    <div className="w-14 h-14 bg-slate-50 rounded-lg overflow-hidden border shrink-0">
                                        <img src={product.image_url} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{product.name}</h4>
                                            {product.isExpired && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">HẾT HẠN</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {product.date_begin?.substring(0,16).replace('T', ' ')} → {product.date_end?.substring(0,16).replace('T', ' ')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-blue-600 text-sm">{formatCurrency(product.salePrice)}</div>
                                        <div className="text-xs text-slate-400 line-through">{formatCurrency(product.price_buy)}</div>
                                    </div>
                                    <button onClick={() => removeProduct(product)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Xóa khỏi DB">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* PHẦN 2: THÊM SẢN PHẨM MỚI (Unsaved) */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden ring-1 ring-blue-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg"><ShoppingBag className="w-5 h-5 text-white" /></div>
                  <div><h2 className="text-lg font-bold">Sản phẩm sẽ thêm</h2><p className="text-blue-100 text-xs">{newProducts.length} sản phẩm chờ lưu</p></div>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-bold text-sm shadow-sm">
                  <Plus className="w-4 h-4" /> Chọn thêm
                </button>
              </div>

              {/* Quick Settings (Chỉ áp dụng cho New Products) */}
              <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Giảm nhanh:</span>
                  <div className="flex items-center bg-white rounded-lg border border-slate-300 overflow-hidden h-9">
                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="px-2 bg-transparent border-r border-slate-300 outline-none text-xs font-medium h-full">
                      <option value="percent">%</option>
                      <option value="amount">Tiền</option>
                    </select>
                    <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="w-16 px-2 outline-none text-xs text-center font-bold text-blue-600 h-full" />
                  </div>
                  <button onClick={applyDiscount} className="text-xs px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-bold h-9">Áp dụng</button>
                </div>
              </div>

              <div className="p-5">
                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {newProducts.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      <ShoppingBag className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-sm">Chưa chọn sản phẩm nào để thêm mới</p>
                    </div>
                  ) : (
                    newProducts.map((product) => (
                      <div key={product.uniqueKey} className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl border bg-white ${hasError(product) ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                        <div className="col-span-5 flex items-center gap-3">
                          <img src={product.image_url} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{product.name}</h3>
                            <p className="text-xs text-slate-500">ID: {product.id}</p>
                          </div>
                        </div>

                        <div className="col-span-3 text-right font-medium text-slate-500 line-through text-xs">
                           {formatCurrency(product.price_buy)}
                        </div>

                        <div className="col-span-3 text-right">
                            <input 
                                type="number" 
                                value={product.salePrice} 
                                onChange={(e) => handleManualPriceChange(product.uniqueKey, Number(e.target.value))} 
                                className={`w-24 px-2 py-1.5 border rounded-lg text-right font-bold text-sm outline-none ${hasError(product) ? 'border-red-400 text-red-600' : 'border-slate-300 text-blue-600'}`} 
                            />
                            {hasError(product) && <p className="text-[9px] text-red-500 mt-1">Lỗi giá</p>}
                        </div>

                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => removeProduct(product)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                              <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {newProducts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-slate-500 text-xs">Dự kiến thêm <strong className="text-slate-800">{newProducts.length}</strong> sản phẩm</p>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Tổng giảm giá</p>
                      <p className="text-xl font-black text-blue-600">{formatCurrency(calculateTotalReduction())}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <div><h3 className="text-xl font-bold text-slate-800">Thêm sản phẩm</h3><p className="text-sm text-slate-500">Chọn sản phẩm muốn áp dụng khuyến mãi</p></div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="p-5 bg-slate-50 border-b border-slate-100">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchModalProducts(1, modalSearch)} placeholder="Tìm kiếm sản phẩm..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
              {loadingModal ? <div className="text-center py-10 text-slate-400">Đang tải...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modalProducts.map(p => {
                    const isAlreadyAdded = newProducts.some(sp => sp.id === p.id); // Chỉ check trùng với list MỚI
                    const isTempSelected = tempSelectedIds.includes(p.id);
                    return (
                      <div key={p.id} onClick={() => !isAlreadyAdded && toggleTempSelect(p.id)} className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${isAlreadyAdded ? 'bg-slate-100 opacity-60' : isTempSelected ? 'bg-blue-50 border-blue-500' : 'bg-white hover:border-blue-300'}`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isTempSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>{isTempSelected && <Check className="w-3.5 h-3.5 text-white" />}</div>
                        <img src={p.image_url || 'https://placehold.co/60'} onError={(e)=>{e.target.src='https://placehold.co/60'}} className="w-14 h-14 rounded-lg object-cover border" />
                        <div><p className="font-bold text-slate-800 truncate">{p.name}</p><p className="text-xs text-slate-500">Giá: {formatCurrency(p.price_buy)}</p></div>
                        {isAlreadyAdded && <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center"><span className="px-3 py-1 bg-slate-600 text-white text-xs font-bold rounded-full">Đã chọn</span></div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center">
               <div className="flex gap-2">
                 <button disabled={modalPage===1} onClick={()=>fetchModalProducts(modalPage-1, modalSearch)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">Trước</button>
                 <button disabled={modalPage===modalLastPage} onClick={()=>fetchModalProducts(modalPage+1, modalSearch)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50">Sau</button>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Hủy bỏ</button>
                 <button onClick={confirmSelection} disabled={tempSelectedIds.length===0} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">Thêm {tempSelectedIds.length} sản phẩm</button>
               </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="hidden"><SaveIcon/></div>
    </div>
  );
}

function SaveIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
  )
}
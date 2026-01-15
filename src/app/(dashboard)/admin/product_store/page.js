"use client";

import React, { useState, useEffect } from 'react';
import { Search, Trash2, Package, Plus, X, Save, ShoppingCart, Archive, TrendingUp, Check, Edit2, RotateCcw, Loader2 } from 'lucide-react';
import ProductStoreService from '../../../../services/ProductStoreService'; 
import ProductService from '../../../../services/ProductService'; 

export default function ProductStoreTable() {
  // --- STATE ---
  const [products, setProducts] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- EDIT STATE ---
  const [editingId, setEditingId] = useState(null); 
  const [editValues, setEditValues] = useState({ qty: 0, price: 0 });
  const [isSaving, setIsSaving] = useState(false);

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [modalProducts, setModalProducts] = useState([]); 
  const [tempSelectedIds, setTempSelectedIds] = useState([]); 
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [modalLastPage, setModalLastPage] = useState(1);
  const [modalSearch, setModalSearch] = useState('');

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getImageSrc = (img) => {
    if (!img) return 'https://placehold.co/60';
    if (img.startsWith('http')) return img;
    return `http://localhost:8000/storage/${img}`;
  };

  const getTotalImportValue = () => {
    const importItems = products.filter(p => !p.isSaved);
    return importItems.reduce((sum, p) => sum + (p.quantity * p.importPrice), 0);
  };

  // --- 1. FETCH DATA (Lấy danh sách tồn kho) ---
  const fetchStoreData = async () => {
    try {
      const res = await ProductStoreService.getAll();
      if (res && res.status) {
        const rawData = res.data.data ? res.data.data : res.data;
        if (Array.isArray(rawData)) {
          const mappedData = rawData.map(item => ({
            id: item.product_id,
            store_id: item.store_id, // ID của lô hàng
            name: item.product_name,
            sku: item.sku || 'N/A',
            unit: 'Cái',
            quantity: Number(item.qty),
            importPrice: Number(item.price_root),
            image: item.product_image,
            created_at: item.created_at,
            isSaved: true, 
            uniqueKey: `saved_${item.store_id}` 
          }));
          
          setProducts(prev => {
             const unsavedItems = prev.filter(p => !p.isSaved);
             return [...mappedData, ...unsavedItems];
          });
        }
      }
    } catch (error) {
      console.error("Lỗi tải tồn kho:", error);
    }
  };

  useEffect(() => { fetchStoreData(); }, []);

  // --- 2. LOGIC UI (NEW IMPORT) ---
  const updateQuantity = (uniqueKey, newQuantity) => {
    setProducts(products.map(p =>
      p.uniqueKey === uniqueKey ? { ...p, quantity: Math.max(1, Number(newQuantity)) } : p
    ));
  };

  const updateImportPrice = (uniqueKey, newPrice) => {
    setProducts(products.map(p =>
      p.uniqueKey === uniqueKey ? { ...p, importPrice: Math.max(0, Number(newPrice)) } : p
    ));
  };

  // --- 3. LOGIC EDIT (EXISTING IMPORT) ---
  const handleEditClick = (product) => {
    setEditingId(product.store_id);
    setEditValues({ qty: product.quantity, price: product.importPrice });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ qty: 0, price: 0 });
  };

  const handleSaveEdit = async (storeId) => {
    // [UPDATE QUAN TRỌNG]: Cho phép nhập số lượng = 0 (để ẩn sản phẩm)
    // Không chặn min=1 nữa, chỉ chặn số âm
    if(editValues.qty < 0) return alert("Số lượng không được âm");
    
    setIsSaving(true);
    try {
        const payload = {
            qty: editValues.qty,
            price_root: editValues.price
        };
        
        await ProductStoreService.update(storeId, payload);
        
        setProducts(prev => prev.map(p => {
            if (p.store_id === storeId && p.isSaved) {
                return { ...p, quantity: editValues.qty, importPrice: editValues.price };
            }
            return p;
        }));
        
        setEditingId(null);
        alert("Cập nhật thành công!");
    } catch (error) {
        console.error(error);
        alert("Lỗi cập nhật: " + (error.response?.data?.message || "Lỗi hệ thống"));
    } finally {
        setIsSaving(false);
    }
  };

  // --- 4. DELETE ---
  const removeProduct = async (product) => {
    if (!window.confirm(`Bạn có muốn xóa lô hàng "${product.name}"?`)) return;

    if (product.isSaved) {
        try {
            await ProductStoreService.delete(product.store_id); 
            // Load lại dữ liệu để đồng bộ trạng thái (nếu xóa hết thì sản phẩm sẽ ẩn)
            fetchStoreData(); 
            alert("Đã xóa lô hàng khỏi kho.");
        } catch (error) {
            alert("Lỗi xóa: " + (error.response?.data?.message || "Lỗi hệ thống"));
        }
    } else {
        setProducts(prev => prev.filter(p => p.uniqueKey !== product.uniqueKey));
    }
  };

  // --- 5. SUBMIT (Nhập kho) ---
  const handleImportGoods = async () => {
    const importItems = products.filter(p => !p.isSaved);
    if (importItems.length === 0) return alert("Phiếu nhập đang trống.");
    
    const totalVal = getTotalImportValue();
    if (!window.confirm(`Xác nhận nhập kho ${importItems.length} lô hàng?\nTổng giá trị: ${formatCurrency(totalVal)}`)) return;

    setIsLoading(true);
    try {
      const promises = importItems.map(product => {
        return ProductStoreService.import({
          product_id: product.id,
          // Mapping đúng tên biến Backend yêu cầu
          qty_import: product.quantity,   
          price_root: product.importPrice 
        });
      });
      
      await Promise.all(promises);
      
      alert("✅ Nhập kho thành công! Sản phẩm đã được hiển thị.");
      setProducts(prev => prev.filter(p => p.isSaved)); 
      fetchStoreData(); 
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || JSON.stringify(error.response?.data?.errors) || error.message;
      alert("Có lỗi xảy ra: " + msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 6. MODAL (Chọn sản phẩm để nhập) ---
  const fetchModalProducts = async (page = 1, keyword = '') => {
    setLoadingModal(true);
    try {
      const params = {
          page: page,
          search: keyword,
          limit: 10,
          // [QUAN TRỌNG]: Thêm cờ này để Backend trả về cả sản phẩm Ẩn (để nhập kho)
          for_import: true 
      };
      const res = await ProductService.getList(params); 
      if (res.status) {
        const items = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const lastPage = res.data.last_page || (res.meta ? res.meta.last_page : 1);
        setModalProducts(items);
        setModalLastPage(lastPage);
        setModalPage(page);
      }
    } catch (e) { 
        console.error("Lỗi lấy SP modal:", e); 
    } finally { 
        setLoadingModal(false); 
    }
  };

  useEffect(() => { if (showModal) { fetchModalProducts(1, ''); setTempSelectedIds([]); } }, [showModal]);

  const toggleTempSelect = (productId) => {
    setTempSelectedIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const confirmSelection = () => {
    const newItems = modalProducts.filter(p => tempSelectedIds.includes(p.id));
    const itemsToAdd = newItems.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || 'N/A',
      unit: 'Cái',
      quantity: 1, 
      importPrice: p.price_buy || 0,
      image: p.image_url || p.thumbnail, 
      isSaved: false,
      uniqueKey: `new_${p.id}_${Date.now()}` 
    }));
    setProducts(prev => [...prev, ...itemsToAdd]);
    setShowModal(false);
  };

  const savedProducts = products.filter(p => p.isSaved);
  const newProducts = products.filter(p => !p.isSaved);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Package className="w-6 h-6"/></div>
                <div><p className="text-sm text-slate-500">Mặt hàng tồn kho</p><p className="text-2xl font-bold text-slate-800">{savedProducts.length}</p></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-lg text-green-600"><ShoppingCart className="w-6 h-6"/></div>
                <div><p className="text-sm text-slate-500">Đang nhập thêm</p><p className="text-2xl font-bold text-slate-800">{newProducts.length}</p></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><TrendingUp className="w-6 h-6"/></div>
                <div><p className="text-sm text-slate-500">Giá trị phiếu nhập</p><p className="text-2xl font-bold text-indigo-600">{formatCurrency(getTotalImportValue())}</p></div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* TRÁI: PHIẾU NHẬP (CREATE) */}
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden sticky top-6">
                    <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg"><Plus className="w-5 h-5"/></div>
                            <div><h2 className="text-lg font-bold">Phiếu nhập hàng</h2><p className="text-blue-100 text-xs mt-0.5">Tạo lô hàng mới</p></div>
                        </div>
                        <button onClick={() => setShowModal(true)} className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-all flex items-center gap-1 shadow-sm"><Plus className="w-3.5 h-3.5"/> Chọn SP</button>
                    </div>

                    <div className="p-4 bg-slate-50 min-h-[300px]">
                        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                            {newProducts.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50"><ShoppingCart className="w-12 h-12 mb-3 opacity-20"/><p className="text-sm font-medium">Phiếu nhập đang trống</p></div>
                            ) : (
                                newProducts.map((product) => (
                                    <div key={product.uniqueKey} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-all">
                                        <div className="flex gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-lg border border-slate-100 overflow-hidden shrink-0">
                                                <img src={getImageSrc(product.image)} onError={(e) => {e.target.src = "https://placehold.co/60"}} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6"><h4 className="font-bold text-slate-800 text-sm truncate">{product.name}</h4><p className="text-xs text-slate-500 mt-0.5">Mã: {product.sku}</p></div>
                                            <button onClick={() => removeProduct(product)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded absolute top-2 right-2 transition-colors"><X className="w-4 h-4"/></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <div><label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 pl-1">Số lượng</label><input type="number" min="1" value={product.quantity} onChange={(e) => updateQuantity(product.uniqueKey, e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none bg-white"/></div>
                                            <div><label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 pl-1">Giá nhập</label><input type="number" min="0" value={product.importPrice} onChange={(e) => updateImportPrice(product.uniqueKey, e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm font-bold text-right text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none bg-white"/></div>
                                        </div>
                                        <div className="mt-2 text-right pt-1 flex justify-between items-center px-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Thành tiền</span>
                                            <span className="text-sm font-black text-slate-700">{formatCurrency(product.quantity * product.importPrice)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-200 bg-white">
                        <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold text-slate-500 uppercase">Tổng giá trị phiếu</span><span className="text-2xl font-black text-blue-600">{formatCurrency(getTotalImportValue())}</span></div>
                        <button onClick={handleImportGoods} disabled={isLoading || newProducts.length === 0} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50">{isLoading ? 'Đang xử lý...' : <><Save className="w-5 h-5"/> NHẬP KHO</>}</button>
                    </div>
                </div>
            </div>

            {/* PHẢI: TỒN KHO & LỊCH SỬ (READ/UPDATE/DELETE) */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                        <div className="flex items-center gap-2"><Archive className="w-5 h-5 text-slate-600"/><h3 className="font-bold text-slate-700">Lịch sử nhập kho</h3></div>
                        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/><input type="text" placeholder="Tìm kiếm..." className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white w-56 transition-all" onChange={(e) => setSearchTerm(e.target.value)}/></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-3 text-left">Sản phẩm</th>
                                    <th className="px-5 py-3 text-center">SL Nhập</th>
                                    <th className="px-5 py-3 text-right">Giá nhập</th>
                                    <th className="px-5 py-3 text-right">Thành tiền</th>
                                    <th className="px-5 py-3 text-right">Ngày nhập</th>
                                    <th className="px-5 py-3 text-center min-w-[100px]">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {savedProducts.length === 0 ? (
                                    <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-400">Kho đang trống</td></tr>
                                ) : (
                                    savedProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => {
                                        const isEditing = editingId === product.store_id;
                                        
                                        return (
                                            <tr key={product.uniqueKey} className={`transition-colors group ${isEditing ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'}`}>
                                                {/* CỘT SẢN PHẨM */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                                            <img src={getImageSrc(product.image)} onError={(e) => {e.target.src = "https://placehold.co/60"}} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div><p className="font-bold text-slate-700 line-clamp-1">{product.name}</p><p className="text-xs text-slate-400">Lô: #{product.store_id}</p></div>
                                                    </div>
                                                </td>

                                                {/* CỘT SỐ LƯỢNG (Cho phép nhập 0) */}
                                                <td className="px-5 py-3.5 text-center">
                                                    {isEditing ? (
                                                        <input type="number" min="0" value={editValues.qty} onChange={(e) => setEditValues({...editValues, qty: e.target.value})} className="w-16 px-1 py-1 text-center border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"/>
                                                    ) : (
                                                        <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{product.quantity}</span>
                                                    )}
                                                </td>

                                                {/* CỘT GIÁ NHẬP */}
                                                <td className="px-5 py-3.5 text-right text-slate-500">
                                                    {isEditing ? (
                                                        <input type="number" min="0" value={editValues.price} onChange={(e) => setEditValues({...editValues, price: e.target.value})} className="w-24 px-1 py-1 text-right border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-blue-600 font-bold"/>
                                                    ) : (
                                                        formatCurrency(product.importPrice)
                                                    )}
                                                </td>

                                                {/* CỘT THÀNH TIỀN */}
                                                <td className="px-5 py-3.5 text-right font-bold text-blue-600">
                                                    {isEditing ? formatCurrency(editValues.qty * editValues.price) : formatCurrency(product.quantity * product.importPrice)}
                                                </td>

                                                {/* CỘT NGÀY NHẬP */}
                                                <td className="px-5 py-3.5 text-right text-xs text-slate-500">{formatDate(product.created_at)}</td>

                                                {/* CỘT HÀNH ĐỘNG */}
                                                <td className="px-5 py-3.5 text-center">
                                                    <div className="flex justify-center items-center gap-1">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={() => handleSaveEdit(product.store_id)} disabled={isSaving} className="text-green-500 hover:bg-green-50 p-2 rounded-lg transition-all" title="Lưu lại">
                                                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                                                                </button>
                                                                <button onClick={handleCancelEdit} disabled={isSaving} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-all" title="Hủy bỏ">
                                                                    <RotateCcw className="w-4 h-4"/>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleEditClick(product)} className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all" title="Chỉnh sửa">
                                                                    <Edit2 className="w-4 h-4"/>
                                                                </button>
                                                                <button onClick={() => removeProduct(product)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all" title="Xóa lô này">
                                                                    <Trash2 className="w-4 h-4"/>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div><h3 className="text-lg font-bold text-slate-800">Chọn sản phẩm nhập kho</h3><p className="text-sm text-slate-500">Có thể chọn nhiều lần cho cùng 1 sản phẩm</p></div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6"/></button>
            </div>
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 sticky top-[73px] z-10">
               <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5"/><input type="text" placeholder="Tìm kiếm sản phẩm..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm" onChange={(e) => setModalSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchModalProducts(1, modalSearch)} /></div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
               {loadingModal ? <div className="text-center py-12 text-slate-400">Đang tải dữ liệu...</div> : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {modalProducts.map(p => {
                        const isSelected = tempSelectedIds.includes(p.id);
                        return (
                          <div key={p.id} onClick={() => toggleTempSelect(p.id)} className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300'}`}>
                             <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>{isSelected && <Check className="w-3.5 h-3.5 text-white" />}</div>
                             <div className="w-12 h-12 rounded-lg border border-slate-100 overflow-hidden shrink-0">
                                 <img src={getImageSrc(p.image_url || p.thumbnail)} onError={(e) => {e.target.src = "https://placehold.co/60"}} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                 <p className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</p>
                                 <p className="text-xs text-slate-500">Giá gốc: {formatCurrency(p.price_buy)}</p>
                                 {/* Hiển thị status để biết sản phẩm nào đang ẩn */}
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status == 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                     {p.status == 1 ? 'Active' : 'Hidden'}
                                 </span>
                             </div>
                          </div>
                        )
                     })}
                   </div>
               )}
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
               <div className="flex gap-2">
                  <button disabled={modalPage === 1} onClick={() => fetchModalProducts(modalPage - 1, modalSearch)} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors">Trước</button>
                  <button disabled={modalPage === modalLastPage} onClick={() => fetchModalProducts(modalPage + 1, modalSearch)} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors">Sau</button>
               </div>
               <div className="flex gap-3 items-center">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-sm transition-colors">Hủy bỏ</button>
                  <button onClick={confirmSelection} disabled={tempSelectedIds.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 text-sm shadow-lg shadow-blue-200 transition-all">Thêm {tempSelectedIds.length} sp vào phiếu</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
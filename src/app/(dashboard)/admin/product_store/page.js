"use client";

import React, { useState, useEffect } from 'react';
import { Search, Trash2, Package, Plus, Download, X, Check } from 'lucide-react';
// Import các service API
import ProductStoreService from '../../../../services/ProductStoreService'; // Cần tạo service này
import ProductSaleService from '../../../../services/ProductSaleService';   // Tái sử dụng để lấy list product

export default function ProductStoreTable() {
  // --- STATE ---
  const [products, setProducts] = useState([]); // Danh sách sản phẩm CHUẨN BỊ nhập kho (trên UI)
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [modalProducts, setModalProducts] = useState([]); 
  const [tempSelectedIds, setTempSelectedIds] = useState([]); 
  const [loadingModal, setLoadingModal] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const [modalSearch, setModalSearch] = useState('');

  // --- FETCH DATA (Optional: Nếu muốn load lịch sử nhập kho) ---
  // Hiện tại trang này đang đóng vai trò là "Phiếu nhập kho mới", nên mặc định list rỗng.
  // Nếu bạn muốn hiển thị tồn kho hiện tại, có thể gọi API index() ở đây.

  // --- HELPER FUNCTIONS ---
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getStockStatus = (stock) => {
    if (stock <= 3) return { color: 'text-red-600 bg-red-50', label: 'Sắp hết' };
    if (stock <= 7) return { color: 'text-amber-600 bg-amber-50', label: 'Thấp' };
    return { color: 'text-green-600 bg-green-50', label: 'Đủ' };
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTotalValue = () => {
    return products.reduce((sum, p) => sum + (p.quantity * p.importPrice), 0);
  };

  // --- LOGIC UI (Update local state) ---
  const updateQuantity = (id, newQuantity) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, quantity: Number(newQuantity) } : p
    ));
  };

  const updateImportPrice = (id, newPrice) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, importPrice: Number(newPrice) } : p
    ));
  };

  const removeProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // --- MODAL LOGIC (Fetch Products from DB) ---
  const fetchModalProducts = async (page = 1, keyword = '') => {
    setLoadingModal(true);
    try {
      // Tái sử dụng API lấy danh sách sản phẩm (ProductSaleService hoặc ProductService)
      const res = await ProductSaleService.getProducts({ page, keyword });
      if (res.status) {
        setModalProducts(res.data.data);
        setModalPage(page);
      }
    } catch (e) {
      console.error("Lỗi tải sản phẩm:", e);
    } finally {
      setLoadingModal(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchModalProducts(1, '');
      setTempSelectedIds([]);
    }
  }, [showModal]);

  const toggleTempSelect = (productId) => {
    setTempSelectedIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const confirmSelection = () => {
    const newItems = modalProducts.filter(p => tempSelectedIds.includes(p.id));
    
    // Lọc bỏ trùng lặp (nếu sản phẩm đã có trong bảng nhập kho rồi thì không thêm lại)
    const uniqueNewItems = newItems.filter(newItem => !products.some(existing => existing.id === newItem.id));

    // Map dữ liệu từ API sang cấu trúc của bảng nhập kho
    const itemsToAdd = uniqueNewItems.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || 'N/A', // Nếu API không trả về SKU thì để N/A
      unit: 'Cái',         // Mặc định hoặc lấy từ API nếu có
      quantity: 1,         // Mặc định nhập 1
      stock: 0,            // Tồn kho hiện tại (cần API trả về nếu muốn hiển thị chính xác)
      importPrice: p.price_buy || 0, // Mặc định lấy giá gốc làm giá nhập gợi ý
      image: p.thumbnail || '/api/placeholder/60/60',
      total: p.price_buy || 0
    }));

    setProducts([...products, ...itemsToAdd]);
    setShowModal(false);
  };

  // --- SUBMIT TO DB (Lưu kho) ---
  const handleImportGoods = async () => {
    if (products.length === 0) {
      alert("Vui lòng thêm ít nhất một sản phẩm để nhập kho.");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn nhập kho các sản phẩm này?")) return;

    setIsLoading(true);
    try {
      // Duyệt qua từng sản phẩm để gọi API nhập kho
      // Lưu ý: Tốt nhất Backend nên có API nhập hàng loạt (bulk import).
      // Ở đây mình demo gọi vòng lặp theo Controller đã viết trước đó.
      
      const promises = products.map(product => {
        return ProductStoreService.import({
          product_id: product.id,
          qty_import: product.quantity,
          price_root: product.importPrice
        });
      });

      await Promise.all(promises);

      alert("Nhập kho thành công!");
      setProducts([]); // Reset bảng sau khi nhập xong
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi nhập kho. Vui lòng kiểm tra lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Quản Lý Nhập Kho</h1>
                  <p className="text-blue-100 text-sm mt-1">Tạo phiếu nhập hàng mới vào hệ thống</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all backdrop-blur-sm">
                  <Download className="w-5 h-5" />
                  Xuất Excel
                </button>
                <button 
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Thêm sản phẩm
                </button>
              </div>
            </div>
          </div>

          {/* Search & Stats */}
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm trong phiếu nhập..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Số lượng mặt hàng</div>
                  <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                </div>
                <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Tổng tiền nhập</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(getTotalValue())}₫</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sản phẩm</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Đơn vị</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-40">Số lượng nhập</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">Giá vốn</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-48">Thành tiền</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                    <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                            Chưa có sản phẩm nào trong phiếu nhập. Vui lòng thêm sản phẩm.
                        </td>
                    </tr>
                ) : (
                    filteredProducts.map((product, index) => {
                      // const stockStatus = getStockStatus(product.stock); // Tạm ẩn vì đây là phiếu nhập
                      return (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                                <img 
                                    src={product.image.startsWith('http') ? product.image : `http://localhost:8000/storage/${product.image}`} 
                                    onError={(e) => {e.target.onerror = null; e.target.src = "https://placehold.co/60"}}
                                    alt="" 
                                    className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-800 mb-1">{product.name}</h3>
                                <div className="flex items-center gap-3">
                                  <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-lg">
                              {product.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => updateQuantity(product.id, e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              value={product.importPrice}
                              onChange={(e) => updateImportPrice(product.id, e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-right font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {formatCurrency(product.quantity * product.importPrice)}
                            </div>
                          </td>
<td className="px-6 py-4 text-center">
        <button
            onClick={() => removeProduct(product)} // Truyền cả object product vào thay vì chỉ id
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title={product.isSaved ? "Xóa khỏi Kho (Database)" : "Xóa khỏi danh sách tạm"}
        >
            <Trash2 className="w-5 h-5" />
        </button>
    </td>                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Package className="w-4 h-4" />
                Hiển thị <span className="font-semibold text-slate-800">{filteredProducts.length}</span> sản phẩm
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-slate-600 mb-1">Tổng giá trị nhập kho</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(getTotalValue())} ₫
                  </div>
                </div>
                <button 
                  onClick={handleImportGoods}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- MODAL CHỌN SẢN PHẨM (Grid Layout) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Chọn sản phẩm nhập kho</h3>
                <p className="text-sm text-slate-500">Tìm kiếm và chọn sản phẩm từ danh mục</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
            </div>

            {/* Search Bar */}
            <div className="px-5 py-3 border-b border-slate-100">
               <div className="relative">
                 <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5"/>
                 <input 
                   type="text" placeholder="Tìm kiếm sản phẩm theo tên..." 
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                   onChange={(e) => setModalSearch(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && fetchModalProducts(1, modalSearch)}
                 />
               </div>
            </div>

            {/* Grid Product List */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
               {loadingModal ? (
                   <div className="text-center py-10 text-slate-500">Đang tải dữ liệu...</div>
               ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {modalProducts.map(p => {
                        const isSelected = tempSelectedIds.includes(p.id);
                        const isAlreadyAdded = products.some(prod => prod.id === p.id); // Kiểm tra đã có trong bảng nhập chưa

                        return (
                          <div key={p.id} 
                               onClick={() => !isAlreadyAdded && toggleTempSelect(p.id)}
                               className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition-all hover:shadow-md relative overflow-hidden
                                  ${isAlreadyAdded ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}
                                  ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}
                               `}
                          >
                             {/* Checkbox */}
                             <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                             </div>
                             
                             {/* Image */}
                             <div className="w-14 h-14 bg-slate-100 rounded border border-slate-100 shrink-0 overflow-hidden">
                                <img 
                                   src={p.thumbnail ? (p.thumbnail.startsWith('http') ? p.thumbnail : `http://localhost:8000/storage/${p.thumbnail}`) : 'https://placehold.co/60'} 
                                   onError={(e) => {e.target.onerror = null; e.target.src = "https://placehold.co/60"}}
                                   className="w-full h-full object-cover"
                                   alt=""
                                />
                             </div>

                             {/* Info */}
                             <div>
                                <p className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</p>
                                <p className="text-xs text-slate-500">Giá gốc: {formatCurrency(p.price_buy)}</p>
                             </div>

                             {/* Badge đã thêm */}
                             {isAlreadyAdded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 font-bold text-slate-600 text-xs uppercase tracking-wide">Đã chọn</div>
                             )}
                          </div>
                        )
                     })}
                   </div>
               )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
               <div className="flex gap-2">
                  <button 
                    disabled={modalPage === 1}
                    onClick={() => fetchModalProducts(modalPage - 1, modalSearch)}
                    className="px-3 py-1.5 border rounded text-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button 
                    onClick={() => fetchModalProducts(modalPage + 1, modalSearch)}
                    className="px-3 py-1.5 border rounded text-sm hover:bg-slate-50"
                  >
                    Sau
                  </button>
               </div>
               <div className="flex gap-3 items-center">
                  <span className="text-sm font-medium text-slate-600">Đã chọn: <b className="text-blue-600">{tempSelectedIds.length}</b></span>
                  <button onClick={() => setShowModal(false)} className="font-bold text-slate-500 hover:text-slate-700 px-3">Hủy bỏ</button>
                  <button 
                    onClick={confirmSelection} 
                    disabled={tempSelectedIds.length === 0}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Thêm {tempSelectedIds.length} sản phẩm
                  </button>
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
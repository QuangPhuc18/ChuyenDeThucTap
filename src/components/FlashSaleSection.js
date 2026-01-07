'use client'

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard'; 
import ProductSaleService from '../services/ProductSaleService'; // Import Service

export default function FlashSaleSection() {
  const [salesData, setSalesData] = useState([]); // State chứa dữ liệu từ API
  const [loading, setLoading] = useState(true);
  const [saleIndex, setSaleIndex] = useState(0);

  // --- CALL API ---
  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const result = await ProductSaleService.getFlashSales();
        if (result.status && Array.isArray(result.data)) {
          // Mapping dữ liệu từ API Sale sang format của ProductCard
          // API trả về: salePrice, price_buy, discount_percent...
          // ProductCard cần: price, oldPrice, discount...
          const formattedData = result.data.map(item => ({
            id: item.product_id, // Hoặc item.sale_id tùy logic click
            name: item.name,
            price: item.salePrice,      // Giá khuyến mãi
            oldPrice: item.price_buy,   // Giá gốc
            discount: item.discount_percent + '%',
            image: item.image_url,
            badge: 'Flash Sale',
            slug: item.product_id // Dùng ID làm slug tạm nếu chưa có
          }));
          setSalesData(formattedData);
        }
      } catch (error) {
        console.error("Lỗi tải Flash Sale:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
  }, []);

  // Logic Slider
  const nextSlide = () => {
    setSalesData((prev) => {
        // Đảm bảo không vượt quá index
        const maxIndex = Math.max(0, salesData.length - 4);
        if (saleIndex < maxIndex) setSaleIndex(saleIndex + 1);
        return prev; // Trả về state cũ, chỉ update index qua setSaleIndex ở trên hoặc dùng logic khác
    });
    // Cách viết đúng hơn cho setIndex dựa trên state cũ:
    setSaleIndex(prev => Math.min(Math.max(0, salesData.length - 4), prev + 1));
  };

  const prevSlide = () => {
    setSaleIndex(prev => Math.max(0, prev - 1));
  };

  // Nếu đang tải thì hiện Loading hoặc ẩn đi
  if (loading) {
    return (
      <section className="py-20 px-6 bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 min-h-[400px] flex items-center justify-center">
         <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </section>
    );
  }

  // Nếu không có sản phẩm sale nào thì ẩn section này luôn
  if (salesData.length === 0) {
    return null; 
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-full mb-4 animate-pulse">
            <Zap className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wider text-sm">Flash Sale</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Special Offers Today</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Don't miss out! Limited time deals on your favorite drinks and treats
          </p>
        </div>

        {/* Slider */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {salesData.slice(saleIndex, saleIndex + 4).map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                isSale={true} 
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          {salesData.length > 4 && (
            <>
              <button
                onClick={prevSlide}
                disabled={saleIndex === 0}
                className={`absolute -left-6 top-1/2 -translate-y-1/2 bg-white hover:bg-red-600 text-red-600 hover:text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hidden xl:flex items-center justify-center transform hover:scale-110 ${
                  saleIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                disabled={saleIndex >= salesData.length - 4}
                className={`absolute -right-6 top-1/2 -translate-y-1/2 bg-white hover:bg-red-600 text-red-600 hover:text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hidden xl:flex items-center justify-center transform hover:scale-110 ${
                  saleIndex >= salesData.length - 4 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
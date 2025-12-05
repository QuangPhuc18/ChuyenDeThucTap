'use client'

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, Star, Coffee, Snowflake, Leaf, Cake, ShoppingBag, Sparkles, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  // --- CẤU HÌNH ---
  const API_URL = 'http://127.0.0.1:8000/api/products';

  // --- STATE ---
  // State chung chứa dữ liệu từ API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Slider cho 2 phần riêng biệt
  const [topSectionIndex, setTopSectionIndex] = useState(0);    // Slider phần trên (Coffee)
  const [bottomSectionIndex, setBottomSectionIndex] = useState(0); // Slider phần dưới (Dessert cũ)
  
  // Slider cho phần Sale (dữ liệu tĩnh)
  const [saleIndex, setSaleIndex] = useState(0);     

  // --- CALL API ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Lấy limit=20 để đủ chia cho 2 mục nếu cần
        const res = await fetch(`${API_URL}?limit=20`);
        const result = await res.json();
        
        if (result.status) {
          setProducts(result.data);
        }
      } catch (error) {
        console.error("Lỗi kết nối API:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // --- HELPER FUNCTIONS ---
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Hàm lấy ảnh an toàn (Ưu tiên dùng image_url từ backend xử lý)
  const getProductImage = (product) => {
    // 1. Nếu backend đã trả về image_url (do code controller mới thêm)
    if (product.image_url) return product.image_url;
    
    // 2. Nếu là link online
    if (product.image && product.image.startsWith('http')) return product.image;

    // 3. Fallback ảnh mặc định nếu không có ảnh
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80';
  };

  // --- DỮ LIỆU TĨNH (Phần Sale & Testimonials giữ nguyên) ---
  const saleProducts = [
    { id: 'sale-1', name: 'Caramel Macchiato', description: 'Sweet caramel', price: '35.000', oldPrice: '50.000', discount: '30%', image: 'https://images.unsplash.com/photo-1578374173703-96e7e3b78a5b?w=400&q=80', badge: 'Flash Sale' },
    { id: 'sale-2', name: 'Matcha Latte', description: 'Premium Japanese matcha', price: '38.000', oldPrice: '55.000', discount: '31%', image: 'https://images.unsplash.com/photo-1536917123-f0be105046ad?w=400&q=80', badge: 'Hot Deal' },
    { id: 'sale-3', name: 'Berry Freeze', description: 'Refreshing mixed berries', price: '32.000', oldPrice: '48.000', discount: '33%', image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80', badge: 'Limited' },
    { id: 'sale-4', name: 'Chocolate Muffin', description: 'Double chocolate chip', price: '25.000', oldPrice: '38.000', discount: '34%', image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80', badge: 'Best Price' }
  ];

  const testimonials = [
    { id: 1, name: 'Johnsan Smith', role: 'Regular Customer', rating: 5, comment: 'The best coffee experience in town!', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: 2, name: 'Kristian Vial', role: 'Coffee Enthusiast', rating: 5, comment: 'Absolutely love their signature blends!', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: 3, name: 'Emma Thompson', role: 'Food Blogger', rating: 5, comment: 'A hidden gem for coffee lovers!', avatar: 'https://i.pravatar.cc/150?img=3' }
  ];

  // Component Card (Dùng chung cho cả Tĩnh và API)
  const ProductCard = ({ product, isSale, isApi = false }) => {
    // Xử lý dữ liệu
    const name = product.name;
    const desc = product.description || 'Delicious flavor with premium ingredients.';
    
    // Lấy ảnh
    const image = isApi ? getProductImage(product) : product.image;
    
    // Lấy giá (ưu tiên price_buy từ DB)
    const rawPrice = isApi ? (product.price_buy || product.price) : product.price;
    const price = isApi ? formatPrice(rawPrice) : rawPrice;
    
    // Badge
    const badge = product.badge || (isApi ? (product.quantity > 0 ? 'New' : 'Sold Out') : ''); 

    return (
      <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
        <div className="relative overflow-hidden">
          <Link href={`/product/${product.id}`}>
            <img 
              src={image} 
              alt={name}
              className="w-full h-72 object-cover cursor-pointer transform group-hover:scale-110 transition-transform duration-500"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80'; }} 
            />
          </Link>
          
          {/* Badge */}
          {badge && (
            <div className={`absolute top-4 left-4 ${isSale ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'} text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1`}>
              {isSale ? <Zap className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {badge}
            </div>
          )}

          {isSale && product.discount && (
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              -{product.discount}
            </div>
          )}

          {!isSale && (
            <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg">
              <Heart className="w-5 h-5 text-gray-700 hover:text-red-500 hover:fill-red-500 transition-colors" />
            </button>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
            <Link href={`/product/${product.id}`} className="hover:underline">
              {name}
            </Link>
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
            {desc}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
            <div className="flex flex-col">
              {isSale && product.oldPrice && (
                <span className="text-sm text-gray-400 line-through mb-1">
                  {product.oldPrice} VND
                </span>
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {price} VND
              </span>
            </div>
            <button className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2.5 rounded-full hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105 font-medium flex items-center gap-2 whitespace-nowrap">
              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      {/* Categories Section */}
      <div className="bg-white py-16 border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="group text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center group-hover:bg-amber-100 transition-all duration-300 group-hover:scale-110 cursor-pointer">
                <Coffee className="w-12 h-12 text-amber-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">Cà phê</h3>
            </div>
            <div className="group text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-all duration-300 group-hover:scale-110 cursor-pointer">
                <Snowflake className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Freeze</h3>
            </div>
            <div className="group text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-all duration-300 group-hover:scale-110 cursor-pointer">
                <Leaf className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Trà</h3>
            </div>
            <div className="group text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-pink-50 rounded-full flex items-center justify-center group-hover:bg-pink-100 transition-all duration-300 group-hover:scale-110 cursor-pointer">
                <Cake className="w-12 h-12 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">Bánh ngọt</h3>
            </div>
          </div>
        </div>
      </div>

      {/* SALE Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-full mb-4 animate-pulse">
              <Zap className="w-5 h-5" />
              <span className="font-bold uppercase tracking-wider text-sm">Flash Sale</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Special Offers Today</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Don't miss out! Limited time deals on your favorite drinks and treats</p>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {saleProducts.slice(saleIndex, saleIndex + 4).map((product) => (
                <ProductCard key={product.id} product={product} isSale={true} />
              ))}
            </div>
            <button onClick={() => setSaleIndex(Math.max(0, saleIndex - 1))} disabled={saleIndex === 0} className={`absolute -left-6 top-1/2 -translate-y-1/2 bg-white hover:bg-red-600 text-red-600 hover:text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hidden xl:flex items-center justify-center transform hover:scale-110 ${saleIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setSaleIndex(Math.min(Math.max(0, saleProducts.length - 4), saleIndex + 1))} disabled={saleIndex >= saleProducts.length - 4} className={`absolute -right-6 top-1/2 -translate-y-1/2 bg-white hover:bg-red-600 text-red-600 hover:text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hidden xl:flex items-center justify-center transform hover:scale-110 ${saleIndex >= saleProducts.length - 4 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 1: OUR SPECIAL (Top - Thay thế Coffee cũ)        */}
      {/* ========================================================= */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-amber-600 font-semibold mb-2 uppercase tracking-wider text-sm">Premium Selection</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Special</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Handcrafted with passion, served with perfection. Each cup tells a unique story.</p>
          </div>
          
          <div className="relative">
             {loading ? (
                <div className="flex justify-center items-center h-72">
                   <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
                </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.length > 0 ? (
                    // Hiển thị sản phẩm từ API
                    products.slice(topSectionIndex, topSectionIndex + 4).map((product) => (
                      <ProductCard key={product.id} product={product} isSale={false} isApi={true} />
                    ))
                ) : (
                    <p className="col-span-4 text-center text-gray-500">No products available.</p>
                )}
              </div>
            )}
            
            {/* Logic Slider: Nếu có 5 sp, Index max = 5-4 = 1. Bấm Next sẽ hiện sp thứ 5 */}
            {products.length > 4 && (
                <>
                <button 
                    onClick={() => setTopSectionIndex(Math.max(0, topSectionIndex - 1))} 
                    disabled={topSectionIndex === 0}
                    className={`absolute -left-6 top-1/2 -translate-y-1/2 bg-white hover:bg-amber-600 text-amber-600 hover:text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hidden xl:flex items-center justify-center transform hover:scale-110 ${topSectionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => setTopSectionIndex(Math.min(Math.max(0, products.length - 4), topSectionIndex + 1))} 
                    disabled={topSectionIndex >= products.length - 4}
                    className={`absolute -right-6 top-1/2 -translate-y-1/2 bg-white hover:bg-amber-600 text-amber-600 hover:text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hidden xl:flex items-center justify-center transform hover:scale-110 ${topSectionIndex >= products.length - 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
                </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: OUR SPECIAL (Bottom - Thay thế Dessert cũ)    */}
      {/* ========================================================= */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-amber-50/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <p className="text-pink-600 font-semibold mb-2 uppercase tracking-wider text-sm">Sweet Delights</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Special</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Indulge in our artisanal pastries and cakes, baked fresh every day.</p>
          </div>
          
          <div className="relative">
            {loading ? (
                <div className="flex justify-center items-center h-72">
                   <Loader2 className="w-10 h-10 animate-spin text-pink-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {products.length > 0 ? (
                      // Dùng chung danh sách products từ API (có thể đảo ngược hoặc lọc nếu muốn khác biệt)
                      // Ở đây tôi giữ nguyên để bạn thấy cả 5 sản phẩm
                      products.slice(bottomSectionIndex, bottomSectionIndex + 4).map((product) => (
                        <ProductCard key={product.id} product={product} isSale={false} isApi={true} />
                      ))
                  ) : (
                      <p className="col-span-4 text-center text-gray-500 italic">Hiện chưa có sản phẩm nào.</p>
                  )}
                </div>
            )}
            
            {/* Logic Slider tương tự như trên */}
            {products.length > 4 && (
                <>
                <button 
                    onClick={() => setBottomSectionIndex(Math.max(0, bottomSectionIndex - 1))} 
                    disabled={bottomSectionIndex === 0}
                    className={`absolute -left-6 top-1/2 -translate-y-1/2 bg-white hover:bg-pink-600 text-pink-600 hover:text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hidden xl:flex items-center justify-center transform hover:scale-110 ${bottomSectionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => setBottomSectionIndex(Math.min(Math.max(0, products.length - 4), bottomSectionIndex + 1))} 
                    disabled={bottomSectionIndex >= products.length - 4}
                    className={`absolute -right-6 top-1/2 -translate-y-1/2 bg-white hover:bg-pink-600 text-pink-600 hover:text-white rounded-full p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hidden xl:flex items-center justify-center transform hover:scale-110 ${bottomSectionIndex >= products.length - 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                </>
            )}
          </div>
        </div>
      </section>

      {/* Coffee Beans CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-amber-900"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <img src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80" alt="Coffee beans" className="relative w-full h-80 object-cover rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500" />
            </div>
            
            <div className="flex-1 text-center text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Check Out Our<br /><span className="text-amber-300">Premium Coffee Beans</span></h2>
              <p className="text-amber-100 mb-8 text-lg">Sourced from the finest plantations worldwide</p>
              <button className="bg-white text-amber-900 px-10 py-4 rounded-full font-bold hover:bg-amber-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 inline-flex items-center gap-3">
                <ShoppingBag className="w-5 h-5" /> Shop Coffee Beans
              </button>
            </div>
            
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80" alt="Coffee beans scattered" className="relative w-full h-80 object-cover rounded-3xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-amber-600 font-semibold mb-2 uppercase tracking-wider text-sm">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Join thousands of happy customers who trust us for their daily coffee fix</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gradient-to-br from-gray-50 to-amber-50/30 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">"{testimonial.comment}"</p>
                <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover ring-4 ring-amber-100" />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 mt-12">
            <div className="w-3 h-3 rounded-full bg-amber-600"></div>
            <div className="w-3 h-3 rounded-full bg-gray-300 hover:bg-amber-400 cursor-pointer transition-colors"></div>
            <div className="w-3 h-3 rounded-full bg-gray-300 hover:bg-amber-400 cursor-pointer transition-colors"></div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-amber-900 to-orange-800">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Stay Updated with Our Latest Offers</h3>
          <p className="text-amber-100 mb-8">Subscribe to our newsletter and get 10% off your first order</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input type="email" placeholder="Enter your email" className="flex-1 px-6 py-4 rounded-full focus:outline-none focus:ring-4 focus:ring-amber-300" />
            <button className="bg-white text-amber-900 px-8 py-4 rounded-full font-bold hover:bg-amber-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">Subscribe</button>
          </div>
        </div>
      </section>
    </div>
  );
}
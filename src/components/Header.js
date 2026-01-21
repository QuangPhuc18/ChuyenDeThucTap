'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, ChevronLeft, ChevronRight, X, Loader2, User, LogOut, FileText } from 'lucide-react'
import httpAxios from '@/services/httpAxios'
import UserService from '@/services/UserService' // Đảm bảo import UserService

// Placeholder avatar nếu user chưa có ảnh
const AVATAR_PLACEHOLDER = "https://ui-avatars.com/api/?background=random&color=fff&name=";

export default function CoffeeHeader() {
  const router = useRouter();
  
  // --- STATE CŨ (Giữ nguyên) ---
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)

  // --- STATE TÌM KIẾM (Giữ nguyên) ---
  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const searchTimeoutRef = useRef(null)

  // --- STATE USER (MỚI) ---
  const [user, setUser] = useState(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Dữ liệu Carousel (Giữ nguyên)
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&q=80',
      category: 'ARTISAN COFFEE',
      title: 'We serve the richest coffee in the city!',
      description: 'Experience the perfect blend of premium Arabica beans, expertly roasted to bring out rich flavors and aromatic notes.',
      buttonText: 'Order Coffee',
      accentColor: 'amber'
    },
    {
      image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=1600&q=80',
      category: 'PREMIUM TEA',
      title: 'Discover the essence of premium tea leaves',
      description: 'Indulge in our carefully curated selection of organic teas, sourced from the finest tea gardens around the world.',
      buttonText: 'Explore Tea',
      accentColor: 'emerald'
    },
    {
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
      category: 'COZY ATMOSPHERE',
      title: 'Your perfect place to relax and unwind',
      description: 'From classic espresso to exotic tea blends, every cup is crafted with precision in our warm, welcoming space.',
      buttonText: 'Visit Us',
      accentColor: 'orange'
    }
  ]

  // Logic Giỏ hàng (Giữ nguyên)
  useEffect(() => {
    const updateCount = () => {
      try {
        const raw = localStorage.getItem('cart')
        const items = raw ? JSON.parse(raw) : []
        const count = items.reduce((s, i) => s + (i.quantity || 1), 0)
        setCartCount(count)
      } catch (e) {
        setCartCount(0)
      }
    }
    updateCount()
    window.addEventListener('cart:update', updateCount)
    window.addEventListener('storage', updateCount)
    return () => {
      window.removeEventListener('cart:update', updateCount)
      window.removeEventListener('storage', updateCount)
    }
  }, [])

  // Auto-play carousel (Giữ nguyên)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  // --- LOGIC USER (MỚI) ---
  useEffect(() => {
    const fetchUser = async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                // Lấy thông tin user từ localStorage nếu có (để hiển thị nhanh)
                const cachedUser = localStorage.getItem('user');
                if (cachedUser) setUser(JSON.parse(cachedUser));

                // Gọi API lấy thông tin mới nhất
                const res = await UserService.getProfile();
                if (res && res.data) {
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                }
            } catch (error) {
                console.error("Lỗi lấy thông tin user:", error);
                // Nếu lỗi token hết hạn -> logout
                if (error.response && error.response.status === 401) {
                    handleLogout();
                }
            }
        }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
      await UserService.logout();
      setUser(null);
      setIsUserMenuOpen(false);
      router.push('/auth/login');
  };

  // --- LOGIC TÌM KIẾM ---
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setKeyword(value);

    if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
        setSearchResults([]);
        return;
    }

    setLoadingSearch(true);
    searchTimeoutRef.current = setTimeout(async () => {
        try {
            const res = await httpAxios.get(`products?search=${value}&limit=5`);
            if (res.data && res.data.data) {
                setSearchResults(res.data.data);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            setSearchResults([]);
        } finally {
            setLoadingSearch(false);
        }
    }, 500);
  };

  const clearSearch = () => {
      setKeyword('');
      setSearchResults([]);
  }

  // --- HELPER FUNCTION ---
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  
  const getAccentColorClass = (color) => {
    const colors = { amber: 'text-amber-200', emerald: 'text-emerald-200', orange: 'text-orange-200' }
    return colors[color] || colors.amber
  }
  
  const getButtonColorClass = (color) => {
    const colors = { amber: 'hover:bg-amber-200', emerald: 'hover:bg-emerald-200', orange: 'hover:bg-orange-200' }
    return colors[color] || colors.amber
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0 đ';
    const numberAmount = Number(amount);
    return isNaN(numberAmount) 
      ? 'Liên hệ' 
      : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numberAmount);
  }

  // Xử lý avatar URL
  const getAvatarUrl = (user) => {
      if (!user) return null;
      if (user.avatar) {
          return user.avatar.startsWith('http') 
            ? user.avatar 
            : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'}/storage/${user.avatar}`;
      }
      return AVATAR_PLACEHOLDER + encodeURIComponent(user.name);
  };

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="text-white flex items-center space-x-6">
              <h1 className="text-2xl font-serif italic">coffea</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-white text-sm font-medium hover:text-amber-200 transition">Trang chủ</a>
              <a href="/profile" className="text-white text-sm font-medium hover:text-amber-200 transition">Trang cá nhân</a>
              <a href="/posts" className="text-white text-sm font-medium hover:text-amber-200 transition">Bài viết</a>
              <a href="/product" className="text-white text-sm font-medium hover:text-amber-200 transition">Cửa hàng</a>
              <a href="/Contact" className="text-white text-sm font-medium hover:text-amber-200 transition">Liên hệ</a>
            </nav>

            {/* Actions: Search + Cart + User */}
            <div className="flex items-center space-x-4">
              {/* Search Icon */}
              <button
                onClick={() => {
                    setIsSearchOpen(!isSearchOpen);
                    if (!isSearchOpen) setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
                }}
                className="text-white hover:text-amber-200 transition p-2 rounded"
              >
                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              {/* Cart Icon */}
              <Link href="/cart" className="relative text-white hover:text-amber-200 transition p-2 rounded">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User Account Section (New) */}
              {user ? (
                  <div className="relative">
                      <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 pl-2 border-l border-white/20 ml-2 focus:outline-none"
                      >
                          <img 
                            src={getAvatarUrl(user)} 
                            alt={user.name} 
                            className="w-8 h-8 rounded-full object-cover border-2 border-amber-200/50"
                          />
                          <span className="text-white text-sm font-medium hidden lg:block truncate max-w-[100px]">
                              {user.name}
                          </span>
                      </button>

                      {/* User Dropdown Menu */}
                      {isUserMenuOpen && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl py-2 animate-fade-in z-50">
                              <div className="px-4 py-2 border-b border-gray-100">
                                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              </div>
                              <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">
                                  <User size={16} /> Hồ sơ cá nhân
                              </Link>
                              <Link href="/my-orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">
                                  <FileText size={16} /> Đơn hàng của tôi
                              </Link>
                              <div className="border-t border-gray-100 mt-1"></div>
                              <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                              >
                                  <LogOut size={16} /> Đăng xuất
                              </button>
                          </div>
                      )}
                      
                      {/* Overlay để đóng menu khi click ra ngoài */}
                      {isUserMenuOpen && (
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsUserMenuOpen(false)}
                          ></div>
                      )}
                  </div>
              ) : (
                  // Nút Đăng nhập khi chưa có user
                  <Link 
                    href="/auth/login" 
                    className="text-white text-sm font-medium hover:text-amber-200 transition border border-white/30 px-4 py-1.5 rounded-full hover:bg-white/10"
                  >
                    Đăng nhập
                  </Link>
              )}
            </div>
          </div>

          {/* --- SEARCH DROPDOWN --- */}
          <div className={`mt-4 transition-all duration-300 ease-in-out relative ${isSearchOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
            {isSearchOpen && (
                <div className="w-full max-w-2xl mx-auto relative">
                    {/* Input Field */}
                    <div className="relative">
                        <input
                            id="searchInput"
                            type="text"
                            value={keyword}
                            onChange={handleSearchChange}
                            placeholder="Bạn muốn tìm sản phẩm gì?"
                            className="w-full bg-white text-gray-900 rounded-t-lg rounded-b-lg border-0 px-10 py-3 shadow-lg focus:ring-0 text-base"
                            autoComplete="off"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        {loadingSearch && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={20} />}
                        {keyword && !loadingSearch && (
                            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown Results */}
                    {keyword && (
                        <div className="absolute top-full left-0 right-0 bg-white rounded-b-lg shadow-2xl overflow-hidden mt-1 z-50 text-gray-800">
                            
                            {/* Gợi ý từ khóa */}
                            <div className="p-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-500 mb-2">Có phải bạn muốn tìm</p>
                                <ul className="space-y-1 text-sm">
                                    <li>
                                        <Link href={`/product?search=${keyword}`} className="flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded transition">
                                            <Search size={14} className="text-gray-400" /> 
                                            <span>Sản phẩm liên quan đến "<strong>{keyword}</strong>"</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Danh sách sản phẩm */}
                            <div className="p-3">
                                <p className="text-sm font-semibold text-gray-500 mb-2">Sản phẩm gợi ý</p>
                                {loadingSearch ? (
                                    <div className="text-center py-4 text-gray-400 text-sm">Đang tìm kiếm...</div>
                                ) : searchResults.length > 0 ? (
                                    <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        {searchResults.map((product) => {
                                            const imageUrl = product.image_url || (product.thumbnail ? `http://127.0.0.1:8000/storage/${product.thumbnail}` : null);
                                            const displayPrice = product.price_buy;

                                            return (
                                                <Link 
                                                    key={product.id} 
                                                    href={`/product/${product.id}`} 
                                                    className="flex items-center gap-4 hover:bg-gray-50 p-2 rounded-lg transition group"
                                                >
                                                    {/* Ảnh sản phẩm */}
                                                    <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                                        {imageUrl ? (
                                                            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Thông tin */}
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-amber-600 transition line-clamp-2">
                                                            {product.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-red-600 font-bold text-sm">
                                                                {formatCurrency(displayPrice)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500 text-sm">
                                        Không tìm thấy sản phẩm nào phù hợp.
                                    </div>
                                )}
                            </div>
                            
                            {/* Footer Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                                    <Link href={`/product?search=${keyword}`} className="text-sm text-blue-600 hover:underline">
                                        Xem tất cả kết quả
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Carousel (Giữ nguyên) */}
      <div className="relative min-h-screen overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide ? 'opacity-100 translate-x-0' : index < currentSlide ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'
            }`}
            style={{ backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
            <div className="container mx-auto px-6 relative z-10 h-full flex items-center">
              <div className="max-w-2xl">
                <p className={`${getAccentColorClass(slide.accentColor)} text-sm font-medium tracking-wider mb-4 animate-fade-in`}>{slide.category}</p>
                <h2 className="text-white text-5xl md:text-6xl font-serif leading-tight mb-6 animate-slide-up">{slide.title}</h2>
                <p className="text-white/90 text-lg mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>{slide.description}</p>
                <button className={`bg-white text-gray-900 px-8 py-3 rounded-full font-medium ${getButtonColorClass(slide.accentColor)} transition transform hover:scale-105 shadow-lg animate-slide-up`} style={{ animationDelay: '0.2s' }}>{slide.buttonText}</button>
              </div>
            </div>
          </div>
        ))}

        <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition transform hover:scale-110">
          <ChevronLeft size={24} />
        </button>
        <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition transform hover:scale-110">
          <ChevronRight size={24} />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 ${index === currentSlide ? 'w-12 bg-white' : 'w-3 bg-white/50 hover:bg-white/70'} h-3 rounded-full`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ccc; }
      `}</style>
    </div>
  )
}
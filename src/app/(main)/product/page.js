'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation' // Import useSearchParams
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Heart,
  ShoppingBag,
  Star,
  Filter
} from 'lucide-react'

// Đảm bảo URL này khớp với cấu hình .env của bạn
const API_BASE = 'http://127.0.0.1:8000/api';
const IMAGE_FALLBACK = '/images/placeholder.png'

// --- HELPER FUNCTIONS ---
const formatPrice = (v) => {
  if (v == null || v === '' || isNaN(Number(v))) return '-'
  return Number(v).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫'
}

function getPaginationPages(totalPages, currentPage) {
  const pages = []
  totalPages = Number(totalPages) || 1
  currentPage = Number(currentPage) || 1
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }
  
  pages.push(1)
  if (currentPage > 4) pages.push('left-ellipsis')
  
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  
  for (let i = start; i <= end; i++) pages.push(i)
  
  if (currentPage < totalPages - 3) pages.push('right-ellipsis')
  pages.push(totalPages)
  
  return pages.filter((v, idx, arr) => arr.indexOf(v) === idx)
}

const mapProduct = (p) => {
  // Logic lấy ảnh: Ưu tiên image_url, nếu không có thì lấy thumbnail (thêm domain), cuối cùng fallback
  let imageUrl = p.image_url;
  if (!imageUrl && p.thumbnail) {
      imageUrl = `http://127.0.0.1:8000/storage/${p.thumbnail}`;
  }
  if (!imageUrl) imageUrl = IMAGE_FALLBACK;

  return {
    id: p.id,
    slug: p.slug || p.id,
    name: p.name,
    price: p.price_buy || 0,
    oldPrice: null,
    image: imageUrl,
    badge: null,
    description: p.description
  }
}

// --- COMPONENT: ProductCard ---
function ProductCard({ product, onAdd, viewMode }) {
  const detailLink = `/product/${product.id}`; 
  const isListView = viewMode === 'list'

  if (isListView) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex">
        <Link href={detailLink} className="w-64 flex-shrink-0">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
            onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK }} 
          />
        </Link>
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <Link href={detailLink}>
                <h3 className="font-bold text-xl text-gray-900 hover:text-amber-700 transition-colors">
                  {product.name}
                </h3>
              </Link>
              <button className="p-2 hover:bg-red-50 rounded-full transition-colors">
                <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {product.description || 'Mô tả đang cập nhật...'}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-amber-700">{formatPrice(product.price)}</span>
            <div className="flex gap-2">
              <Link 
                href={detailLink} 
                className="px-6 py-3 border-2 border-amber-700 text-amber-700 rounded-full font-semibold hover:bg-amber-50"
              >
                Chi tiết
              </Link>
              <button 
                onClick={() => onAdd(product)} 
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full font-semibold hover:to-orange-700 flex items-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" /> Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      <div className="relative overflow-hidden h-64">
        <Link href={detailLink}>
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover cursor-pointer transform group-hover:scale-110 transition-transform duration-500" 
            onError={(e) => { e.currentTarget.src = IMAGE_FALLBACK }} 
          />
        </Link>
        <button className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all">
          <Heart className="w-5 h-5 text-gray-700 hover:text-red-500" />
        </button>
      </div>
      <div className="p-5">
        <Link href={detailLink}>
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-amber-700 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-amber-700">{formatPrice(product.price)}</span>
        </div>
        <button 
          onClick={() => onAdd(product)} 
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2.5 rounded-lg font-semibold hover:to-orange-700 flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Thêm vào giỏ
        </button>
      </div>
    </div>
  )
}

// --- MAIN PAGE ---
export default function ProductListPage() {
  const searchParams = useSearchParams(); 

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [showFilters, setShowFilters] = useState(true)
  
  // STATE UI
  const [uiSearch, setUiSearch] = useState('')
  const [uiCategory, setUiCategory] = useState('all')
  const [uiPriceRange, setUiPriceRange] = useState('all')
  const [uiSortBy, setUiSortBy] = useState('newest')

  // STATE API
  const [queryFilters, setQueryFilters] = useState({
    search: '',
    category: 'all',
    priceRange: 'all',
    sort: 'newest'
  })

  const [viewMode, setViewMode] = useState('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // ✅ SỬA SỐ LƯỢNG SẢN PHẨM MỖI TRANG TẠI ĐÂY
  const itemsPerPage = 8; 

  // DATA CONFIG
  const categories = [
    { id: 'all', name: 'Tất cả', icon: '🏪' },
    { id: 1, name: 'Cà phê', icon: '☕' },
    { id: 2, name: 'Trà', icon: '🍵' }, 
    { id: 3, name: 'Freeze', icon: '🧊' },    
    { id: 4, name: 'Bánh ngọt', icon: '🍰' },
    { id: 8, name: 'Kem', icon: '🍦' }     
  ]

  const priceRanges = [
    { id: 'all', label: 'Tất cả giá', min: null, max: null },
    { id: 'under-30k', label: 'Dưới 30.000₫', min: 0, max: 30000 },
    { id: '30k-70k', label: '30.000₫ - 70.000₫', min: 30000, max: 70000 },
    { id: 'above-70k', label: 'Trên 70.000₫', min: 70000, max: null }
  ]

  const sortOptions = [
    { id: 'newest', label: 'Mới nhất' },
    { id: 'price-asc', label: 'Giá: Thấp → Cao' },
    { id: 'price-desc', label: 'Giá: Cao → Thấp' },
    { id: 'name', label: 'Tên A-Z' }
  ]

  // EFFECT: Đọc URL Params
  useEffect(() => {
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');

    if (categoryId) {
        setUiCategory(Number(categoryId));
        setQueryFilters(prev => ({ ...prev, category: Number(categoryId) }));
    }
    
    if (search) {
        setUiSearch(search);
        setQueryFilters(prev => ({ ...prev, search: search }));
    }
  }, [searchParams]);

  // EFFECT: Gọi API
  useEffect(() => {
    loadProducts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [queryFilters, currentPage])

  // --- ACTIONS ---
  const handleApplyFilters = () => {
    setCurrentPage(1)
    setQueryFilters({
      search: uiSearch,
      category: uiCategory,
      priceRange: uiPriceRange,
      sort: uiSortBy
    })
  }

  const clearFilters = () => {
    setUiSearch('')
    setUiCategory('all')
    setUiPriceRange('all')
    setUiSortBy('newest')
    
    setCurrentPage(1)
    setQueryFilters({
      search: '',
      category: 'all',
      priceRange: 'all',
      sort: 'newest'
    })
  }

  async function loadProducts() {
    setLoading(true)
    setError('')
    try {
      const url = new URL(`${API_BASE}/products`)
      
      if (queryFilters.search.trim()) url.searchParams.set('search', queryFilters.search.trim())
      
      if (queryFilters.category && queryFilters.category !== 'all') {
          url.searchParams.set('category_id', queryFilters.category)
      }

      if (queryFilters.priceRange && queryFilters.priceRange !== 'all') {
        const range = priceRanges.find(r => r.id === queryFilters.priceRange)
        if (range) {
          if (range.min !== null) url.searchParams.set('price_min', range.min)
          if (range.max !== null) url.searchParams.set('price_max', range.max)
        }
      }

      url.searchParams.set('sort', queryFilters.sort)
      url.searchParams.set('page', currentPage)
      url.searchParams.set('limit', itemsPerPage)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Không thể lấy dữ liệu sản phẩm')
      const data = await res.json()
      
      const list = data.data || []
      setProducts(list.map(mapProduct))

      const meta = data.meta || {}
      setTotalItems(meta.total || 0)
      setTotalPages(meta.last_page || 1)

    } catch (e) {
      console.error(e)
      setError(e.message || 'Lỗi khi tải sản phẩm')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product) => {
    try {
      const raw = localStorage.getItem('cart')
      const items = raw ? JSON.parse(raw) : []
      const idx = items.findIndex(i => i.id === product.id)
      
      if (idx >= 0) {
        items[idx].quantity = (items[idx].quantity || 1) + 1
      } else {
        items.push({ 
            id: product.id, 
            name: product.name, 
            price: product.price || 0, 
            quantity: 1, 
            image: product.image || null 
        })
      }
      
      localStorage.setItem('cart', JSON.stringify(items))
      window.dispatchEvent(new Event('cart:update'))
      alert('Đã thêm vào giỏ hàng')
    } catch (e) {
      console.error('Add to cart error', e)
      alert('Không thể thêm vào giỏ hàng')
    }
  }

  const hasActiveFilters = 
    uiSearch !== '' || 
    uiCategory !== 'all' || 
    uiPriceRange !== 'all' || 
    uiSortBy !== 'newest'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-800 text-white py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Khám phá Menu</h1>
          <p className="text-amber-100">Tìm kiếm và lựa chọn món yêu thích của bạn</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        
        {/* THANH TÌM KIẾM & NÚT TOGGLE */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                value={uiSearch} 
                onChange={(e) => setUiSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} 
                placeholder="Tìm kiếm sản phẩm..." 
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600 transition-colors" 
              />
              <button 
                onClick={handleApplyFilters} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-amber-600 rounded-full"
              >
                <ChevronRight className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="flex gap-3 w-full lg:w-auto">
              <button onClick={() => setShowFilters(!showFilters)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-amber-600 transition-colors">
                <SlidersHorizontal className="w-5 h-5" /> <span className="font-medium">Bộ lọc</span>
              </button>
              <div className="flex gap-2 border-2 border-gray-200 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-amber-600 text-white' : 'hover:bg-gray-100'}`}><Grid3x3 className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-amber-600 text-white' : 'hover:bg-gray-100'}`}><List className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR BỘ LỌC */}
          {showFilters && (
            <aside className="lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Bộ lọc</h2>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-sm text-red-600 hover:underline flex items-center gap-1">
                        <X className="w-4 h-4" /> Xóa
                    </button>
                  )}
                </div>

                {/* Filter Danh mục */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Danh mục</h3>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setUiCategory(cat.id)} 
                        className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${uiCategory === cat.id ? 'bg-amber-100 text-amber-900 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        <span className="text-xl">{cat.icon}</span> <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Giá */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Khoảng giá</h3>
                  <div className="space-y-2">
                    {priceRanges.map(range => (
                      <button 
                        key={range.id} 
                        onClick={() => setUiPriceRange(range.id)} 
                        className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${uiPriceRange === range.id ? 'bg-amber-100 text-amber-900 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Sắp xếp */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Sắp xếp theo</h3>
                  <div className="space-y-2">
                    {sortOptions.map(option => (
                      <button 
                        key={option.id} 
                        onClick={() => setUiSortBy(option.id)} 
                        className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors ${uiSortBy === option.id ? 'bg-amber-100 text-amber-900 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* NÚT ÁP DỤNG */}
                <button 
                    onClick={handleApplyFilters}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-bold shadow-md hover:from-amber-700 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
                >
                    <Filter className="w-5 h-5" />
                    Áp dụng bộ lọc
                </button>

              </div>
            </aside>
          )}

          {/* MAIN CONTENT */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">Hiển thị <span className="font-semibold text-gray-900">{products.length}</span> trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> sản phẩm</p>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải sản phẩm...</p>
                    </div>
                </div>
            )}
            
            {error && <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center"><p className="text-red-600 font-semibold">{error}</p></div>}

            {!loading && !error && (
              <>
                {products.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-12 text-center">
                    <div className="text-6xl mb-4">🔍</div><h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                    <p className="text-gray-600 mb-6">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    {hasActiveFilters && <button onClick={clearFilters} className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors">Xóa bộ lọc</button>}
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-6'}>
                    {products.map(p => <ProductCard key={p.id} product={p} onAdd={handleAddToCart} viewMode={viewMode} />)}
                  </div>
                )}

                {/* Phân trang (Sẽ tự hiển thị nếu tổng sản phẩm > 8) */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-3 rounded-lg border-2 border-gray-200 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                    {getPaginationPages(totalPages, currentPage).map((item, idx) => (
                      item === 'left-ellipsis' || item === 'right-ellipsis' ? <span key={`${item}-${idx}`} className="px-2 select-none">...</span> :
                      <button key={item} onClick={() => setCurrentPage(Number(item))} className={`min-w-[44px] h-[44px] rounded-lg font-semibold transition-all ${currentPage === item ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg' : 'border-2 border-gray-200 hover:border-amber-600 text-gray-700'}`}>{item}</button>
                    ))}
                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-3 rounded-lg border-2 border-gray-200 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
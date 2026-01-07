// 'use client'
// import Link from 'next/link'

// export default function ProductCard({ product }) {
//   const slug = product.slug || `product-${product.id}`

//   return (
//     <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition group">
//       <div className="relative">
//         {/* Link bọc ảnh (KHÔNG dùng <a> bên trong) */}
//         <Link href={`/product/${slug}`}>
//           <img
//             src={product.image || '/images/placeholder.png'}
//             alt={product.name}
//             className="w-full h-64 object-cover cursor-pointer"
//           />
//         </Link>

//         <button className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-red-50 transition">
//           {/* placeholder cho icon */}
//           <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
//             <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
//           </svg>
//         </button>
//       </div>

//       <div className="p-6">
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">
//           <Link href={`/product/${slug}`} className="hover:underline text-inherit">
//             {product.name}
//           </Link>
//         </h3>
//         <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
//         <div className="flex items-center justify-between">
//           <span className="text-2xl font-bold text-gray-900">{product.price}</span>
//           <button className="bg-amber-900 text-white px-6 py-2 rounded-md hover:bg-amber-800 transition">Buy Now</button>
//         </div>
//       </div>
//     </div>
//   )
// }
'use client'

import Link from 'next/link'
import { Heart, ShoppingBag, Zap, Sparkles } from 'lucide-react'

// Helper format giá
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN').format(price);
};

// Helper lấy ảnh an toàn
const getProductImage = (product) => {
  if (product.image_url) return product.image_url;
  if (product.image && product.image.startsWith('http')) return product.image;
  return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80';
};

export default function ProductCard({ product, isSale = false }) {
  // Chuẩn hóa dữ liệu (xử lý sự khác biệt giữa data tĩnh và data từ API)
  const name = product.name;
  const desc = product.description || 'Hương vị tuyệt hảo từ nguyên liệu cao cấp.';
  const image = getProductImage(product);
  
  // Giá: ưu tiên giá sau giảm (nếu có trong DB) hoặc giá thường
  const rawPrice = product.price_buy || product.price || 0;
  // Ép kiểu về số để format nếu dữ liệu là string
  const displayPrice = formatPrice(Number(rawPrice.toString().replace(/\./g, ''))); 
  const displayOldPrice = product.oldPrice ? formatPrice(Number(product.oldPrice.toString().replace(/\./g, ''))) : null;

  const badge = product.badge || (product.created_at ? 'New' : '');

  // Cấu hình màu sắc dựa trên isSale
  const theme = isSale 
    ? { text: 'text-red-600', bg: 'bg-red-600', from: 'from-red-500', to: 'to-pink-500' }
    : { text: 'text-amber-700', bg: 'bg-amber-600', from: 'from-amber-500', to: 'to-orange-500' };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
      <div className="relative overflow-hidden h-72">
        <Link href={`/product/${product.id}`}>
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover cursor-pointer transform group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80'; }} 
          />
        </Link>
        
        {/* Badge */}
        {badge && (
          <div className={`absolute top-4 left-4 bg-gradient-to-r ${theme.from} ${theme.to} text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1`}>
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
          <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg group/btn">
            <Heart className="w-5 h-5 text-gray-700 group-hover/btn:text-red-500 group-hover/btn:fill-red-500 transition-colors" />
          </button>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className={`text-xl font-bold text-gray-900 mb-2 group-hover:${theme.text} transition-colors`}>
          <Link href={`/product/${product.id}`} className="hover:underline">
            {name}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
          {desc}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div className="flex flex-col">
            {displayOldPrice && (
              <span className="text-sm text-gray-400 line-through mb-1">
                {displayOldPrice} ₫
              </span>
            )}
            <span className={`text-2xl font-bold bg-gradient-to-r ${theme.from} ${theme.to} bg-clip-text text-transparent`}>
              {displayPrice} ₫
            </span>
          </div>
          <button className={`bg-gradient-to-r ${theme.from} ${theme.to} text-white px-4 py-2.5 rounded-full hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105 font-medium flex items-center gap-2 whitespace-nowrap`}>
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Mua ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
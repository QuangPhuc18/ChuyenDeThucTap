// import Link from 'next/link'

// export const metadata = {
//   title: 'Chi tiết sản phẩm'
// }

// // Server component hiển thị chi tiết; sửa Link quay lại không dùng <a>
// export default async function ProductPage({ params }) {
//   const { slug } = params

//   // Mock data (thay bằng fetch từ API khi có)
//   const product = {
//     id: slug,
//     name: `Tên sản phẩm (${slug})`,
//     description: 'Mô tả chi tiết sản phẩm, thông số kỹ thuật, lợi ích, thông tin bảo hành...',
//     price: 'Rs. 250',
//     image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80'
//   }

//   if (!product) {
//     return <div className="container mx-auto px-4 py-8">Không tìm thấy sản phẩm</div>
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="mb-4">
//         <Link href="/product" className="text-sm text-blue-600">← Quay lại danh sách sản phẩm</Link>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//         <div>
//           <img src={product.image} alt={product.name} className="w-full h-[480px] object-cover rounded-md" />
//         </div>
//         <div>
//           <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
//           <div className="text-2xl text-red-600 font-semibold mb-4">{product.price}</div>
//           <p className="text-gray-700 mb-6">{product.description}</p>

//           <div className="flex gap-3">
//             <button className="bg-amber-900 text-white px-6 py-2 rounded-md hover:bg-amber-800">Thêm vào giỏ</button>
//             <button className="border px-6 py-2 rounded-md">Mua ngay</button>
//           </div>
//         </div>
//       </div>

//       <section className="mt-12">
//         <h2 className="text-xl font-semibold mb-3">Chi tiết sản phẩm</h2>
//         <p className="text-gray-700">Chi tiết kỹ thuật, kích thước, trọng lượng, bảo hành, v.v.</p>
//       </section>
//     </div>
//   )
// }
import Link from 'next/link'
import ImageGallery from '../../../../components/ImageGallery'
import SizeSelector from '../../../../components/SizeSelector'

export const metadata = {
  title: 'Chi tiết sản phẩm'
}

// Server component
export default async function ProductPage({ params }) {
  const { slug } = params

  // Mock data - thay bằng fetch API thực tế
  const product = {
    id: slug,
    name: `Cà Phê Đen Đá (${slug})`,
    description: 'Cà phê đen đá truyền thống được pha từ hạt cà phê Robusta nguyên chất 100%, rang xay theo công thức độc quyền. Hương vị đậm đà, thơm nồng đặc trưng của cà phê Việt Nam, mang đến năng lượng tràn đầy cho cả ngày dài.',
    price: '35.000đ',
    oldPrice: '45.000đ',
    discount: '22%',
    rating: 4.9,
    reviews: 256,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    secondaryImage: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80',
    category: '☕ Cà phê'
  }

  const relatedProducts = [
    {
      id: 'product-1',
      name: 'Cà Phê Sữa Đá',
      price: '32.000đ',
      oldPrice: '40.000đ',
      image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80',
      tag: 'Bán chạy'
    },
    {
      id: 'product-2',
      name: 'Trà Đào Cam Sả',
      price: '45.000đ',
      oldPrice: '55.000đ',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
      tag: 'Mới'
    },
    {
      id: 'product-3',
      name: 'Freeze Chocolate',
      price: '52.000đ',
      oldPrice: '65.000đ',
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80',
      tag: 'Hot'
    },
    {
      id: 'product-4',
      name: 'Trà Sữa Trân Châu',
      price: '38.000đ',
      oldPrice: '48.000đ',
      image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80',
      tag: 'Yêu thích'
    }
  ]

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h1>
        <Link href="/product" className="text-amber-700 hover:underline">← Quay lại menu</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/" className="text-gray-600 hover:text-amber-700 transition-colors">Trang chủ</Link>
          <span className="text-gray-400">/</span>
          <Link href="/product" className="text-gray-600 hover:text-amber-700 transition-colors">Menu</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        {/* Product Detail Section */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-12 border border-amber-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-10">
            {/* Image Gallery */}
            <ImageGallery
              mainImage={product.image}
              secondaryImage={product.secondaryImage}
              productName={product.name}
            />

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  🔥 -{product.discount} OFF
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  ✓ Còn hàng
                </span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                  {product.category}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xl ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-900">{product.rating}</span>
                <span className="text-sm text-gray-500">({product.reviews} đánh giá)</span>
              </div>

              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-4xl font-bold text-amber-700">{product.price}</span>
                <span className="text-2xl text-gray-400 line-through">{product.oldPrice}</span>
              </div>

              <p className="text-gray-700 leading-relaxed mb-8 text-base">
                {product.description}
              </p>

              {/* Size Selection */}
              <SizeSelector />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                  🛒 Thêm vào giỏ
                </button>
                <button className="flex-1 border-2 border-amber-600 text-amber-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-50 transition-all transform hover:scale-105">
                  ⚡ Đặt ngay
                </button>
              </div>

              {/* Product Features */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-lg">🚚</span>
                  <div>
                    <div className="font-semibold text-gray-900">Giao hàng nhanh 30 phút</div>
                    <div className="text-sm text-gray-600">Miễn phí ship cho đơn từ 50.000đ</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg">☕</span>
                  <div>
                    <div className="font-semibold text-gray-900">Pha chế tươi mới</div>
                    <div className="text-sm text-gray-600">100% nguyên liệu tự nhiên, không chất bảo quản</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-lg">🎁</span>
                  <div>
                    <div className="font-semibold text-gray-900">Tích điểm thưởng</div>
                    <div className="text-sm text-gray-600">Đổi quà hấp dẫn cho khách hàng thân thiết</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tab */}
          <div className="border-t border-gray-200 px-6 lg:px-10 py-8 bg-gradient-to-b from-amber-50 to-orange-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📋</span> Thông tin chi tiết
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
              <div className="space-y-3 bg-white p-5 rounded-xl shadow-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-semibold">Nguyên liệu:</span>
                  <span>Cà phê Robusta 100%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-semibold">Độ đắng:</span>
                  <span>⚫⚫⚫⚫⚪ (4/5)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-semibold">Nhiệt độ:</span>
                  <span>Đá / Nóng</span>
                </div>
              </div>
              <div className="space-y-3 bg-white p-5 rounded-xl shadow-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-semibold">Xuất xứ:</span>
                  <span>Việt Nam</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-semibold">Calories:</span>
                  <span>~5 kcal (size M)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-semibold">Topping:</span>
                  <span>Có thể thêm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-3xl">🍹</span> Món khác có thể bạn thích
            </h2>
            <Link href="/product" className="text-amber-700 hover:underline font-semibold text-lg">
              Xem menu →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(item => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 border border-amber-100"
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {item.tag}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors min-h-[3rem]">
                    {item.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-amber-700">{item.price}</span>
                    <span className="text-sm text-gray-400 line-through">{item.oldPrice}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
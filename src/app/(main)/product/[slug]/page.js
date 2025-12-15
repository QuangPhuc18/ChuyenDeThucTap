import Link from 'next/link';
import ImageGallery from '../../../../components/ImageGallery';
import SizeSelector from '../../../../components/SizeSelector';

// Import Service (Điều chỉnh đường dẫn tương đối tùy theo cấu trúc thư mục của bạn)
// Ví dụ: nếu file này ở app/product/[slug]/page.js thì đường dẫn là ../../../services/ProductService
import ProductService from '@/services/ProductService'; 

// Hàm lấy dữ liệu (Chạy trên Server)
async function getProductData(id) {
  try {
    const productData = await ProductService.getById(id);
    // Lấy danh sách để làm mục "Có thể bạn thích", lấy limit lớn chút để random
    const relatedData = await ProductService.getList({ limit: 20 }); 
    
    return {
      product: productData.status ? productData.data : null,
      relatedList: relatedData.status ? relatedData.data : []
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { product: null, relatedList: [] };
  }
}

export const metadata = {
  title: 'Chi tiết sản phẩm'
};

// Server Component
export default async function ProductPage({ params }) {
  // Trong Next.js 15+, params cần được await
  const { slug } = await params; // Ở đây slug chính là ID sản phẩm (theo cấu trúc link hiện tại)

  // 1. Lấy dữ liệu từ API
  const { product: apiProduct, relatedList } = await getProductData(slug);

  // Xử lý trường hợp không tìm thấy
  if (!apiProduct) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h1>
        <Link href="/" className="text-amber-700 hover:underline">← Quay lại trang chủ</Link>
      </div>
    );
  }

  // 2. Helper format tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Helper mapping Category ID sang tên (Vì API chỉ trả category_id)
  const getCategoryName = (id) => {
    const map = { 1: '☕ Cà phê', 2: '🍵 Trà', 3: '❄️ Freeze', 4: '🍰 Bánh ngọt' };
    return map[id] || 'Sản phẩm';
  };

  // 3. Chuyển đổi dữ liệu API sang format UI
  const product = {
    id: apiProduct.id,
    name: apiProduct.name,
    // Nếu không có mô tả, dùng text mặc định
    description: apiProduct.description || 'Hương vị đậm đà, thơm nồng đặc trưng, mang đến năng lượng tràn đầy cho cả ngày dài.',
    price: formatPrice(apiProduct.price_buy),
    // Giả lập giá cũ cao hơn 20% để hiện discount
    oldPrice: formatPrice(apiProduct.price_buy * 1.2), 
    discount: '20%', 
    rating: 4.9, // Mock data
    reviews: 256, // Mock data
    // Dùng image_url từ backend, nếu không có thì dùng ảnh placeholder
    image: apiProduct.image_url || 'https://via.placeholder.com/800x800?text=No+Image',
    secondaryImage: apiProduct.image_url || 'https://via.placeholder.com/800x800?text=No+Image',
    category: getCategoryName(apiProduct.category_id)
  };

  // 4. Xử lý "Món khác có thể bạn thích" (Random ngẫu nhiên)
  const relatedProducts = relatedList
    .filter(item => item.id !== apiProduct.id) // Loại bỏ sản phẩm đang xem
    .sort(() => 0.5 - Math.random()) // Thuật toán shuffle ngẫu nhiên
    .slice(0, 4) // Lấy 4 sản phẩm đầu tiên sau khi trộn
    .map(item => ({
      id: item.id,
      name: item.name,
      price: formatPrice(item.price_buy),
      oldPrice: formatPrice(item.price_buy * 1.1), // Giả lập giá cũ
      image: item.image_url || 'https://via.placeholder.com/400x400?text=No+Image',
      tag: 'Gợi ý' // Tag cố định hoặc random
    }));

  // --- RENDER UI (Giữ nguyên code giao diện cũ) ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/" className="text-gray-600 hover:text-amber-700 transition-colors">Trang chủ</Link>
          <span className="text-gray-400">/</span>
          <Link href="/" className="text-gray-600 hover:text-amber-700 transition-colors">Menu</Link>
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
            <Link href="/" className="text-amber-700 hover:underline font-semibold text-lg">
              Xem menu →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.length > 0 ? (
              relatedProducts.map(item => (
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
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                Đang cập nhật thêm sản phẩm...
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
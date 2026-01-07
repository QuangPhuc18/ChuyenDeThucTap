'use client'

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ImageGallery from '../../../../components/ImageGallery';
import ProductActions from '../../../../components/ProductActions';
import ProductSaleService from '../../../../services/ProductSaleService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
const STORAGE_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000') + '/storage/';
const IMAGE_FALLBACK = 'https://via.placeholder.com/800x800?text=No+Image';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price || 0));

const getCategoryName = (id) => {
  const map = { 1: '☕ Cà phê', 2: '🍵 Trà', 3: '❄️ Freeze', 4: '🍰 Bánh ngọt' };
  return map[id] || 'Sản phẩm';
};

const buildImageUrl = (src) => {
  if (!src) return IMAGE_FALLBACK;
  if (src.startsWith('http')) return src;
  return STORAGE_BASE + src.replace(/^\/+/, '');
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = useMemo(() => {
    const s = params?.slug;
    return Array.isArray(s) ? s[0] : s;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [apiProduct, setApiProduct] = useState(null);
  const [relatedList, setRelatedList] = useState([]);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [productRes, relatedRes, saleRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products/${slug}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
          fetch(`${API_BASE_URL}/products?limit=20`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
          ProductSaleService.getActiveSales().catch(() => null),
        ]);

        if (!mounted) return;

        let productData = productRes?.status ? productRes.data : null;

        // Ghép thông tin sale nếu trùng product_id
        const saleList = saleRes?.status ? saleRes.data || [] : [];
        if (productData && Array.isArray(saleList)) {
          const matched = saleList.find((s) => Number(s.product_id) === Number(productData.id));
          if (matched) {
            const salePrice =
              matched.salePrice ??
              matched.sale_price ??
              matched.price_sale ??
              matched.price_discount ??
              matched.price_final;

            productData = {
              ...productData,
              price_final: salePrice ?? productData.price_final,
              price_buy: matched.price_buy ?? productData.price_buy ?? productData.price,
              salePrice: salePrice,
              discount_percent: matched.discount_percent,
              is_sale: true,
            };
          }
        }

        setApiProduct(productData);

        const related =
          relatedRes?.status
            ? relatedRes.data
            : Array.isArray(relatedRes)
            ? relatedRes
            : Array.isArray(relatedRes?.data)
            ? relatedRes.data
            : [];
        setRelatedList(related);
      } catch (err) {
        console.error('Fetch error:', err);
        setApiProduct(null);
        setRelatedList([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (!slug) {
    router.push('/not-found');
    return null;
  }

  if (!loading && !apiProduct) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h1>
        <Link href="/" className="text-amber-700 hover:underline">
          ← Quay lại trang chủ
        </Link>
      </div>
    );
  }

  // Ưu tiên giá sale
  const salePrice =
    apiProduct?.price_final ??
    apiProduct?.salePrice ??
    apiProduct?.sale_price ??
    apiProduct?.price_sale ??
    apiProduct?.price_discount ??
    apiProduct?.price;

  const originalPrice = apiProduct?.price_buy ?? apiProduct?.price ?? salePrice ?? 0;
  const currentPrice = salePrice ?? originalPrice ?? 0;

  const hasSale = (Number(originalPrice) || 0) > (Number(currentPrice) || 0) || apiProduct?.is_sale || apiProduct?.discount_percent;
  const discountPercent =
    hasSale &&
    (apiProduct?.discount_percent ??
      Math.max(
        0,
        Math.round(((Number(originalPrice || 0) - Number(currentPrice || 0)) / Number(originalPrice || 1)) * 100)
      ));

  // Sizes
  const groupedAttributes = Array.isArray(apiProduct?.grouped_attributes)
    ? apiProduct.grouped_attributes
    : Array.isArray(apiProduct?.product_attributes)
    ? [{ attribute_id: '', values: apiProduct.product_attributes.map((v) => v.value || v) }]
    : [];

  // Gallery
  const gallerySources = [];
  if (apiProduct?.image_url) gallerySources.push(apiProduct.image_url);
  if (apiProduct?.thumbnail) gallerySources.push(buildImageUrl(apiProduct.thumbnail));
  const imgs = apiProduct?.images || apiProduct?.list_images || apiProduct?.gallery || [];
  (Array.isArray(imgs) ? imgs : []).forEach((img) => {
    if (typeof img === 'string') gallerySources.push(buildImageUrl(img));
    else if (img?.url) gallerySources.push(img.url);
    else if (img?.image) gallerySources.push(buildImageUrl(img.image));
  });
  const mainImage = gallerySources[0] || IMAGE_FALLBACK;
  const secondaryImage = gallerySources[1] || mainImage;

  const product =
    apiProduct && {
      id: apiProduct.id,
      name: apiProduct.name,
      description:
        apiProduct.description ||
        'Hương vị đậm đà, thơm nồng đặc trưng, mang đến năng lượng tràn đầy cho cả ngày dài.',
      price: formatPrice(currentPrice),
      price_final: currentPrice,
      rawPrice: currentPrice,
      grouped_attributes: groupedAttributes,
      oldPrice: hasSale && Number(originalPrice) > Number(currentPrice) ? formatPrice(originalPrice) : null,
      discount: hasSale && discountPercent ? `-${discountPercent}%` : null,
      rating: 4.9,
      reviews: 256,
      image: mainImage,
      secondaryImage,
      category: getCategoryName(apiProduct.category_id),
    };

  const relatedProducts = (Array.isArray(relatedList) ? relatedList : Array.isArray(relatedList?.data) ? relatedList.data : [])
    .filter((item) => (apiProduct?.id ? item?.id !== apiProduct.id : true))
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: formatPrice(item.price_buy ?? item.price ?? 0),
      oldPrice: null,
      image: buildImageUrl(item.image_url || item.thumbnail || item.image),
      tag: 'Gợi ý',
    }));

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-amber-50 to-white">
        <div className="animate-spin h-10 w-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/" className="text-gray-600 hover:text-amber-700 transition-colors">
            Trang chủ
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/" className="text-gray-600 hover:text-amber-700 transition-colors">
            Menu
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-12 border border-amber-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-10">
            <ImageGallery mainImage={product.image} secondaryImage={product.secondaryImage} productName={product.name} />

            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 mb-4 flex-wrap">
                {product.discount && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">🔥 {product.discount} OFF</span>
                )}
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✓ Còn hàng</span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">{product.category}</span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>

              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-4xl font-bold text-amber-700">{product.price}</span>
                {product.oldPrice && <span className="text-2xl text-gray-400 line-through">{product.oldPrice}</span>}
              </div>

              <p className="text-gray-700 leading-relaxed mb-8 text-base">{product.description}</p>

              <ProductActions product={product} />

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
        </div>

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
              relatedProducts.map((item) => (
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
                      {item.oldPrice && <span className="text-sm text-gray-400 line-through">{item.oldPrice}</span>}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">Đang cập nhật thêm sản phẩm...</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
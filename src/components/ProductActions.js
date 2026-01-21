'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'cart'
const IMAGE_FALLBACK = '/images/placeholder.png'

export default function ProductActions({ product }) {
  const router = useRouter()

  // 1) Tìm size
  let sizeAttribute = product.grouped_attributes?.find((attr) => {
    const name = attr.name ? String(attr.name).toLowerCase() : ''
    return name.includes('size') || name.includes('kích thước') || name.includes('kich thuoc')
  })
  if (!sizeAttribute && product.grouped_attributes?.length > 0) {
    sizeAttribute = product.grouped_attributes[0]
  }
  const availableSizes = sizeAttribute ? (Array.isArray(sizeAttribute.values) ? sizeAttribute.values : []) : []
  const [selectedSize, setSelectedSize] = useState(availableSizes.length > 0 ? availableSizes[0] : null)

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0])
    }
  }, [availableSizes, selectedSize])

  // 2) Giá cơ sở: ưu tiên giá sale (lưu ý: product.price có thể là chuỗi format, nên ưu tiên numeric props)
  const basePrice = Number(
    product.price_final ??
      product.salePrice ??
      product.sale_price ??
      product.price_sale ??
      product.price_discount ??
      product.rawPrice ??
      product.price_buy ??
      product.price ??
      0
  )

  // 3) Không cộng thêm tiền theo size (giữ nguyên basePrice)
  const currentPrice = basePrice

  const getCart = () => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  const saveCart = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('cart:update'))
  }

  // 4) Thêm vào giỏ
  const handleAddToCart = (isBuyNow = false) => {
    if (availableSizes.length > 0 && !selectedSize) {
      alert('Vui lòng chọn kích thước!')
      return
    }

    const cart = getCart()
    const idx = cart.findIndex((item) => item.id === product.id && item.size === selectedSize)
    // lấy ảnh đầu tiên từ product.images nếu có
    const image =
      product.image ||
      (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null) ||
      product.image_url ||
      product.thumbnail ||
      IMAGE_FALLBACK

    if (idx > -1) {
      cart[idx].quantity = (cart[idx].quantity || 1) + 1
      cart[idx].salePrice = currentPrice
      cart[idx].price = currentPrice
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        image,
        size: selectedSize,
        quantity: 1,
        salePrice: currentPrice, // lưu giá sale
        price: currentPrice,     // tương thích cũ
        price_buy: product.price_buy ?? product.oldPrice ?? product.price, // tùy chọn hiển thị gạch ngang
      })
    }

    saveCart(cart)
    if (isBuyNow) router.push('/checkout')
    else router.push('/cart')
  }

  return (
    <>
      {availableSizes.length > 0 && (
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            {sizeAttribute?.name || 'Kích thước'}:
          </label>
          <div className="flex gap-3 flex-wrap">
            {availableSizes.map((size, index) => (
              <button
                key={index}
                onClick={() => setSelectedSize(size)}
                className={`min-w-[3rem] px-4 py-2 rounded-lg border-2 font-bold transition-all ${
                  selectedSize === size
                    ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-amber-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={() => handleAddToCart(false)}
          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          🛒 Thêm vào giỏ 
        </button>
        <button
          onClick={() => handleAddToCart(true)}
          className="flex-1 border-2 border-amber-600 text-amber-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-50 transition-all transform hover:scale-105 active:scale-95"
        >
          ⚡ Đặt ngay
        </button>
      </div>
    </>
  )
}
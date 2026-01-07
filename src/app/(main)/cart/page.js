'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Trash2, Plus, Minus, X, Tag, ArrowLeft, Lock, Shield, CreditCard } from 'lucide-react'

const STORAGE_KEY = 'cart'
const IMAGE_FALLBACK = '/images/placeholder.png'

// ----- Helpers -----
const getCartFromStorage = () => {
  try {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveCartToStorage = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart:update'))
}

const formatPrice = (v) => {
  if (v == null || isNaN(Number(v))) return '0₫'
  return Number(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫'
}

// Ưu tiên giá sale
const getUnitPrice = (item) =>
  Number(
    item.salePrice ??
      item.price_final ??
      item.price_sale ??
      item.price_discount ??
      item.price_buy ??
      item.price ??
      0
  )

const normalizeItems = (rawItems) =>
  rawItems.map((i) => ({
    ...i,
    unitPrice: getUnitPrice(i),
  }))

// ----- Cart Item -----
function CartItemCard({ item, onQuantityChange, onRemove }) {
  const unitPrice = item.unitPrice ?? getUnitPrice(item)
  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex gap-6">
        <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
          <img
            src={item.image || IMAGE_FALLBACK}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = IMAGE_FALLBACK
            }}
          />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                {item.name}
              </h3>
              <button
                onClick={() => onRemove(item.id, item.size)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors ml-4 flex-shrink-0"
                aria-label="Xóa sản phẩm"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
            {item.size && (
              <p className="text-sm font-medium text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded mb-2">
                Size: {item.size}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onQuantityChange(item.id, item.size, Math.max(1, (item.quantity || 1) - 1))}
                className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-semibold text-lg">
                {item.quantity || 1}
              </span>
              <button
                onClick={() => onQuantityChange(item.id, item.size, (item.quantity || 1) + 1)}
                className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-amber-700">
                {formatPrice(unitPrice * (item.quantity || 1))}
              </div>
              <div className="text-sm text-gray-500">
                {formatPrice(unitPrice)} x {item.quantity}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ----- Page -----
export default function CartPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const router = useRouter()

  useEffect(() => {
    const normalized = normalizeItems(getCartFromStorage())
    setItems(normalized)
    setLoading(false)

    const onUpdate = () => setItems(normalizeItems(getCartFromStorage()))
    window.addEventListener('cart:update', onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener('cart:update', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [])

  const handleQuantityChange = (id, size, qty) => {
    const next = items.map((i) => (i.id === id && i.size === size ? { ...i, quantity: qty } : i))
    setItems(next)
    saveCartToStorage(next)
  }

  const handleRemove = (id, size) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return
    const next = items.filter((i) => !(i.id === id && i.size === size))
    setItems(next)
    saveCartToStorage(next)
  }

  const handleClear = () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return
    setItems([])
    saveCartToStorage([])
    setDiscount(0)
    setAppliedCoupon('')
  }

  const subtotal = items.reduce((s, i) => s + (i.unitPrice ?? getUnitPrice(i)) * (i.quantity || 1), 0)
  const shipping = 0 // miễn phí
  const total = subtotal - discount // Không cộng phí ship

  const applyCoupon = () => {
    if (!coupon.trim()) {
      alert('Vui lòng nhập mã giảm giá')
      return
    }
    const coupons = {
      SALE10: { type: 'percent', value: 10 },
      SALE20: { type: 'percent', value: 20 },
      SAVE50K: { type: 'fixed', value: 50000 },
      FREESHIP: { type: 'fixed', value: 0 },
    }
    const code = coupon.toUpperCase()
    const c = coupons[code]
    if (!c) {
      alert('❌ Mã giảm giá không hợp lệ')
      setDiscount(0)
      setAppliedCoupon('')
      return
    }
    let discountAmount = c.type === 'percent' ? Math.round(subtotal * (c.value / 100)) : c.value
    discountAmount = Math.min(discountAmount, subtotal)
    setDiscount(discountAmount)
    setAppliedCoupon(code)
    alert(`✅ Áp dụng mã "${code}" thành công!\nGiảm: ${formatPrice(discountAmount)}`)
  }

  const removeCoupon = () => {
    setDiscount(0)
    setAppliedCoupon('')
    setCoupon('')
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      alert('Giỏ hàng trống')
      return
    }
    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-800 text-white py-12">
        <div className="container mx-auto px-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-amber-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
          <div className="flex items-center gap-4">
            <ShoppingBag className="w-10 h-10" />
            <div>
              <h1 className="text-4xl font-bold">Giỏ hàng</h1>
              <p className="text-amber-100 mt-1">
                {items.length > 0 ? `${items.length} sản phẩm trong giỏ` : 'Chưa có sản phẩm'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="bg-gray-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-600 mb-8">
              Bạn chưa thêm sản phẩm nào vào giỏ hàng. Khám phá menu của chúng tôi ngay!
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Khám phá sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Sản phẩm ({items.length})
                </h2>
                <button
                  onClick={handleClear}
                  className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2 hover:underline"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa tất cả
                </button>
              </div>

              {items.map((item, index) => (
                <CartItemCard
                  key={`${item.id}-${item.size || 'default'}-${index}`}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                />
              ))}

              <button
                onClick={() => router.push('/')}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all font-semibold"
              >
                + Thêm sản phẩm khác
              </button>
            </div>

            {/* Order Summary (no shipping added) */}
            <aside className="lg:sticky lg:top-6 h-fit">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Tóm tắt đơn hàng</h2>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700">
                    Bảo mật
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Mã giảm giá
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700">{appliedCoupon}</span>
                      </div>
                      <button onClick={removeCoupon} className="text-red-600 hover:text-red-700">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <input
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="Nhập mã giảm giá"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition"
                      />
                      <button
                        onClick={applyCoupon}
                        className="px-5 sm:px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                      >
                        Áp dụng
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span role="img" aria-label="bulb">💡</span>
                    Thử: SALE10, SALE20, SAVE50K, FREESHIP
                  </p>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Tạm tính</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span className="font-semibold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng</span>
                    <span className="text-2xl font-bold text-amber-700">{formatPrice(total)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Lock className="w-5 h-5" />
                    Thanh toán an toàn
                  </button>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>Thanh toán bảo mật 100%</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Hỗ trợ nhiều phương thức thanh toán</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Trash2, Plus, Minus, X, Tag, ArrowLeft, Lock, Truck, Shield, CreditCard } from 'lucide-react'

const STORAGE_KEY = 'cart'

function getCartFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error('getCartFromStorage', e)
    return []
  }
}

function saveCartToStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('cart:update'))
  } catch (e) {
    console.error('saveCartToStorage', e)
  }
}

function formatPrice(v) {
  if (v == null) return '0₫'
  if (typeof v === 'string') return v
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫'
}

// Cart Item Component
function CartItemCard({ item, onQuantityChange, onRemove }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex gap-6">
        {/* Product Image */}
        <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
          <img
            src={item.image || '/images/placeholder.png'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                {item.name}
              </h3>
              <button
                onClick={() => onRemove(item.id)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors ml-4 flex-shrink-0"
                aria-label="Xóa sản phẩm"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
            
            {item.size && (
              <p className="text-sm text-gray-600 mb-2">Size: {item.size}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            {/* Quantity Control */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-semibold text-lg">
                {item.quantity || 1}
              </span>
              <button
                onClick={() => onQuantityChange(item.id, (item.quantity || 1) + 1)}
                className="w-9 h-9 rounded-lg border-2 border-gray-200 hover:border-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="text-2xl font-bold text-amber-700">
                {formatPrice((Number(item.price) || 0) * (item.quantity || 1))}
              </div>
              <div className="text-sm text-gray-500">
                {formatPrice(item.price)} x {item.quantity}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const router = useRouter()

  useEffect(() => {
    const load = () => {
      setItems(getCartFromStorage())
      setLoading(false)
    }
    load()

    const onUpdate = () => setItems(getCartFromStorage())
    window.addEventListener('cart:update', onUpdate)
    window.addEventListener('storage', onUpdate)
    return () => {
      window.removeEventListener('cart:update', onUpdate)
      window.removeEventListener('storage', onUpdate)
    }
  }, [])

  const handleQuantityChange = (id, qty) => {
    const next = items.map(i => i.id === id ? { ...i, quantity: qty } : i)
    setItems(next)
    saveCartToStorage(next)
  }

  const handleRemove = (id) => {
    const next = items.filter(i => i.id !== id)
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

  const subtotal = items.reduce((s, i) => s + ((Number(i.price) || 0) * (i.quantity || 1)), 0)
  const shipping = subtotal >= 50000 ? 0 : (items.length > 0 ? 30000 : 0)
  const total = subtotal - discount + shipping

  const applyCoupon = () => {
    if (!coupon.trim()) {
      alert('Vui lòng nhập mã giảm giá')
      return
    }

    // Demo coupons
    const coupons = {
      'SALE10': { type: 'percent', value: 10, name: 'Giảm 10%' },
      'SALE20': { type: 'percent', value: 20, name: 'Giảm 20%' },
      'FREESHIP': { type: 'fixed', value: shipping, name: 'Miễn phí ship' },
      'SAVE50K': { type: 'fixed', value: 50000, name: 'Giảm 50.000₫' }
    }

    const code = coupon.toUpperCase()
    const couponData = coupons[code]

    if (couponData) {
      let discountAmount = 0
      if (couponData.type === 'percent') {
        discountAmount = Math.round(subtotal * (couponData.value / 100))
      } else {
        discountAmount = couponData.value
      }
      
      setDiscount(discountAmount)
      setAppliedCoupon(code)
      alert(`✅ Áp dụng mã "${code}" thành công!\nGiảm: ${formatPrice(discountAmount)}`)
    } else {
      alert('❌ Mã giảm giá không hợp lệ')
      setDiscount(0)
      setAppliedCoupon('')
    }
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
    
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`)
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
          // Empty Cart State
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
              onClick={() => router.push('/product')}
              className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Khám phá sản phẩm
            </button>
          </div>
        ) : (
          // Cart with Items
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

              {items.map(item => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                />
              ))}

              {/* Continue Shopping */}
              <button
                onClick={() => router.push('/product')}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all font-semibold"
              >
                + Thêm sản phẩm khác
              </button>
            </div>

            {/* Order Summary */}
            <aside className="lg:sticky lg:top-6 h-fit">
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Tóm tắt đơn hàng
                </h2>

                {/* Coupon Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mã giảm giá
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700">{appliedCoupon}</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="Nhập mã giảm giá"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-amber-600"
                      />
                      <button
                        onClick={applyCoupon}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                      >
                        Áp dụng
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Thử: SALE10, SALE20, FREESHIP, SAVE50K
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b-2 border-gray-100">
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
                  
                  <div className="flex justify-between text-gray-700">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span>Phí vận chuyển</span>
                    </div>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>

                  {subtotal < 50000 && shipping > 0 && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded">
                      💰 Mua thêm {formatPrice(50000 - subtotal)} để được freeship!
                    </p>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6 text-2xl font-bold">
                  <span className="text-gray-900">Tổng cộng</span>
                  <span className="text-amber-700">{formatPrice(total)}</span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl mb-4 flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Thanh toán an toàn
                </button>

                {/* Trust Badges */}
                <div className="space-y-3 pt-6 border-t-2 border-gray-100">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>Thanh toán bảo mật 100%</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span>Giao hàng nhanh 30 phút</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Hỗ trợ nhiều phương thức thanh toán</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-6 bg-white rounded-xl p-4 border-2 border-gray-100">
                <p className="text-sm text-gray-600 mb-3 font-semibold">Chấp nhận thanh toán:</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center text-xs font-semibold text-gray-700">
                    💳 Thẻ
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center text-xs font-semibold text-gray-700">
                    🏦 Banking
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center text-xs font-semibold text-gray-700">
                    💵 COD
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center text-xs font-semibold text-gray-700">
                    📱 Ví điện tử
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
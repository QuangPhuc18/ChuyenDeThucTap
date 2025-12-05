'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2, Minus, Plus } from 'lucide-react'

export default function CartItem({ item, onQuantityChange, onRemove }) {
  const [qty, setQty] = useState(item.quantity || 1)

  useEffect(() => {
    setQty(item.quantity || 1)
  }, [item.quantity])

  const changeQty = (newQty) => {
    if (newQty < 1) return
    setQty(newQty)
    onQuantityChange(item.id, newQty)
  }

  const handleRemove = () => {
    if (confirm(`Bạn có chắc muốn xóa "${item.name}" khỏi giỏ hàng?`)) {
      onRemove(item.id)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b last:border-b-0">
      {/* Image */}
      <Link href={`/product/${item.slug || item.id}`} className="w-full sm:w-28 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        <img
          src={item.image || '/images/placeholder.png'}
          alt={item.name}
          className="w-full h-24 object-cover"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/product/${item.slug || item.id}`} className="block text-sm sm:text-base font-semibold text-gray-900 hover:underline line-clamp-2">
          {item.name}
        </Link>
        {item.subtitle && <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>}
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div className="text-gray-600">Giá:</div>
          <div className="text-lg font-medium text-amber-900">{formatPrice(item.price)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-end sm:items-center gap-4 mt-2 sm:mt-0">
        <div className="flex items-center border rounded overflow-hidden">
          <button
            onClick={() => changeQty(qty - 1)}
            className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            aria-label="Giảm số lượng"
            disabled={qty <= 1}
            type="button"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="px-4 py-1 w-12 text-center text-sm">{qty}</div>
          <button
            onClick={() => changeQty(qty + 1)}
            className="px-3 py-1 text-gray-600 hover:bg-gray-50"
            aria-label="Tăng số lượng"
            type="button"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm sm:text-base font-semibold w-28 text-right">
          {formatPrice((coerceNumber(item.price) || 0) * qty)}
        </div>

        <button
          onClick={handleRemove}
          className="p-2 rounded hover:bg-gray-100 text-gray-600"
          title="Xóa"
          type="button"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// helpers
function coerceNumber(v) {
  if (v == null) return 0
  if (typeof v === 'number') return v
  // remove non-numeric characters (e.g. 'Rs. 250' or '1,200')
  const num = Number(String(v).replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(num) ? num : 0
}

function formatPrice(v) {
  if (v == null) return '-'
  if (typeof v === 'string') return v
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '₫'
}
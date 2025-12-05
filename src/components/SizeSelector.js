'use client'
import React from 'react'

export default function SizeSelector({ initial = 'M', onChange }) {
  const [selectedSize, setSelectedSize] = React.useState(initial)

  const options = [
    { size: 'S', label: 'Nhỏ', ml: '250ml' },
    { size: 'M', label: 'Vừa', ml: '350ml' },
    { size: 'L', label: 'Lớn', ml: '500ml' }
  ]

  const handleClick = (size) => {
    setSelectedSize(size)
    if (typeof onChange === 'function') onChange(size)
  }

  return (
    <div className="mb-8">
      <label className="block text-sm font-semibold text-gray-900 mb-3">
        Chọn kích thước: <span className="text-amber-700">{selectedSize}</span>
      </label>
      <div className="flex gap-3">
        {options.map(item => (
          <button
            key={item.size}
            onClick={() => handleClick(item.size)}
            className={`flex-1 px-4 py-3 rounded-xl border-2 font-semibold transition-all transform hover:scale-105 ${
              selectedSize === item.size
                ? 'border-amber-600 bg-amber-600 text-white shadow-lg'
                : 'border-gray-300 bg-white text-gray-700 hover:border-amber-600 hover:shadow-md'
            }`}
            type="button"
          >
            <div className="text-lg font-bold">{item.size}</div>
            <div className="text-xs opacity-90">{item.ml}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
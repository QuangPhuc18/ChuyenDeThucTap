'use client'
import Link from 'next/link'

export default function ProductCard({ product }) {
  const slug = product.slug || `product-${product.id}`

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition group">
      <div className="relative">
        {/* Link bọc ảnh (KHÔNG dùng <a> bên trong) */}
        <Link href={`/product/${slug}`}>
          <img
            src={product.image || '/images/placeholder.png'}
            alt={product.name}
            className="w-full h-64 object-cover cursor-pointer"
          />
        </Link>

        <button className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-red-50 transition">
          {/* placeholder cho icon */}
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          <Link href={`/product/${slug}`} className="hover:underline text-inherit">
            {product.name}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">{product.price}</span>
          <button className="bg-amber-900 text-white px-6 py-2 rounded-md hover:bg-amber-800 transition">Buy Now</button>
        </div>
      </div>
    </div>
  )
}
'use client'
import React from 'react'

export default function ImageGallery({ mainImage, secondaryImage, productName }) {
  const [selectedImage, setSelectedImage] = React.useState(mainImage)

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <img
          src={selectedImage}
          alt={productName}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setSelectedImage(mainImage)}
          className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
            selectedImage === mainImage ? 'border-amber-600 ring-2 ring-amber-600 ring-offset-2' : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <img
            src={mainImage}
            alt="Ảnh chính"
            className="w-full h-full object-cover"
          />
        </button>
       
      </div>
    </div>
  )
}
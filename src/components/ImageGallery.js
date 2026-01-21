'use client'

import React, { useEffect, useState } from 'react';

export default function ImageGallery({ images = [], mainImage, secondaryImage, productName }) {
  // Hỗ trợ cả hai interface cũ (mainImage/secondaryImage) và mới (images)
  const normalized = Array.isArray(images) && images.length > 0
    ? images
    : (() => {
        const s = [];
        if (mainImage) s.push(mainImage);
        if (secondaryImage && secondaryImage !== mainImage) s.push(secondaryImage);
        return s;
      })();

  const [thumbs, setThumbs] = useState(normalized.length > 0 ? normalized : []);
  const [selectedImage, setSelectedImage] = useState(thumbs[0] || '');

  useEffect(() => {
    const srcs = Array.isArray(images) && images.length > 0
      ? images
      : (() => {
          const s = [];
          if (mainImage) s.push(mainImage);
          if (secondaryImage && secondaryImage !== mainImage) s.push(secondaryImage);
          return s;
        })();

    setThumbs(srcs.length > 0 ? srcs : []);
    setSelectedImage((prev) => {
      // Nếu prev vẫn nằm trong srcs thì giữ, ngược lại chọn srcs[0]
      if (!srcs || srcs.length === 0) return '';
      if (srcs.includes(prev)) return prev;
      return srcs[0];
    });
  }, [images, mainImage, secondaryImage]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <img
          src={selectedImage || '/images/placeholder.png'}
          alt={productName}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {thumbs.length > 0 ? (
          thumbs.map((t, i) => (
            <button
              key={i}
              onClick={() => setSelectedImage(t)}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                selectedImage === t ? 'border-amber-600 ring-2 ring-amber-600 ring-offset-2' : 'border-gray-200 hover:border-gray-400'
              }`}
              aria-label={`Xem ảnh ${i + 1}`}
            >
              <img
                src={t}
                alt={`${productName} thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))
        ) : (
          // giữ layout 2 ô nếu không có thumb nào
          <>
            <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-gray-200">
              <img src="/images/placeholder.png" alt="placeholder" className="w-full h-full object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-gray-200">
              <img src="/images/placeholder.png" alt="placeholder" className="w-full h-full object-cover" />
            </div>
          </>
        )}

        {/* Nếu chỉ có 1 thumbnail, giữ ô thứ 2 để layout không thay đổi */}
        {thumbs.length === 1 && (
          <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-gray-200">
            <img src={thumbs[0]} alt={`${productName} thumbnail placeholder`} className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}
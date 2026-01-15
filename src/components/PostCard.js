'use client';
import Link from 'next/link';
import { Calendar, User, ArrowRight, ImageIcon } from 'lucide-react';

// --- Helper Image Component ---
const BlogImage = ({ src, alt, className }) => {
  const finalSrc = src && src.startsWith('http') ? src : 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image';
  return (
    <img 
      src={finalSrc} 
      alt={alt || 'Blog Image'} 
      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${className}`}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        e.currentTarget.nextSibling.style.display = 'flex';
      }}
    />
  );
};

const FallbackIcon = () => (
  <div className="hidden w-full h-full bg-gray-100 items-center justify-center text-gray-400 absolute inset-0">
    <ImageIcon size={24} />
  </div>
);

// 1. Tiêu đề Section
export const SectionTitle = ({ title, subtitle }) => (
  <div className="text-center mb-8">
    <div className="inline-block relative px-4 py-1">
      <h2 className="text-2xl font-extrabold text-gray-900 relative z-10 uppercase tracking-wider">{title}</h2>
      <div className="absolute bottom-1 left-0 w-full h-2 bg-blue-100 -z-0 -skew-x-12 opacity-70"></div>
    </div>
    {subtitle && <p className="text-gray-500 text-xs mt-1 font-light tracking-wide">{subtitle}</p>}
  </div>
);

// 2. Card Lớn (Big Card) - Đã thu nhỏ chiều cao
export const BigCard = ({ post }) => {
  return (
    <div className="group h-full flex flex-col">
      {/* SỬA: Chiều cao ảnh cố định h-64 (256px) trên desktop cho gọn */}
      <div className="relative w-full h-56 md:h-64 lg:h-72 rounded-xl overflow-hidden mb-4 shadow-sm border border-gray-100">
        <Link href={`/posts/${post.slug}`} className="block w-full h-full">
            <BlogImage src={post.image_url} alt={post.title} />
            <FallbackIcon />
        </Link>
        <div className="absolute top-3 left-3">
           <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
             Featured
           </span>
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h3>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">
          <div className="flex items-center gap-1">
             <User size={12} className="text-gray-400"/>
             <span>Admin</span>
          </div>
          <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
          <div className="flex items-center gap-1">
             <Calendar size={12} />
             {new Date(post.created_at).toLocaleDateString('vi-VN')}
          </div>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 md:line-clamp-3 mb-3 leading-relaxed">
            {post.description || post.content?.substring(0, 150).replace(/<[^>]*>?/gm, '') || 'Xem chi tiết...'}
        </p>
      </div>
    </div>
  );
};

// 3. Card Ngang nhỏ (Small Horizontal) - Fix cứng kích thước ảnh
export const SmallHorizontalCard = ({ post }) => {
  return (
    <div className="flex gap-4 group items-start p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
      {/* SỬA: Fix cứng w-32 (128px) và h-24 (96px). Flex-shrink-0 để không bị co hoặc giãn */}
      <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 relative shadow-sm border border-gray-100">
        <Link href={`/posts/${post.slug}`} className="block w-full h-full">
            <BlogImage src={post.image_url} alt={post.title} />
            <FallbackIcon />
        </Link>
      </div>
      
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase mb-1">
            <span>News</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400 font-medium normal-case">
                {new Date(post.created_at).toLocaleDateString('vi-VN')}
            </span>
        </div>
        <h4 className="text-sm md:text-base font-bold text-gray-900 mb-1 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h4>
        <Link href={`/posts/${post.slug}`} className="text-[10px] md:text-xs font-semibold text-gray-400 hover:text-blue-600 flex items-center gap-1 group/link">
            Read More <ArrowRight size={10} className="transition-transform group-hover/link:translate-x-1"/>
        </Link>
      </div>
    </div>
  );
};

// 4. Card Dọc (Standard - Trending Post) - Ảnh gọn hơn
export const StandardCard = ({ post }) => {
  return (
    <div className="group flex flex-col h-full bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 hover:-translate-y-1">
      {/* SỬA: Chiều cao ảnh h-48 (192px) */}
      <div className="relative h-48 overflow-hidden">
        <Link href={`/posts/${post.slug}`} className="block w-full h-full">
            <BlogImage src={post.image_url} alt={post.title} />
            <FallbackIcon />
        </Link>
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-gray-800 shadow-sm">
            {new Date(post.created_at).toLocaleDateString('vi-VN')}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-4">
        <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="text-gray-500 text-xs md:text-sm line-clamp-3 mb-3 flex-1 leading-relaxed">
          {post.description || 'Nội dung tóm tắt đang được cập nhật...'}
        </p>
        
        <div className="flex items-center gap-2 pt-3 border-t border-gray-50 mt-auto">
           <User size={12} className="text-gray-400"/>
           <span className="text-xs text-gray-500">Admin</span>
        </div>
      </div>
    </div>
  );
};
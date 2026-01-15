'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Thêm useRouter để redirect nếu cần
import PostService from '@/services/PostService';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, Share2, Loader2, Tag, AlertCircle } from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching slug:', slug);
      
      // 👇 SỬA QUAN TRỌNG: Dùng getDetail thay vì getById
      const res = await PostService.getDetail(slug);
      
      console.log('API Response:', res);

      if (res && res.status === true && res.data) {
        setPost(res.data);
        
        // Sau khi có post, lấy bài viết liên quan
        if (res.data.topic_id) {
          fetchRelatedPosts(res.data.topic_id, res.data.id);
        }
      } else {
        console.error('Lỗi API:', res);
        setError(res?.message || 'Không tìm thấy bài viết');
        setPost(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Lỗi kết nối đến máy chủ');
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (topicId, currentId) => {
    try {
      // Gọi API lấy bài liên quan (đã định nghĩa trong PostService trước đó)
      const res = await PostService.getRelated(topicId, currentId);

      if (res && res.status && res.data) {
        setRelatedPosts(res.data);
      }
    } catch (err) {
      console.error('Related posts error:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // --- GIAO DIỆN LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải nội dung...</p>
      </div>
    );
  }

  // --- GIAO DIỆN LỖI / KHÔNG TÌM THẤY ---
  if (error || !post) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4 text-center">
        <div className="bg-red-50 p-6 rounded-full mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rất tiếc!</h2>
        <p className="text-gray-500 mb-8 max-w-md">{error || 'Bài viết bạn tìm kiếm không tồn tại hoặc đã bị xóa.'}</p>
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại trang tin tức
        </Link>
      </div>
    );
  }

  // --- GIAO DIỆN CHI TIẾT BÀI VIẾT ---
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 pb-20">
      
      {/* 1. HEADER (Title, Meta) */}
      <div className="bg-gradient-to-b from-gray-50 to-white pt-10 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 mb-8 transition-colors group"
          >
            <div className="p-1.5 bg-white border border-gray-200 rounded-full group-hover:border-blue-600 transition-colors">
               <ArrowLeft className="w-4 h-4" />
            </div>
            Quay lại danh sách
          </Link>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            {post.title}
          </h1>

          {/* Description (Sapo) */}
          {post.description && (
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed font-light">
              {post.description}
            </p>
          )}

          {/* Author & Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                <User className="w-5 h-5" />
              </div>
              <div>
                  <p className="font-bold text-gray-900">Admin</p>
                  <p className="text-xs">Tác giả</p>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FEATURED IMAGE */}
      {post.image_url && (
        <div className="max-w-5xl mx-auto px-4 mb-12">
          <div className="aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 bg-gray-100">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                  e.target.style.display = 'none'; // Ẩn nếu lỗi ảnh
              }}
            />
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT */}
      <div className="max-w-3xl mx-auto px-4">
        <article
          className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed prose-img:rounded-xl prose-img:shadow-md"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        {/* Footer bài viết */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
             <Tag className="w-5 h-5 text-gray-400"/>
             <span className="text-sm text-gray-500 font-medium">Tin tức, Sự kiện</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Đã sao chép liên kết bài viết!');
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full hover:bg-blue-50 hover:text-blue-600 transition font-medium"
          >
            <Share2 className="w-4 h-4" />
            Chia sẻ bài viết
          </button>
        </div>
      </div>

      {/* 4. RELATED POSTS */}
      {relatedPosts.length > 0 && (
        <div className="bg-gray-50 py-16 mt-20 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
                Bài viết liên quan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  href={`/posts/${item.slug || item.id}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gray-200 relative">
                    <img
                      src={item.image_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">News</div>
                    <h4 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3"/> {formatDate(item.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
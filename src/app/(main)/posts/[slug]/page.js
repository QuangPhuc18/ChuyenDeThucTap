'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PostService from '@/services/PostService';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, Share2, Loader2, Tag, AlertCircle, Clock } from 'lucide-react';

export default function PostDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. Fetch Data ---
  useEffect(() => {
    if (!slug) return;
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi API lấy chi tiết
      const res = await PostService.getDetail(slug);

      if (res && res.status === true && res.data) {
        setPost(res.data);
        // Lấy bài liên quan nếu có topic_id
        if (res.data.topic_id) {
          fetchRelatedPosts(res.data.topic_id, res.data.id);
        }
      } else {
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
      const res = await PostService.getRelated(topicId, currentId);
      if (res && res.status && res.data) {
        setRelatedPosts(res.data);
      }
    } catch (err) {
      console.error('Related posts error:', err);
    }
  };

  // Helper format ngày
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  // --- 2. Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Đang tải nội dung...</p>
      </div>
    );
  }

  // --- 3. Error State ---
  if (error || !post) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4 text-center">
        <div className="bg-red-50 p-6 rounded-full mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rất tiếc!</h2>
        <p className="text-gray-500 mb-8 max-w-md">{error || 'Bài viết không tồn tại.'}</p>
        <Link href="/posts" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-200">
          <ArrowLeft className="w-5 h-5" /> Quay lại trang tin tức
        </Link>
      </div>
    );
  }

  // --- 4. Main Content ---
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 pb-20">
      
      {/* === HERO SECTION (Ảnh Trái - Chữ Phải) === */}
      <div className="bg-gray-50/50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            
            {/* Cột Trái: Ảnh Đại Diện */}
            <div className="order-2 lg:order-1 relative group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-gray-200 relative z-10">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">No Image</div>
                )}
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-full h-full bg-blue-100 rounded-2xl -z-0 lg:block hidden"></div>
            </div>

            {/* Cột Phải: Thông tin bài viết */}
            <div className="order-1 lg:order-2 flex flex-col justify-center h-full">
              {/* Breadcrumb */}
              <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 mb-6 hover:underline w-fit">
                <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
              </Link>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                {post.title}
              </h1>

              {/* Meta Data */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700 font-medium">
                  <User className="w-4 h-4" />
                  <span>Admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>5 phút đọc</span>
                </div>
              </div>

              {/* Sapo / Mô tả ngắn */}
              {post.description && (
                <div className="pl-4 border-l-4 border-blue-500">
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed italic">
                    "{post.description}"
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* === CONTENT SECTION === */}
      <div className="max-w-4xl mx-auto px-4 mt-12 md:mt-16">
        
        {/* Nội dung HTML */}
        <article className="prose prose-lg prose-blue max-w-none text-gray-700 leading-8 prose-headings:font-bold prose-headings:text-gray-900 prose-img:rounded-xl prose-img:shadow-lg prose-a:text-blue-600">
          <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
        </article>

        {/* Footer bài viết: Tags & Share */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-gray-100 rounded-full text-gray-500">
                 <Tag className="w-5 h-5"/>
               </div>
               <div className="flex gap-2">
                 <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">Tin tức</span>
                 <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">Coffea</span>
               </div>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Đã sao chép liên kết bài viết!');
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-medium shadow-md shadow-blue-200"
            >
              <Share2 className="w-4 h-4" />
              Chia sẻ bài viết
            </button>
          </div>
        </div>
      </div>

      {/* === RELATED POSTS === */}
      {relatedPosts.length > 0 && (
        <div className="bg-gray-50 py-16 mt-20 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                Bài viết liên quan
              </h3>
              <Link href="/posts" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                Xem tất cả <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  href={`/posts/${item.slug || item.id}`}
                  className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gray-200 relative">
                    <img
                      src={item.image_url || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">News</div>
                    <h4 className="font-bold text-gray-900 text-lg line-clamp-2 group-hover:text-blue-600 transition-colors mb-3">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-auto">
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
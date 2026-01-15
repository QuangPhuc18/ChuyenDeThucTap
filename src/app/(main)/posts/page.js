'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostService from '@/services/PostService';
import { Search, Loader2, FilterX, User } from 'lucide-react';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Khởi tạo Topics
  useEffect(() => {
    setTopics([
      { id: 1, name: 'Công nghệ' },
      { id: 2, name: 'Du lịch' },
      { id: 3, name: 'Ẩm thực' },
      { id: 4, name: 'Đời sống' },
      { id: 5, name: 'Sự kiện' },
    ]);
  }, []);

  // Gọi API lấy bài viết
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = {
          limit: 10,
          status: 1
        };

        if (selectedTopic !== 'all') {
          params.topic_id = selectedTopic;
        }

        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const res = await PostService.getList(params);

        // Kiểm tra data trả về từ API (đã sửa trong PostService)
        if (res && res.status) {
          setPosts(res.data || []);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error(error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedTopic, searchTerm]);

  // Chia posts theo layout Magazine
  const popularMain = posts[0];          // 1 bài lớn nhất
  const popularSide = posts.slice(1, 3); // 2 bài nhỏ bên cạnh
  const trendingPosts = posts.slice(3, 6); // 3 bài ở dưới

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const resetFilters = () => {
    setSelectedTopic('all');
    setSearchTerm('');
  };

  const isFiltering = searchTerm !== '' || selectedTopic !== 'all';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* --- Filter Bar --- */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Topics */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setSelectedTopic('all')}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTopic === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTopic === topic.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:ring-2 focus:ring-gray-300 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <FilterX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4 text-lg">Không tìm thấy bài viết nào</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-gray-900 text-white text-sm rounded-full hover:bg-gray-800 transition"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : isFiltering ? (
          /* --- VIEW KHI ĐANG LỌC (GRID) --- */
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Tìm thấy <span className="font-semibold text-gray-900">{posts.length}</span> bài viết
              </p>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-900 underline"
              >
                Xóa bộ lọc
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} formatDate={formatDate} />
              ))}
            </div>
          </div>
        ) : (
          /* --- VIEW MẶC ĐỊNH (MAGAZINE LAYOUT) --- */
          <div className="space-y-16">
            
            {/* 1. POPULAR POST SECTION */}
            <section>
              <SectionHeader title="Popular Post" subtitle="Bài viết được yêu thích nhất" />

              {popularMain && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cột Trái: 1 Bài Lớn */}
                  <Link
                    // 👇 QUAN TRỌNG: Dùng slug
                    href={`/posts/${popularMain.slug}`} 
                    className="group block"
                  >
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200 mb-4 shadow-sm relative">
                      {popularMain.image_url ? (
                        <img
                          src={popularMain.image_url}
                          alt={popularMain.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                        Featured
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                      {popularMain.title}
                    </h3>
                    <p className="text-gray-600 text-base mb-3 line-clamp-2 leading-relaxed">
                      {popularMain.description}
                    </p>
                    <PostMeta date={formatDate(popularMain.created_at)} />
                  </Link>

                  {/* Cột Phải: 2 Bài Nhỏ */}
                  <div className="flex flex-col gap-6">
                    {popularSide.map((post) => (
                      <Link
                        key={post.id}
                        // 👇 QUAN TRỌNG: Dùng slug
                        href={`/posts/${post.slug}`}
                        className="group flex gap-5 items-start"
                      >
                        <div className="w-40 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200 shadow-sm relative">
                          {post.image_url ? (
                            <img
                              src={post.image_url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <div className="text-xs text-blue-600 font-bold uppercase mb-1">News</div>
                          <h4 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-lg leading-snug">
                            {post.title}
                          </h4>
                          <PostMeta date={formatDate(post.created_at)} small />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 relative">
               <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-gray-50 px-2 text-gray-400">✦</span>
            </div>

            {/* 2. TRENDING POST SECTION */}
            {trendingPosts.length > 0 && (
              <section>
                <SectionHeader title="Trending Post" subtitle="Xu hướng bài viết mới nhất" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {trendingPosts.map((post) => (
                    <PostCard key={post.id} post={post} formatDate={formatDate} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function SectionHeader({ title, subtitle }) {
  return (
    <div className="text-center mb-10">
      <div className="inline-block relative px-4">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-1 uppercase tracking-wide relative z-10">{title}</h2>
        <div className="absolute bottom-1 left-0 w-full h-3 bg-blue-100 -z-0 -skew-x-12 opacity-60"></div>
      </div>
      <p className="text-gray-500 text-sm mt-2">{subtitle}</p>
    </div>
  );
}

function PostMeta({ date, small = false }) {
  return (
    <div className={`flex items-center gap-3 text-gray-500 ${small ? 'text-xs' : 'text-sm'}`}>
      <div className="flex items-center gap-1.5">
        <div className={`rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ${small ? 'w-5 h-5' : 'w-6 h-6'}`}>
          <User className={small ? 'w-3 h-3 text-gray-500' : 'w-4 h-4 text-gray-500'} />
        </div>
        <span className="font-medium text-gray-700">Admin</span>
      </div>
      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
      <span>{date}</span>
    </div>
  );
}

function PostCard({ post, formatDate }) {
  return (
    <Link
      // 👇 QUAN TRỌNG: Dùng slug
      href={`/posts/${post.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-100"
    >
      <div className="aspect-[16/10] overflow-hidden bg-gray-200 relative">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded">News</span>
        </div>
        <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-lg leading-snug">
          {post.title}
        </h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
          {post.description}
        </p>
        <div className="border-t border-gray-100 pt-3 mt-auto">
            <PostMeta date={formatDate(post.created_at)} small />
        </div>
      </div>
    </Link>
  );
}
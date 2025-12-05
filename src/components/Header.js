'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'

export default function CoffeeHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Dữ liệu cho carousel
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&q=80',
      category: 'ARTISAN COFFEE',
      title: 'We serve the richest coffee in the city!',
      description: 'Experience the perfect blend of premium Arabica beans, expertly roasted to bring out rich flavors and aromatic notes.',
      buttonText: 'Order Coffee',
      accentColor: 'amber'
    },
    {
      image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=1600&q=80',
      category: 'PREMIUM TEA',
      title: 'Discover the essence of premium tea leaves',
      description: 'Indulge in our carefully curated selection of organic teas, sourced from the finest tea gardens around the world.',
      buttonText: 'Explore Tea',
      accentColor: 'emerald'
    },
    {
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
      category: 'COZY ATMOSPHERE',
      title: 'Your perfect place to relax and unwind',
      description: 'From classic espresso to exotic tea blends, every cup is crafted with precision in our warm, welcoming space.',
      buttonText: 'Visit Us',
      accentColor: 'orange'
    }
  ]

  useEffect(() => {
    const updateCount = () => {
      try {
        const raw = localStorage.getItem('cart')
        const items = raw ? JSON.parse(raw) : []
        const count = items.reduce((s, i) => s + (i.quantity || 1), 0)
        setCartCount(count)
      } catch (e) {
        setCartCount(0)
      }
    }

    updateCount()
    window.addEventListener('cart:update', updateCount)
    window.addEventListener('storage', updateCount)
    return () => {
      window.removeEventListener('cart:update', updateCount)
      window.removeEventListener('storage', updateCount)
    }
  }, [])

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const getAccentColorClass = (color) => {
    const colors = {
      amber: 'text-amber-200',
      emerald: 'text-emerald-200',
      orange: 'text-orange-200'
    }
    return colors[color] || colors.amber
  }

  const getButtonColorClass = (color) => {
    const colors = {
      amber: 'hover:bg-amber-200',
      emerald: 'hover:bg-emerald-200',
      orange: 'hover:bg-orange-200'
    }
    return colors[color] || colors.amber
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="text-white flex items-center space-x-6">
              <h1 className="text-2xl font-serif italic">coffea</h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-white text-sm font-medium hover:text-amber-200 transition">
                HOME
              </a>
              <a href="#" className="text-white text-sm font-medium hover:text-amber-200 transition">
                COFFEE
              </a>
              <a href="#" className="text-white text-sm font-medium hover:text-amber-200 transition">
                BAKERY
              </a>
              <a href="/product" className="text-white text-sm font-medium hover:text-amber-200 transition">
                SHOP
              </a>
              <a href="#" className="text-white text-sm font-medium hover:text-amber-200 transition">
                ABOUT
              </a>
              <a href="/auth/login" className="text-white text-sm font-medium hover:text-amber-200 transition">
                LOGIN
              </a>
            </nav>

            {/* Actions: Search + Cart */}
            <div className="flex items-center space-x-4">
              {/* Search Icon */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-white hover:text-amber-200 transition p-2 rounded"
                aria-label="Toggle search"
              >
                <Search size={20} />
              </button>

              {/* Cart Icon with badge */}
              <Link href="/cart" className="relative text-white hover:text-amber-200 transition p-2 rounded" aria-label="Giỏ hàng">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search Bar (expandable) */}
          {isSearchOpen && (
            <div className="mt-4 transition-all duration-300 ease-in-out">
              <input
                type="text"
                placeholder="Search coffee, tea, bakery..."
                className="w-full max-w-md bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-amber-200 focus:ring-2 focus:ring-amber-200/50"
                autoFocus
              />
            </div>
          )}
        </div>
      </header>

      {/* Hero Carousel Section */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide 
                ? 'opacity-100 translate-x-0' 
                : index < currentSlide 
                ? 'opacity-0 -translate-x-full' 
                : 'opacity-0 translate-x-full'
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Dark Overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>

            {/* Content */}
            <div className="container mx-auto px-6 relative z-10 h-full flex items-center">
              <div className="max-w-2xl">
                <p className={`${getAccentColorClass(slide.accentColor)} text-sm font-medium tracking-wider mb-4 animate-fade-in`}>
                  {slide.category}
                </p>
                <h2 className="text-white text-5xl md:text-6xl font-serif leading-tight mb-6 animate-slide-up">
                  {slide.title}
                </h2>
                <p className="text-white/90 text-lg mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  {slide.description}
                </p>
                <button 
                  className={`bg-white text-gray-900 px-8 py-3 rounded-full font-medium ${getButtonColorClass(slide.accentColor)} transition transform hover:scale-105 shadow-lg animate-slide-up`}
                  style={{ animationDelay: '0.2s' }}
                >
                  {slide.buttonText}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition transform hover:scale-110"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition transform hover:scale-110"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 ${
                index === currentSlide
                  ? 'w-12 bg-white'
                  : 'w-3 bg-white/50 hover:bg-white/70'
              } h-3 rounded-full`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Decorative Coffee Steam Animation */}
        <div className="absolute right-10 bottom-20 z-10 hidden lg:block">
          <div className="relative w-32 h-32 opacity-20">
            <div className="absolute inset-0 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
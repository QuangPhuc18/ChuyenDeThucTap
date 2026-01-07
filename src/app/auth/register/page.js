'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Đổi URL này nếu backend của bạn chạy port khác
const API_URL = 'http://127.0.0.1:8000/api'; 

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Validate Regex
  const validateEmail = (e) => /\S+@\S+\.\S+/.test(e)
  const validatePhone = (p) => /^0\d{9,10}$/.test(p)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Xóa lỗi khi người dùng bắt đầu gõ lại
    if (error) setError('')
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setError('')

    // --- 1. Validate phía Client (Giữ nguyên để UX tốt hơn) ---
    if (!formData.name || formData.name.trim().length < 3) {
      setError('Họ tên phải có ít nhất 3 ký tự.')
      return
    }
    if (!formData.email || !validateEmail(formData.email)) {
      setError('Vui lòng nhập email hợp lệ.')
      return
    }
    if (!formData.phone || !validatePhone(formData.phone)) {
      setError('Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0).')
      return
    }
    if (!formData.username || formData.username.length < 3) {
      setError('Username phải có ít nhất 3 ký tự.')
      return
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (!agree) {
      setError('Bạn phải đồng ý với điều khoản và chính sách.')
      return
    }

    setLoading(true)

    try {
      // --- 2. Gọi API Laravel ---
      // Lưu ý: Đường dẫn '/users' dựa trên Route::resource('users', ...) trong Laravel
      // Nếu bạn định nghĩa route khác (vd: /register), hãy đổi lại dòng dưới.
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' // Bắt buộc để Laravel trả về JSON khi lỗi
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          username: formData.username,
          password: formData.password,
          roles: 'customer', // Mặc định là khách hàng
          status: 1          // Mặc định kích hoạt
        })
      })

      const data = await res.json()

      // --- 3. Xử lý lỗi từ Backend ---
      if (!res.ok) {
        // Laravel trả về lỗi 422 cho validation
        if (res.status === 422 && data.errors) {
          // Lấy lỗi đầu tiên trong mảng lỗi để hiển thị
          const firstField = Object.keys(data.errors)[0];
          const firstMsg = data.errors[firstField][0];
          throw new Error(firstMsg);
        } else {
          throw new Error(data.message || 'Đăng ký thất bại. Vui lòng thử lại.')
        }
      }

      // --- 4. Thành công ---
      alert('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.')
      router.push('/auth/login') // Chuyển hướng sang trang Login

    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Illustration */}
        <div className="hidden md:flex flex-col justify-center px-6">
          <div className="mb-6">
            <h2 className="text-4xl font-serif text-amber-900">Tham gia với chúng tôi</h2>
            <p className="mt-3 text-gray-600">
              Tạo tài khoản để trải nghiệm mua sắm tuyệt vời. Quản lý đơn hàng, tích điểm và nhận ưu đãi độc quyền.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80"
              alt="Coffee shop"
              className="w-full h-64 object-cover"
            />
            <div className="p-4 bg-white">
              <p className="text-sm text-gray-700">
                🎁 Ưu đãi đặc biệt: Nhận ngay voucher 50.000đ cho đơn hàng đầu tiên khi đăng ký thành công!
              </p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Đăng ký tài khoản</h1>
              <p className="text-sm text-gray-500 mt-1">Điền thông tin để tạo tài khoản mới</p>
            </div>
            <div className="text-sm">
              <Link href="/" className="text-amber-900 font-medium hover:underline">Trang chủ</Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {/* Hiển thị lỗi chung */}
            {error && (
              <div role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded animate-pulse">
                ⚠️ {error}
              </div>
            )}

            {/* Họ tên */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                placeholder="0912345678"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                placeholder="username123"
                required
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-amber-700"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-amber-700"
                >
                  {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {/* Điều khoản */}
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="agree"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="w-4 h-4 mt-1 text-amber-900 rounded border-gray-300 focus:ring-amber-200 cursor-pointer"
              />
              <label htmlFor="agree" className="text-sm text-gray-600 cursor-pointer select-none">
                Tôi đồng ý với{' '}
                <Link href="/terms" className="text-amber-900 hover:underline">Điều khoản dịch vụ</Link>
                {' '}và{' '}
                <Link href="/privacy" className="text-amber-900 hover:underline">Chính sách bảo mật</Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-amber-900 text-white px-4 py-3 rounded-lg font-medium hover:bg-amber-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : 'Đăng ký ngay'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" className="text-amber-900 hover:underline font-bold">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import Link from 'next/link'
import UserService from '@/services/UserService' // Đảm bảo UserService có hàm forgotPassword

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.')
      return
    }

    setLoading(true)
    
    try {
      // Gọi API quên mật khẩu
      // Backend cần route: POST /api/forgot-password { email }
      const res = await UserService.forgotPassword({ email });

      // Kiểm tra phản hồi (Axios trả về data trong res.data hoặc trực tiếp res)
      const data = res.data ? res.data : res;

      if (data && data.status) {
          setSuccessMessage('Đã gửi email khôi phục mật khẩu! Vui lòng kiểm tra hộp thư của bạn.');
          setEmail(''); // Clear form để tránh spam
      } else {
          setError(data.message || 'Không thể gửi email. Vui lòng thử lại.');
      }

    } catch (err) {
      console.error("Forgot Password Error:", err)
      
      let msg = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      if (err.response && err.response.data) {
         msg = err.response.data.message || msg;
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left: Illustration (Giống Login nhưng đổi ảnh/text cho hợp ngữ cảnh) */}
        <div className="hidden md:flex flex-col justify-center px-6">
          <div className="mb-6">
            <h2 className="text-4xl font-serif text-amber-900">Quên mật khẩu?</h2>
            <p className="mt-3 text-gray-600">Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập chỉ trong vài bước đơn giản.</p>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200&q=80"
              alt="Coffee beans"
              className="w-full h-64 object-cover"
            />
            <div className="p-4 bg-white">
              <p className="text-sm text-gray-700">
                Tip: Kiểm tra cả mục <b>Spam</b> hoặc <b>Quảng cáo</b> nếu bạn không thấy email trong hộp thư đến.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Khôi phục tài khoản</h1>
              <p className="text-sm text-gray-500 mt-1">Nhập email để nhận liên kết đặt lại mật khẩu</p>
            </div>
            <div className="text-sm">
              <Link href="/auth/login" className="text-amber-900 font-medium hover:underline">← Đăng nhập</Link>
            </div>
          </div>

          {/* Hiển thị Thành công */}
          {successMessage ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-green-900">Email đã được gửi!</h3>
                <p className="mt-2 text-sm text-green-700">{successMessage}</p>
                <div className="mt-6">
                    <Link href="/auth/login" className="text-sm font-medium text-green-700 hover:text-green-600 underline">
                        Quay lại trang đăng nhập
                    </Link>
                </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                
                {/* Hiển thị Lỗi */}
                {error && (
                <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded animate-pulse flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
                )}

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ Email đã đăng ký</label>
                <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if(error) setError('');
                    }}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                    placeholder="name@example.com"
                    required
                />
                </div>

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
                    <span>Đang gửi...</span>
                    </>
                ) : 'Gửi yêu cầu'}
                </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-sm text-gray-500">
                Gặp khó khăn? <Link href="/contact" className="text-amber-900 hover:underline font-medium">Liên hệ hỗ trợ</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
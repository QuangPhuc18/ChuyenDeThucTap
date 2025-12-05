'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validateEmail = (e) => {
    // simple email check
    return /\S+@\S+\.\S+/.test(e)
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    setError('')

    if (!email || !validateEmail(email)) {
      setError('Vui lòng nhập email hợp lệ.')
      return
    }
    if (!password || password.length < 6) {
      setError('Mật khẩu phải tối thiểu 6 ký tự.')
      return
    }

    setLoading(true)
    try {
      // TODO: Thay đoạn MOCK bằng call API thực tế của bạn
      // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // })
      // if (!res.ok) throw new Error('Đăng nhập thất bại')
      // const data = await res.json()
      // localStorage.setItem('authToken', data.token)

      // MOCK behavior (simulate network)
      await new Promise((r) => setTimeout(r, 800))
      // simple mock auth: if email includes "admin" treat as admin demo
      localStorage.setItem('authToken', 'demo-token')
      localStorage.setItem('userEmail', email)
      if (remember) localStorage.setItem('rememberMe', '1')

      // redirect back to intended page
      router.push(redirectTo)
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Illustration / Branding */}
        <div className="hidden md:flex flex-col justify-center px-6">
          <div className="mb-6">
            <h2 className="text-4xl font-serif text-amber-900">Welcome back</h2>
            <p className="mt-3 text-gray-600">Đăng nhập để tiếp tục trải nghiệm mua sắm. Quản lý đơn hàng, lịch sử và nhiều hơn nữa.</p>
          </div>

          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&q=80"
              alt="Coffee"
              className="w-full h-64 object-cover"
            />
            <div className="p-4 bg-white">
              <p className="text-sm text-gray-700">
                Tip: Bạn có thể dùng email bất kỳ trong demo để đăng nhập. Nếu muốn admin demo, email chứa "admin".
              </p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Đăng nhập</h1>
              <p className="text-sm text-gray-500 mt-1">Đăng nhập bằng tài khoản của bạn để tiếp tục</p>
            </div>
            <div className="text-sm">
              <Link href="/" className="text-amber-900 font-medium hover:underline">Quay về trang chủ</Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="you@example.com"
                required
                aria-invalid={!!error && !validateEmail(email)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {/* simple eye icon */}
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.657 0 3.22.402 4.625 1.115M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 2l20 20M9.88 9.88A3 3 0 0114.12 14.12M10.58 6.58A9.014 9.014 0 0121 12c0 3-4 7-9 7-1.087 0-2.13-.155-3.088-.444" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-amber-900 rounded border-gray-300 focus:ring-amber-200"
                />
                <span className="text-gray-600">Ghi nhớ đăng nhập</span>
              </label>

              <Link href="/forgot-password" className="text-sm text-amber-900 hover:underline">Quên mật khẩu?</Link>
            </div>

            {error && (
              <div role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-amber-900 text-white px-4 py-3 rounded-lg font-medium hover:bg-amber-800 transition disabled:opacity-60"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                )}
                <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative text-center">
              <span className="text-sm text-gray-400 bg-white px-3">Hoặc tiếp tục với</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => alert('Chức năng demo. Tích hợp OAuth ở backend.')}
                className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                  <path d="M533.5 278.4c0-17.4-1.4-34.1-4-50.4H272v95.6h147.4c-6.3 33.8-25 62.5-53.2 81.8v68.1h85.8c50.2-46.2 79.5-114.6 79.5-195.1z" fill="#4285F4"/>
                  <path d="M272 544.3c72.8 0 134-24.1 178.6-65.5l-85.8-68.1c-24 16.1-54.7 25.6-92.8 25.6-71.3 0-131.8-48-153.6-112.5H32.9v70.7C77.2 486.2 168.6 544.3 272 544.3z" fill="#34A853"/>
                  <path d="M118.4 325.8c-8.5-25.1-8.5-52.1 0-77.2V177.9H32.9c-39.8 79.6-39.8 173.2 0 252.8l85.5-65z" fill="#FBBC05"/>
                  <path d="M272 107.9c39.6 0 75.3 13.6 103.4 40.3l77.6-77.6C403.2 24.1 342 0 272 0 168.6 0 77.2 58.1 32.9 147.9l85.5 70.7C140.2 156 200.7 107.9 272 107.9z" fill="#EA4335"/>
                </svg>
                <span className="text-sm">Google</span>
              </button>

              <button
                onClick={() => alert('Chức năng demo. Tích hợp OAuth ở backend.')}
                className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99H8.898v-2.89h1.54V9.845c0-1.522.904-2.365 2.288-2.365.662 0 1.355.12 1.355.12v1.49h-.76c-.75 0-.984.466-.984.945v1.13h1.672l-.267 2.89h-1.405V21.88C18.343 21.128 22 16.991 22 12z" />
                </svg>
                <span className="text-sm">Facebook</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" className="text-amber-900 hover:underline">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
// Layout cho trang chính (site) — có Header và Footer
import Header from '../../components/Header'
import Footer from '../../components/Footer'

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'E-Commerce - Main'
}

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
    </div>
  )
}
// import '../styles/globals.css'
// import Header from '../components/Header'
// import Footer from '../components/Footer'

// export const metadata = {
//   title: process.env.NEXT_PUBLIC_SITE_NAME || 'E-Commerce'
// }

// export default function RootLayout({ children }) {
//   return (
//     <html lang="vi">
//       <body className="min-h-screen flex flex-col">
//         <Header />
//         <main className="flex-1 container mx-auto px-4 py-6">
//           {children}
//         </main>
//         <Footer />
//       </body>
//     </html>
//   )
// }
import '../styles/globals.css'

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'E-Commerce'
}

export default function RootLayout({ children }) {
  // Root layout rất nhẹ — chỉ import global css và render children.
  // Header/Footer sẽ nằm trong (main)/layout.js, admin sẽ có (admin)/layout.js
  return (
    <html lang="vi">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
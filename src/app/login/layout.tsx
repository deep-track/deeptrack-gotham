import { Inter } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import Footer from '@/components/layout/Footer' 

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Login - My Gotham App',
  description: 'Login to verify deepfakes',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground`}>
          <Header />
          <main className="px-6">
            {children}
          </main>
          <Footer />
      </body>
    </html>
  )
}

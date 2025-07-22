import '../index.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'My Gotham App',
  description: 'Verifies images using App Router',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider defaultTheme="light" storageKey="deeptrack-theme">
          <div className="min-h-screen flex flex-col">

            {/* Header (fixed if needed) */}
            <Header />

            {/* Sidebar + Main Content Wrapper */}
            <div className="flex flex-1 overflow-hidden">

              {/* Sidebar */}
              <aside className="hidden lg:flex lg:w-64 flex-shrink-0 border-r">
                  <Sidebar />
              </aside>

              {/* Main Content */}
              <main className="flex-1 overflow-y-auto p-4">
                {children}
              </main>
            </div>

            {/* Footer */}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

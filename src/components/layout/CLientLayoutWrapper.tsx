'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import Footer from './Footer'

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* <aside className="hidden lg:flex lg:w-64 flex-shrink-0 border-r">
          <Sidebar />
        </aside> */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
      <Footer />
    </div>
  )
}

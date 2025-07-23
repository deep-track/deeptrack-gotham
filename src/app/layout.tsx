import '../index.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import ClientLayoutWrapper from '@/components/layout/CLientLayoutWrapper'

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
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}

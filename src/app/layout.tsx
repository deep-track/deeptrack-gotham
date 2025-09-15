import '../index.css';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ClerkProvider } from '@clerk/nextjs';
import EnsureFullName from './EnsureFullName';
import HydrateHistory from './prefetch-history';

const inter = Inter({ subsets: ['latin'], fallback: ['sans-serif'] });


export const metadata = {
  title: 'My Gotham App',
  description: 'Verifies images using App Router',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ClerkProvider>
          <EnsureFullName />
          <HydrateHistory />
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <main className="flex-1 overflow-y-auto p-4">
                {children}
              </main>
            </div>
            <Footer />
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}

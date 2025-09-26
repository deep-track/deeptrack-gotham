import '../index.css';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ClerkProvider } from '@clerk/nextjs';
import EnsureFullName from './EnsureFullName';
import HydrateHistory from './prefetch-history';

const inter = Inter({ subsets: ['latin'], fallback: ['sans-serif'] });

export const metadata = {
  title: 'Deeptrack Gotham ',
  description: 'Deepfake Verification made easy.',
  icons: {
    icon: 'logo-light.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Check if we're in build mode or have placeholder values
  const isBuildMode = process.env.NODE_ENV === 'production' && 
    (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('your_clerk_publishable_key') ||
     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder'));

  if (isBuildMode) {
    // Return a simple layout without Clerk for build time
    return (
      <html lang="en" className={inter.className}>
        <body>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </div>
        </body>
      </html>
    );
  }

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

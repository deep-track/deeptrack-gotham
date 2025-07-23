'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Shield, History, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Dashboard', icon: <Shield className="h-4 w-4" /> },
    { href: '/history', label: 'History', icon: <History className="h-4 w-4" /> },
    { href: '/login', label: 'Log In', icon: <LogIn className="h-4 w-4" /> },
    { href: '/signup', label: 'Sign Up', icon: <UserPlus className="h-4 w-4" /> },
  ]

  const navLinkClass = (href: string) =>
    `flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
      pathname === href
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 theme-transition">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Left: Logo & Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 animate-fade-in">
              {navItems.map((item) => (
                <DropdownMenuItem asChild key={item.href}>
                  <Link href={item.href} className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
                    {item.icon}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/logo-dark.jpg"
              alt="Logo"
              width={48}
              height={48}
              className="rounded-md object-cover"
              priority
            />
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-bold text-white">
                <span className="hidden sm:inline">Deeptrack Gotham</span>
                <span className="sm:hidden">Deeptrack Gotham</span>
              </h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Deepfakes Verification
              </span>
            </div>
          </div>
        </div>

        {/* Right: Nav Links */}
        <div className="hidden lg:flex items-center gap-2 sm:gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}

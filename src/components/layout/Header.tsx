'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Shield, History, LogIn, UserPlus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'


interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsub()
  }, [])

  const primaryNav = [
    { href: '/', label: 'Dashboard', icon: <Shield className="h-4 w-4" /> },
    { href: '/history', label: 'History', icon: <History className="h-4 w-4" /> },
  ]

  const navLinkClass = (href: string) =>
    cn(
      'flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
      pathname === href
        ? 'bg-gradient-to-r from-[hsl(var(--primary))]/60 to-[#7F5AF0]/70 text-white shadow-inner'
        : 'text-muted-foreground hover:text-white hover:bg-white/5 hover:backdrop-blur-md'
    )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] theme-transition">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Logo & Mobile Menu */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden hover:bg-white/5"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5 text-muted-foreground hover:text-white transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-52 rounded-xl border border-white/10 bg-background/80 backdrop-blur-md animate-in fade-in slide-in-from-top-2"
            >
              {primaryNav.map((item) => (
                <DropdownMenuItem asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-white/5 hover:text-white transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}

              {!user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      Log In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/signup"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => signOut(auth)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-white/5 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-dark.jpg"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg object-cover ring-1 ring-white/10 shadow-md"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm sm:text-base font-semibold text-white">Deeptrack Gotham</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Deepfakes Verification
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-4 sm:gap-6">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {user ? (
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 hover:backdrop-blur-md">
                  {/* Avatar with initials fallback */}
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {user.photoURL ? (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || "User")}&background=random&color=fff&size=128`}
                        alt={user.displayName || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      (user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm">
                    Account
                  </span>
                </button>
              ) : (
                <Button
                  variant="ghost"
                  className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-white/5 hover:backdrop-blur-md"
                >
                  Account
                </Button>
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border border-white/10 bg-background/80 backdrop-blur-md"
            >
              {!user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      Log In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/signup"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {/* User Info Header */}
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-medium">{user.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>

                  {/* Logout Button */}
                  <DropdownMenuItem
                    onClick={() => signOut(auth)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}

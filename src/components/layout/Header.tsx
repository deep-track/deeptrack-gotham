'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useClerk, useUser } from "@clerk/nextjs"
import { createPortal } from "react-dom"
import { Menu, Shield, History, LogIn, UserPlus, LogOut, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { TokenDisplay } from "@/components/tokens/token-display"
import { TokenPurchase } from "@/components/tokens/token-purchase"
import { SimpleTokenPurchase } from "@/components/tokens/simple-token-purchase"


export function Header() {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const { toast } = useToast();


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


const handleDelete = async () => {
  if (inputValue !== "DELETE") return;

  setLoading(true);
  try {
    const res = await fetch("/api/delete-account", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      console.error("Server error:", data);
      throw new Error("Failed to delete account");
    }

    toast({
      title: "Account deleted",
      description: "Your account was successfully deleted.",
      variant: "default",
      duration: 2000,
    });

    setTimeout(async () => {
      await signOut();
      router.push("/");
    }, 1200); 
  } catch (err) {
    console.error(err);

    toast({
      title: "Deletion failed",
      description: "Could not delete account. Try again later.",
      variant: "destructive",
      duration: 2000,
    });
  } finally {
    setLoading(false);
    setModalOpen(false);
    setInputValue("");
  }
};

  const modal = modalOpen && createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background/90 backdrop-blur-md rounded-xl p-6 w-80 flex flex-col gap-4 shadow-[hsl(var(--primary))] shadow-sm border border border-white/20"
      >
        <h3 className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">
          Confirm Account Deletion
        </h3>
        <p className="text-sm text-muted-foreground">
          Type <span className="font-mono text-red-400">DELETE</span> to confirm.
        </p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type DELETE here"
          autoFocus
          className="w-full px-3 py-2 rounded-md bg-input text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setModalOpen(false)}
            className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-500 text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || inputValue !== "DELETE"}
            className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] theme-transition">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Logo & Mobile Menu */}
        <div className="flex items-center gap-4 sm:gap-6">
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

              {/* Token Display for Mobile */}
              {isSignedIn && (
                <div className="px-3 py-2 border-t border-white/10">
                  <TokenDisplay showPurchaseButton={false} />
                  <div className="mt-3">
                    <TokenPurchase
                      trigger={
                        <Button size="sm" className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] hover:opacity-90">
                          <Coins className="h-4 w-4 mr-2" />
                          Buy Tokens
                        </Button>
                      }
                    />
                  </div>
                </div>
              )}

              {!isSignedIn ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex items-center gap-2 cursor-pointer">
                      <LogIn className="h-4 w-4" /> Log In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup" className="flex items-center gap-2 cursor-pointer">
                      <UserPlus className="h-4 w-4" /> Sign Up
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => signOut()} className="ml-2 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    asChild
                    onSelect={(event) => {
                      event.preventDefault()
                      setModalOpen(true)
                    }}
                  >
                    <button className="w-full bg-red-600/80 text-white font-medium py-2 px-4 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center">
                      Delete My Account
                    </button>
                  </DropdownMenuItem>
                </>
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
                Deepfakes Detection
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
          
          {/* Token Display */}
          {isSignedIn && (
            <div className="hidden xl:flex">
              <TokenDisplay showPurchaseButton={true} />
            </div>
          )}

          {/* Simple Token Purchase for smaller screens */}
          {isSignedIn && (
            <div className="hidden lg:flex xl:hidden">
              <TokenPurchase
                trigger={
                  <Button size="sm" className="bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] hover:opacity-90">
                    <Coins className="h-4 w-4 mr-2" />
                    Buy Tokens
                  </Button>
                }
              />
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isSignedIn ? (
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 hover:backdrop-blur-md">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium overflow-hidden">
                    {user && (
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.firstName || "User")}&background=random&color=fff&size=32`}
                        alt={user.fullName || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm">Account</span>
                </button>
              ) : (
                <Button variant="ghost" className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-white/5 hover:backdrop-blur-md">
                  Account
                </Button>
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border border-white/10 bg-background/80 backdrop-blur-md"
            >
              {!isSignedIn ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex items-center gap-2 cursor-pointer">
                      <LogIn className="h-4 w-4" /> Log In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup" className="flex items-center gap-2 cursor-pointer">
                      <UserPlus className="h-4 w-4" /> Sign Up
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-medium">{user?.fullName || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    asChild
                    onSelect={(event) => {
                      event.preventDefault()
                      setModalOpen(true)
                    }}
                  >
                    <button className="w-full bg-red-600/80 text-white font-medium py-2 px-4 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center">
                      Delete My Account
                    </button>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </nav>
      </div>

      {modal}
    </header>
  )
}

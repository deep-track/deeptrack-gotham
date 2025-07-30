'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Login successful!')
    console.log({ email, password })
  }

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto flex items-center justify-center bg-background text-foreground px-4">
      <div className="flex flex-col md:flex-row-reverse w-full max-w-5xl rounded-2xl overflow-hidden border border-border shadow-[0_0_40px_rgba(0,0,0,0.2)] backdrop-blur-md bg-card/70">

        {/* Left image */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <Image
            src="/deeptrack-security.svg"
            alt="Login Illustration"
            className="object-contain h-full w-full"
            width={400}
            height={400}
          />
        </div>

        {/* Right form area */}
        <div className="w-full md:w-1/2 px-6 py-10 sm:px-10 md:p-14 space-y-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-1 text-foreground/80">Business Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-input text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-foreground/80">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-input text-foreground border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              <div className="text-right mt-1">
                <Link href="/forgot-password" className="text-sm text-foreground/80 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r  from-[hsl(var(--primary))]/60 to-[#7F5AF0]/70 text-stone-150 font-medium py-2 rounded-md shadow-sm hover:opacity-90 transition"
            >
              Log In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col gap-4">
            <button
              className="flex items-center justify-center gap-2 w-full bg-white/5 text-white py-2 rounded-md hover:bg-gray-100 transition border border-border"
            >
              <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
              Continue with Google
            </button>

            <button
              className="flex items-center justify-center gap-2 w-full bg-[#1877F2] text-white py-2 rounded-md hover:brightness-110 transition"
            >
              <div className="p-1 bg-white rounded-full">
                <Image src="/facebook-logo.png" alt="Facebook" width={18} height={18} />
              </div>              Continue with Facebook
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-white hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

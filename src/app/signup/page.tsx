'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from "next/navigation"

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Signup successful!')
    router.push("/login")

    console.log({ email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col md:flex-row-reverse w-full max-w-5xl rounded-xl overflow-hidden border border-border shadow-xl">

        <div className="w-full h-64 relative md:w-1/2 md:h-auto md:min-h-full">
          <Image
            src="/deeptrack-security.svg"
            alt="Signup Illustration"
            fill
            className="object-cover"
          />
        </div>

        <div className="w-full md:w-1/2 bg-card px-6 py-8 sm:px-8 md:p-12 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">Welcome Back</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-input text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-input text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 transition"
            >
              Log In
            </button>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Create one
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

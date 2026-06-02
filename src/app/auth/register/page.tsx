'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth/client'
import { getDashboardRoute } from '@/lib/auth/routes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { user, error: authError } = await signUp(email, password, displayName)

    if (authError) {
      setError(authError)
      setLoading(false)
      return
    }

    if (user) {
      setSuccess(true)
      setTimeout(() => {
        router.push(getDashboardRoute(user.role))
        router.refresh()
      }, 1000)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fifa-navy to-fifa-blue px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-fifa-blue">Create Account</h1>
          <p className="text-sm text-text-secondary">Join the Competition</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input
            label="Name"
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-fifa-red">{error}</p>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <p className="text-green-500 font-semibold">Account created!</p>
              <p className="text-sm text-gray-300 mt-1">Redirecting to home...</p>
            </div>
          )}

          {!success && (
            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-fifa-blue hover:underline">
            Sign In
          </Link>
        </p>
      </Card>
    </div>
  )
}

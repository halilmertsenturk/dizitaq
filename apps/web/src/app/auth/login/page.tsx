'use client'

import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}

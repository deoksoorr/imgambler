'use client'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function AuthStatus() {
  const { data: session } = useSession()

  if (session?.user) {
    return (
      <div>
        {session.user.email}님 | <button onClick={() => signOut()}>Logout</button>
      </div>
    )
  }

  return (
    <button onClick={() => signIn('google', { callbackUrl: window.location.href })}>Login</button>
  )
}
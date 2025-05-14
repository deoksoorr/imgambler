'use client'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import AvatarPicker from './AvatarPicker'
import { FiEdit, FiLogOut, FiLogIn, FiUser, FiSettings } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

export default function AuthButtons() {
  const { data: session } = useSession()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch('/api/user/profile')
          if (res.ok) {
            const data = await res.json()
            if (data.image) setProfileImage(data.image)
          }
        } catch {}
      }
    }
    fetchProfile()
  }, [session?.user?.email])

  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch('/api/user/is-admin')
          if (res.ok) {
            const data = await res.json()
            setIsAdmin(data.isAdmin)
          }
        } catch {}
      }
    }
    checkAdmin()
  }, [session?.user?.email])

  useEffect(() => {
    if (session && session.expires && new Date(session.expires) < new Date()) {
      signOut()
    }
  }, [session])

  return (
    <div className="flex items-center gap-2 pr-2">
      {session ? (
        <>
          <div className="flex items-center gap-1">
            {profileImage ? (
              <img
                src={profileImage}
                alt="avatar"
                className="w-7 h-7 rounded-full border border-gray-300 bg-white object-cover"
              />
            ) : session.user?.image ? (
              <img
                src={session.user.image}
                alt="avatar"
                className="w-7 h-7 rounded-full border border-gray-300 bg-white object-cover"
              />
            ) : (
              <FiUser className="w-7 h-7 text-gray-400 bg-white rounded-full border" />
            )}
            <span className="text-black text-xs font-semibold max-w-[80px] truncate">{session.user?.name}</span>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-black rounded-full hover:bg-blue-200 text-xs font-semibold border border-blue-200 shadow-sm"
            title="Edit Profile"
            style={{height: '28px'}}
          >
            <FiEdit className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-black rounded-full hover:bg-purple-200 text-xs font-semibold border border-purple-200 shadow-sm"
              title="Admin Panel"
              style={{height: '28px'}}
            >
              <FiSettings className="w-4 h-4" />
              Admin
            </button>
          )}
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1 px-2 py-1 bg-red-100 text-black rounded-full hover:bg-red-200 text-xs font-semibold border border-red-200 shadow-sm"
            title="Logout"
            style={{height: '28px'}}
          >
            <FiLogOut className="w-4 h-4" />
          </button>
          {showProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Change Profile Avatar</h2>
                  <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
                </div>
                <AvatarPicker onClose={() => setShowProfileModal(false)} />
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={() => signIn('google', { callbackUrl: window.location.href })}
          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-black rounded-full hover:bg-blue-200 text-xs font-semibold border border-blue-200 shadow-sm"
          title="Login with Google"
          style={{height: '28px'}}
        >
          <FiLogIn className="w-4 h-4" />
          Login
        </button>
      )}
    </div>
  )
} 
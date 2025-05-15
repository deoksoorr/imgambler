import React, { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
  createdAt: string
}

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to load users.')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (!confirm(`Are you sure you want to ${currentIsAdmin ? 'remove admin' : 'set as admin'}?`)) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentIsAdmin }),
      })
      if (!res.ok) throw new Error('Failed to change admin status.')
      fetchUsers()
    } catch (err) {
      setError('Failed to change admin status.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {loading && <div className="text-blue-700 font-bold">Loading...</div>}
      {error && <div className="text-red-700 font-bold">{error}</div>}
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="p-4 border rounded bg-white flex items-center justify-between">
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-lg">{user.name}</div>
              <div className="text-base text-gray-900">{user.email}</div>
              <div className="text-xs text-gray-900 font-bold">
                Joined: {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
              className={`px-4 py-2 rounded font-bold ${
                user.isAdmin 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-700 hover:bg-blue-800'
              } text-white`}
            >
              {user.isAdmin ? 'Remove Admin' : 'Set as Admin'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'

type Props = {
  postId: number
  likes: number
  dislikes: number
  onScoreChange?: (likes: number, dislikes: number) => void
}

export default function LikeDislikeButtons({ postId, likes: initialLikes, dislikes: initialDislikes, onScoreChange }: Props) {
  const { data: session } = useSession()
  const [likes, setLikes] = useState(initialLikes || 0)
  const [dislikes, setDislikes] = useState(initialDislikes || 0)
  const [isLoading, setIsLoading] = useState(false)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUserVote() {
      if (!session) return
      const res = await fetch(`/api/posts/${postId}/vote-status`)
      if (res.ok) {
        const data = await res.json()
        setUserVote(data.userVote)
      }
    }
    fetchUserVote()
  }, [session, postId])

  useEffect(() => {
    setLikes(initialLikes || 0)
    setDislikes(initialDislikes || 0)
  }, [initialLikes, initialDislikes])

  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(likes, dislikes)
    }
  }, [likes, dislikes, onScoreChange])

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!session) {
      signIn('google', { callbackUrl: window.location.href })
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      if (userVote === voteType) {
        const res = await fetch(`/api/posts/${postId}/vote-cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) throw new Error('추천/비추천 취소에 실패했습니다.')
        const data = await res.json()
        setLikes(data.likes || 0)
        setDislikes(data.dislikes || 0)
        setUserVote(null)
        return
      }
      const endpoint = voteType === 'like' ? 'vote' : 'dislike'
      const response = await fetch(`/api/posts/${postId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('추천/비추천 처리에 실패했습니다.')
      const data = await response.json()
      setLikes(data.likes || 0)
      setDislikes(data.dislikes || 0)
      setUserVote(data.userVote)
    } catch (error) {
      setError((error as Error).message || '추천/비추천 처리 중 오류가 발생했습니다.')
      console.error('Error voting:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const score = likes - dislikes

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-center text-sm font-semibold">
          {error}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleVote('like')}
          disabled={isLoading}
          className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
            userVote === 'like'
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          } disabled:opacity-50`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {userVote === 'like' ? 'Liked' : 'Like'}
        </button>
        <button
          onClick={() => handleVote('dislike')}
          disabled={isLoading}
          className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
            userVote === 'dislike'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          } disabled:opacity-50`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
          {userVote === 'dislike' ? 'Disliked' : 'Dislike'}
        </button>
      </div>
    </div>
  )
}
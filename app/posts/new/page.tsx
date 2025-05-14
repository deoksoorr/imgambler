'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface Board {
  id: string
  name: string
  slug: string
  description?: string
  category?: {
    name: string
  }
}

export default function NewPostPageWrapper() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <NewPostPage />
    </Suspense>
  )
}

function NewPostPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) {
      router.push('/')
      return
    }

    const fetchBoards = async () => {
      try {
        const response = await fetch('/api/boards')
        if (response.ok) {
          const data = await response.json()
          setBoards(data)

          const boardSlug = searchParams.get('board')
          if (boardSlug) {
            const board = data.find((b: Board) => b.slug === boardSlug)
            if (board) {
              setSelectedBoard(board)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching boards:', error)
      }
    }

    fetchBoards()
  }, [session, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBoard) {
      alert('게시판을 선택해주세요.')
      return
    }

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          boardId: selectedBoard.id,
        }),
        credentials: 'include',
      })

      if (response.ok) {
        const post = await response.json()
        router.push(`/board/${selectedBoard.category?.name.toLowerCase().replace(/\s+/g, '-')}/${selectedBoard.slug}/${post.postKey}`)
      } else {
        alert('게시글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('게시글 작성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user) {
    return null
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <button type="button" onClick={() => router.back()} className="text-blue-800 hover:text-blue-900 font-bold">← 뒤로가기</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg shadow-lg p-8 border border-gray-300">
        <div>
          <label htmlFor="board" className="block text-sm font-bold text-gray-900 mb-1">게시판</label>
          <select
            id="board"
            value={selectedBoard?.id || ''}
            onChange={(e) => {
              const board = boards.find(b => b.id === e.target.value)
              setSelectedBoard(board || null)
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-700 focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm rounded-md text-gray-900 font-bold bg-gray-50"
            required
          >
            <option value="">게시판을 선택하세요</option>
            {boards.map((board) => (
              <option key={board.id} value={board.id} className="text-gray-900 font-bold">
                {board.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-bold text-gray-900 mb-1">제목</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border-gray-700 rounded-md shadow-sm focus:ring-blue-800 focus:border-blue-800 sm:text-sm text-gray-900 font-bold bg-gray-50"
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-bold text-gray-900 mb-1">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="mt-1 block w-full border-gray-700 rounded-md shadow-sm focus:ring-blue-800 focus:border-blue-800 sm:text-sm text-gray-900 font-bold bg-gray-50"
            required
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800"
          >
            {isLoading ? '작성 중...' : '작성'}
          </button>
        </div>
      </form>
    </main>
  )
} 
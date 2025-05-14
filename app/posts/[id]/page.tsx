'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import Comments from '@/components/Comments'
import LikeDislikeButtons from '@/components/LikeDislikeButtons'
import { FaThumbtack } from 'react-icons/fa'

// 타입 정의 추가
interface User {
  id: number
  name: string | null
  email: string | null
  image?: string | null
}
interface Board {
  id: number
  slug: string
  name: string
}
interface Post {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
  views: number
  isPinned: boolean
  isNotice: boolean
  likes: number
  dislikes: number
  commentsCount: number
  user: User
  board: Board
  boardId: number
}

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resolvedParams = use(params) as { id: string }

  // 관리자 이메일 목록 (API와 동일하게 유지)
  const ADMIN_EMAILS = ['a2381016@gmail.com']
  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email || '')

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setPost(data)
          setEditTitle(data.title)
          setEditContent(data.content)
          setError(null)
        } else if (response.status === 404) {
          setError('존재하지 않는 게시글입니다.')
        } else {
          setError('게시글을 불러오는 중 오류가 발생했습니다.')
        }
      } catch (e) {
        setError('네트워크 오류가 발생했습니다.')
      }
    }
    fetchPost()
  }, [resolvedParams.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/board/${data.board.slug}`)
        router.refresh()
      } else {
        alert('Failed to delete post.')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('An error occurred while deleting the post.')
    }
  }

  const handleEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Please enter both title and content.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPost(updatedPost)
        setIsEditing(false)
        router.push(`/board/${updatedPost.boardId}`)
      } else {
        alert('Failed to update post.')
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert('An error occurred while updating the post.')
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{error}</h1>
        <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">홈으로 돌아가기</Link>
      </div>
    )
  }
  if (!post) return <div>Loading...</div>

  const isAuthor = session?.user?.email === post.user?.email

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        {post?.boardId && (
          <Link href={`/board/${post.board?.slug}`} className="text-blue-600 hover:text-blue-800">
            ← Back to Board
          </Link>
        )}
      </div>

      <article className="bg-white rounded-lg shadow p-6">
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Title"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] text-black"
              placeholder="Content"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditTitle(post.title)
                  setEditContent(post.content)
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {post.title}
                {/* 핀셋 아이콘: 고정 게시글이면 노출 */}
                {post.isPinned && !post.isNotice && (
                  <FaThumbtack className="text-yellow-500" title="Pinned" />
                )}
              </h1>
              <div className="flex space-x-2">
                {/* 관리자만 핀 버튼 노출, 공지사항이 아니고 일반 게시글일 때만 */}
                {isAdmin && !post.isNotice && (
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/posts/${post.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isPinned: !post.isPinned }),
                      })
                      if (res.ok) {
                        const updated = await res.json()
                        setPost(updated)
                        router.refresh()
                      } else {
                        alert('Failed to update pin status.')
                      }
                    }}
                    className={`flex items-center px-3 py-1 rounded-lg font-semibold ${post.isPinned ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-yellow-500`}
                    title={post.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <FaThumbtack className="mr-1" />
                    {post.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
                {isAuthor && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
              {post.user?.image ? (
                <img src={post.user.image} alt="profile" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="inline-block w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
                  </svg>
                </span>
              )}
              <span>
                Author: {post.isNotice === true ? 'Manager' : (post.user?.name ? post.user.name : 'Anonymous')}
              </span>
              <span> | Date: {format(new Date(post.createdAt), 'MMM d, yyyy', { locale: enUS })}</span>
              <span> | Views: {post.views}</span>
              <span> | Score: {post.likes - post.dislikes}</span>
            </div>
            <div className="text-lg text-gray-900 mb-4 whitespace-pre-line">{post.content}</div>
          </>
        )}
      </article>
      {/* 댓글 바로 위에만 Score/Like/Dislike UI가 보이도록 Comments에만 전달 */}
      <Comments postId={post.id} likes={post.likes} dislikes={post.dislikes} isNotice={post.isNotice} />
    </main>
  )
}
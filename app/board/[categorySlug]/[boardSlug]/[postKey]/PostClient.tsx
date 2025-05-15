'use client'

import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Comments from '../../../../../components/Comments'
import { FaCrown } from 'react-icons/fa'

function formatDate(date: string) {
  const d = new Date(date)
  return d.getUTCFullYear().toString().slice(2) + '. ' +
    String(d.getUTCMonth() + 1).padStart(2, '0') + '. ' +
    String(d.getUTCDate()).padStart(2, '0') + '. ' +
    String(d.getUTCHours()).padStart(2, '0') + ':' +
    String(d.getUTCMinutes()).padStart(2, '0') + ':' +
    String(d.getUTCSeconds()).padStart(2, '0')
}

interface Post {
  id: number
  postKey: string
  title: string
  content: string
  userCode: string
  user?: {
    name?: string
    email?: string
    image?: string
  }
  createdAt: string
  updatedAt?: string
  isPinned: boolean
  isNotice: boolean
  isDeleted: boolean
  likes: number
  dislikes: number
  views: number
  boardId: number
  board?: {
    slug: string
  }
  imageUrl?: string
  commentsCount: number
}

export default function PostClient({ post, params }: { post: Post, params: { categorySlug: string, boardSlug: string, postKey: string } }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editContent, setEditContent] = useState(post.content)
  const [editImageUrl, setEditImageUrl] = useState(post.imageUrl || '')
  const [imagePreview, setImagePreview] = useState(post.imageUrl || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [dislikeLoading, setDislikeLoading] = useState(false)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null)
  const router = useRouter()
  const { data: session } = useSession()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/board/${params.categorySlug}/${params.boardSlug}/${params.postKey}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        router.push(`/board/${params.categorySlug}/${params.boardSlug}`)
        router.refresh()
      } else {
        alert('Failed to delete the post.')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('An error occurred while deleting the post.')
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImagePreview(URL.createObjectURL(file))
      setImageFile(file)
    }
  }

  const handleEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Please enter both title and content.')
      return
    }
    setIsLoading(true)
    try {
      let imageUrl = editImageUrl
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        imageUrl = data.url
      }
      const response = await fetch(`/api/board/${params.categorySlug}/${params.boardSlug}/${params.postKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          imageUrl,
        }),
        credentials: 'include',
      })
      if (response.ok) {
        const updatedPost = await response.json()
        router.refresh()
        setIsEditing(false)
        setEditImageUrl(imageUrl)
        setImagePreview(imageUrl)
        setImageFile(null)
      } else {
        alert('Failed to update the post.')
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert('An error occurred while updating the post.')
    } finally {
      setIsLoading(false)
    }
  }

  // 좋아요/싫어요 핸들러 (토글)
  const handleLike = async () => {
    if (!post) return
    setLikeLoading(true)
    try {
      if (userVote === 'like') {
        // 이미 좋아요면 취소
        await fetch(`/api/posts/${post.id}/vote-cancel`, { method: 'POST' })
        setUserVote(null)
        router.refresh()
      } else {
        const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          setUserVote('like')
          router.refresh()
        }
      }
    } finally {
      setLikeLoading(false)
    }
  }

  const handleDislike = async () => {
    if (!post) return
    setDislikeLoading(true)
    try {
      if (userVote === 'dislike') {
        // 이미 싫어요면 취소
        await fetch(`/api/posts/${post.id}/vote-cancel`, { method: 'POST' })
        setUserVote(null)
        router.refresh()
      } else {
        const res = await fetch(`/api/posts/${post.id}/dislike`, { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          setUserVote('dislike')
          router.refresh()
        }
      }
    } finally {
      setDislikeLoading(false)
    }
  }

  const isAuthor = session?.user?.email === post.user?.email

  // 게시판으로 돌아가기
  const goBackToBoard = () => {
    router.push(`/board/${params.categorySlug}/${params.boardSlug}`)
  }

  function getScoreColor(score: number) {
    if (score > 0) return 'text-blue-700 font-bold'
    if (score < 0) return 'text-red-600 font-bold'
    return 'text-gray-900 font-bold'
  }

  function getProfileImg(post: any) {
    return post.user?.image || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.userCode || 'user'}`
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-12">
      <div className="mb-4">
        <button onClick={goBackToBoard} className="text-blue-600 hover:text-blue-800">← Back to Board</button>
      </div>
      <div className="bg-white rounded-lg shadow p-8 border border-gray-300">
        {/* 상단: 제목/작성자/날짜/조회 */}
        <div className="border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h1>
          <div className="flex items-center text-sm text-gray-900 gap-4">
            <span className="flex items-center gap-2">
              {post.isNotice ? (
                <FaCrown className="text-yellow-500 w-6 h-6" title="Manager" />
              ) : (
                <img src={getProfileImg(post)} alt="profile" className="w-6 h-6 rounded-full object-cover" />
              )}
              {post.isNotice ? 'Manager' : (post.user?.name || 'Anonymous')}
            </span>
            <span>Date: {formatDate(post.createdAt)}</span>
            <span>Views: {post.views}</span>
            {post.updatedAt && <span>Edited: {formatDate(post.updatedAt)}</span>}
          </div>
        </div>
        {/* 첨부 이미지: 본문 위 */}
        {post.imageUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={post.imageUrl}
              alt="첨부 이미지"
              className="max-w-full max-h-[400px] rounded shadow border border-gray-300"
              style={{ objectFit: 'contain' }}
            />
          </div>
        )}
        {/* 본문 */}
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
            <div>
              <label className="block font-bold text-gray-900 mb-1">Attach Image</label>
              <div className="flex items-center gap-4">
                <input type="file" accept="image/*" onChange={handleImageChange} className="border p-2 rounded font-bold text-gray-900" />
                {imagePreview && (
                  <img src={imagePreview} alt="첨부 이미지" className="w-32 h-20 object-cover rounded border" />
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditTitle(post.title)
                  setEditContent(post.content)
                  setEditImageUrl(post.imageUrl || '')
                  setImagePreview(post.imageUrl || '')
                  setImageFile(null)
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
                {isLoading ? 'Editing...' : 'Edit'}
              </button>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none min-h-[200px] text-gray-900 mb-8" style={{whiteSpace:'pre-line'}}>
            {post.content}
          </div>
        )}
        {/* 좋아요/싫어요/Score */}
        {!isEditing && (
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`px-3 py-1 rounded font-bold text-base flex items-center gap-1 transition-colors
                ${userVote === 'like' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              👍 Like <span className="ml-1">{post.likes}</span>
            </button>
            <button
              onClick={handleDislike}
              disabled={dislikeLoading}
              className={`px-3 py-1 rounded font-bold text-base flex items-center gap-1 transition-colors
                ${userVote === 'dislike' ? 'bg-red-700 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              👎 Dislike <span className="ml-1">{post.dislikes}</span>
            </button>
            <span className="font-bold text-lg">Score: <span className={getScoreColor((post.likes || 0) - (post.dislikes || 0))}>{(post.likes || 0) - (post.dislikes || 0)}</span></span>
          </div>
        )}
        {/* 하단: 수정/삭제 버튼 */}
        {isAuthor && !isEditing && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      {/* 댓글/대댓글 */}
      <Comments postId={post.id} likes={post.likes} dislikes={post.dislikes} isNotice={post.isNotice} commentsCount={post.commentsCount} />
    </div>
  )
} 
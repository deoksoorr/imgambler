'use client'

import React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import LikeDislikeButtons from './LikeDislikeButtons'

type Comment = {
  id: number
  content: string
  author: string
  createdAt: string
  updatedAt: string | null
  userEmail: string
  parentId?: number | null
  replies: Comment[]
  deleted: boolean
}

type Props = {
  postId: number
  likes: number
  dislikes: number
  isNotice?: boolean
  commentsCount?: number
}

export default function Comments({ postId, likes, dislikes, isNotice, commentsCount }: Props) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [scoreLikes, setScoreLikes] = useState(likes)
  const [scoreDislikes, setScoreDislikes] = useState(dislikes)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    setReplyingTo(null)
    setReplyContent('')
  }, [])

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (!response.ok) throw new Error('댓글을 불러오는데 실패했습니다.')
      const data = await response.json()
      setComments(data)
      setError(null)
    } catch (error) {
      setError((error as Error).message || '댓글을 불러오는데 오류가 발생했습니다.')
      console.error('Error loading comments:', error)
    }
  }, [postId])

  useEffect(() => {
    if (mounted) {
      fetchComments()
    }
  }, [fetchComments, mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      signIn('google', { callbackUrl: window.location.href })
      return
    }
    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) throw new Error('댓글 작성에 실패했습니다.')

      const comment = await response.json()
      setComments([comment, ...comments])
      setNewComment('')
      setError(null)
    } catch (error) {
      setError((error as Error).message || '댓글 작성 중 오류가 발생했습니다.')
      console.error('Error creating comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (commentId: number) => {
    if (!editContent.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) throw new Error('댓글 수정에 실패했습니다.')

      const updatedComment = await response.json()
      setComments(comments.map(comment => 
        comment.id === commentId ? updatedComment : comment
      ))
      setEditingCommentId(null)
      setEditContent('')
      setError(null)
    } catch (error) {
      setError((error as Error).message || '댓글 수정 중 오류가 발생했습니다.')
      console.error('Error updating comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('댓글 삭제에 실패했습니다.')

      setComments(comments.map(comment =>
        comment.id === commentId
          ? { ...comment, content: "This comment has been deleted.", deleted: true }
          : comment
      ))
      setError(null)
    } catch (error) {
      setError((error as Error).message || '댓글 삭제 중 오류가 발생했습니다.')
      console.error('Error deleting comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const handleReply = async (parentId: number) => {
    if (!session) {
      signIn('google', { callbackUrl: window.location.href })
      return
    }
    if (!replyContent.trim()) return
    setIsLoading(true)
    try {
      const body: any = { content: replyContent }
      if (parentId) body.parentId = parentId
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error('답글 작성에 실패했습니다.')
      setReplyContent('')
      setReplyingTo(null)
      fetchComments()
      setError(null)
    } catch (error) {
      setError((error as Error).message || '답글 작성 중 오류가 발생했습니다.')
      console.error('Error creating reply:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 트리 구조로 댓글 정렬
  function nestComments(comments: Comment[]): (Comment & { replies: Comment[] })[] {
    const map = new Map<number, Comment & { replies: Comment[] }>()
    const roots: (Comment & { replies: Comment[] })[] = []
    comments.forEach((c) => map.set(c.id, { ...c, replies: [] }))
    map.forEach((c) => {
      if (c.parentId) {
        const parent = map.get(c.parentId)
        if (parent) parent.replies.push(c)
      } else {
        roots.push(c)
      }
    })
    // 부모 댓글만 createdAt 기준으로 정렬
    roots.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    // 대댓글도 createdAt 기준으로 정렬
    function sortReplies(arr: (Comment & { replies: Comment[] })[]) {
      arr.forEach((c) => {
        if (c.replies.length > 0) {
          c.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          sortReplies(c.replies)
        }
      })
    }
    sortReplies(roots)
    return roots
  }

  // LikeDislikeButtons에서 score 상태를 받아서 관리
  const handleScoreChange = (newLikes: number, newDislikes: number) => {
    setScoreLikes(newLikes)
    setScoreDislikes(newDislikes)
  }

  if (!mounted) {
    return null
  }

  const nestedComments: (Comment & { replies: Comment[] })[] = nestComments(comments)

  return (
    <div className="mt-8">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-center font-semibold">
          {error}
        </div>
      )}
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Comments
        {commentsCount && commentsCount > 0 && (
          <span className="ml-2 text-blue-600 font-bold">[{commentsCount}]</span>
        )}
      </h2>
      
      {/* 댓글 입력 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white resize-none min-h-[80px]"
            rows={3}
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isLoading ? '작성 중...' : '댓글 작성'}
          </button>
        </div>
      </form>

      {/* 댓글 리스트 */}
      <div className="space-y-4">
        {nestedComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={{ ...comment, replies: comment.replies ?? [] }}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            handleReply={handleReply}
            session={session}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            startEditing={startEditing}
            editingCommentId={editingCommentId}
            editContent={editContent}
            setEditContent={setEditContent}
            setEditingCommentId={setEditingCommentId}
            isLoading={isLoading}
            depth={0}
          />
        ))}
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  handleReply,
  session,
  handleEdit,
  handleDelete,
  startEditing,
  editingCommentId,
  editContent,
  setEditContent,
  setEditingCommentId,
  isLoading,
  depth = 0,
}: {
  comment: Comment & { replies: Comment[] }
  replyingTo: number | null
  setReplyingTo: (id: number | null) => void
  replyContent: string
  setReplyContent: (v: string) => void
  handleReply: (parentId: number) => void
  session: any
  handleEdit: (id: number) => void
  handleDelete: (id: number) => void
  startEditing: (c: Comment) => void
  editingCommentId: number | null
  editContent: string
  setEditContent: (v: string) => void
  setEditingCommentId: (id: number | null) => void
  isLoading: boolean
  depth?: number
}) {
  function formatDateUTC(date: string) {
    const d = new Date(date)
    return d.getUTCFullYear().toString().slice(2) + '. ' +
      String(d.getUTCMonth() + 1).padStart(2, '0') + '. ' +
      String(d.getUTCDate()).padStart(2, '0') + '. ' +
      String(d.getUTCHours()).padStart(2, '0') + ':' +
      String(d.getUTCMinutes()).padStart(2, '0') + ':' +
      String(d.getUTCSeconds()).padStart(2, '0')
  }

  return (
    <div className={`rounded-xl p-5 shadow-sm mb-3 ${depth > 0 ? 'ml-10 border-l-4 border-blue-400 bg-blue-50' : 'bg-white border border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-800 text-base">{comment.author}</span>
          <span className="text-xs text-gray-400">
            {new Date(comment.createdAt).toISOString().replace('T', ' ').substring(0, 19)} UTC
            {comment.updatedAt && ' (edited)'}
          </span>
        </div>
        <div className="flex gap-2">
          {session?.user?.email === comment.userEmail && (
            <>
              <button
                aria-label="Edit"
                onClick={() => startEditing(comment)}
                className="text-gray-400 hover:text-blue-600 p-1 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                aria-label="Delete"
                onClick={() => handleDelete(comment.id)}
                className="text-gray-400 hover:text-red-500 p-1 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => setReplyingTo(comment.id)}
            className="text-gray-400 hover:text-blue-500 text-xs font-bold px-2 py-1 rounded transition border border-transparent hover:border-blue-300"
            type="button"
          >
            Reply
          </button>
        </div>
      </div>
      {editingCommentId === comment.id ? (
        <div className="mb-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-base shadow"
            rows={2}
          />
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleEdit(comment.id)}
              disabled={isLoading}
              className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold shadow"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setEditingCommentId(null); setEditContent('') }}
              disabled={isLoading}
              className="px-4 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 font-bold shadow"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className={comment.deleted ? "text-gray-300 italic text-base" : "text-gray-800 mb-2 text-base whitespace-pre-line"}>
          {comment.deleted ? "This comment has been deleted." : comment.content}
        </p>
      )}
      {/* 대댓글 입력창 */}
      {replyingTo === comment.id && (
        <div className="mb-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 text-base shadow"
            rows={2}
          />
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleReply(comment.id)}
              disabled={isLoading}
              className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold shadow"
            >
              답글 작성
            </button>
            <button
              type="button"
              onClick={() => { setReplyingTo(null); setReplyContent('') }}
              disabled={isLoading}
              className="px-4 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 font-bold shadow"
            >
              취소
            </button>
          </div>
        </div>
      )}
      {/* 대댓글 렌더링 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleReply={handleReply}
              session={session}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              startEditing={startEditing}
              editingCommentId={editingCommentId}
              editContent={editContent}
              setEditContent={setEditContent}
              setEditingCommentId={setEditingCommentId}
              isLoading={isLoading}
              depth={(depth || 0) + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
} 
"use client"

import React from 'react'
import { useState, useEffect, ChangeEvent } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import AuthButtons from '@/components/AuthButtons'
import BannerManager from '@/components/BannerManager'
import UserManager from '@/components/UserManager'
import OnlineCasinosAdminUI from '@/components/OnlineCasinosAdminUI'

interface Category {
  id: number
  name: string
  description: string | null
  boards: Board[]
}

interface Board {
  id: number
  name: string
  description: string | null
  categoryId: number
  slug: string
}

interface Casino {
  id: number
  name: string
  imageUrl: string
  safetyLevel: string
  link: string
  type: string
  order: number
}

interface CasinoForm {
  name: string
  imageUrl: string | null
  safetyLevel: string
  link: string
  type: string
  order?: number
}

interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
  createdAt: string
}

interface Post {
  id: number,
  title: string,
  content: string,
  postKey: string,
  isNotice: boolean,
  isPinned: boolean,
  createdAt: string,
  boardId: number,
  likes?: number,
  dislikes?: number,
  user?: {
    name: string | null,
  },
  board?: {
    id: number,
    name: string,
  },
  imageUrl?: string,
  score?: number,
}

type AdminMenu = 'onlinecasinos' | 'notice' | 'users' | 'category' | 'board' | 'banner' | 'casino' | 'pinned'

interface CategoryInlineEditFormProps {
  category: Category
  onCancel: () => void
  onSave: (name: string, description: string) => void
}

interface NoticeFormProps {
  categories: Category[]
}

interface PostAdminManagerProps {
  categories: Category[]
}

interface UserManagerProps {}

// Board 인라인 수정 폼 컴포넌트
function BoardInlineEditForm({ board, onCancel, onSave }: { board: Board, onCancel: () => void, onSave: (name: string, description: string) => void }) {
  const [name, setName] = useState(board.name)
  const [description, setDescription] = useState(board.description || '')

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave(name, description) }}
      className="flex-1 flex gap-2 min-w-0 w-full"
    >
      <input value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded text-gray-900 flex-1" required />
      <input value={description} onChange={e => setDescription(e.target.value)} className="border p-2 rounded text-gray-900 flex-1" />
      <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-medium">Save</button>
      <button type="button" onClick={onCancel} className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 font-medium">Cancel</button>
    </form>
  )
}

function CategoryInlineEditForm({ category, onCancel, onSave }: CategoryInlineEditFormProps) {
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description || '')

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        await onSave(name, description)
      }}
      className="flex-1 flex gap-2 min-w-0 w-full"
      role="form"
      aria-label="카테고리 수정 폼"
    >
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        className="border p-2 rounded text-gray-900 flex-1"
        required
        aria-required="true"
        aria-label="카테고리명"
      />
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="border p-2 rounded text-gray-900 flex-1"
        aria-label="카테고리 설명"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-medium"
      >
        저장
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 font-medium"
      >
        취소
      </button>
    </form>
  )
}

function NoticeForm({ categories, initialData, onCancel, onSave }: NoticeFormProps & { initialData?: any, onCancel?: () => void, onSave?: (data: any) => void }) {
  const [boardId, setBoardId] = useState(initialData?.board?.id?.toString() || '')
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [imagePreview, setImagePreview] = useState(initialData?.imageUrl || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImagePreview(URL.createObjectURL(file))
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      setImageUrl(data.url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || !boardId) {
      setError('모든 필드를 입력해주세요')
      return
    }
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      let res
      if (initialData) {
        const board = categories.flatMap(cat => cat.boards).find(b => b.id === parseInt(boardId))
        if (!board) throw new Error('게시판을 찾을 수 없습니다')
        const category = categories.find(cat => cat.boards.some(b => b.id === parseInt(boardId)))
        if (!category) throw new Error('카테고리를 찾을 수 없습니다')
        res = await fetch(`/api/board/${category.name.toLowerCase().replace(/\s+/g, '-')}/${board.slug}/${initialData.postKey}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            boardId,
            isNotice: true,
            imageUrl,
          }),
        })
      } else {
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            boardId,
            isNotice: true,
            imageUrl,
          }),
        })
      }
      if (!res.ok) throw new Error('공지사항 등록/수정 실패')
      setSuccess(true)
      if (onSave) onSave({ title, content, boardId, imageUrl })
      if (!initialData) {
        setTitle('')
        setContent('')
        setBoardId('')
        setImageUrl('')
        setImagePreview('')
      }
    } catch (err) {
      setError('공지사항 등록/수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl" role="form" aria-label="공지사항 작성/수정 폼">
      <div>
        <label htmlFor="board" className="block mb-1 font-bold text-gray-900">
          게시판 선택
        </label>
        <select
          id="board"
          value={boardId}
          onChange={e => setBoardId(e.target.value)}
          className="border p-2 rounded w-full font-bold text-gray-900 placeholder-gray-700"
          required
          aria-required="true"
        >
          <option value="">게시판을 선택하세요</option>
          {categories.flatMap(cat =>
            cat.boards.map(board => (
              <option key={board.id} value={board.id}>
                [{cat.name}] {board.name}
              </option>
            ))
          )}
        </select>
      </div>
      <div>
        <label htmlFor="title" className="block mb-1 font-bold text-gray-900">
          제목
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border p-2 rounded w-full font-bold text-gray-900 placeholder-gray-700"
          required
          aria-required="true"
        />
      </div>
      <div>
        <label htmlFor="content" className="block mb-1 font-bold text-gray-900">
          내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={e => setContent(e.target.value)}
          className="border p-2 rounded w-full min-h-[120px] font-bold text-gray-900 placeholder-gray-700"
          required
          aria-required="true"
        />
      </div>
      <div>
        <label className="block mb-1 font-bold text-gray-900">이미지 첨부</label>
        <div className="flex items-center gap-4">
          <input type="file" accept="image/*" onChange={handleImageChange} className="border p-2 rounded font-bold text-gray-900" />
          {(imagePreview || imageUrl) && (
            <img src={imagePreview || imageUrl} alt="첨부 이미지" className="w-20 h-14 object-cover rounded border" />
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
          disabled={loading}
          aria-disabled={loading}
        >
          {loading ? '저장 중...' : (initialData ? '수정 저장' : '공지사항 등록')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">취소</button>
        )}
      </div>
      {success && (
        <div className="text-green-600 font-bold mt-2" role="alert">
          {initialData ? '수정되었습니다.' : '공지사항이 등록되었습니다.'}
        </div>
      )}
      {error && (
        <div className="text-red-600 font-bold mt-2" role="alert">
          {error}
        </div>
      )}
    </form>
  )
}

function PostAdminManager({ categories }: PostAdminManagerProps) {
  const [boardId, setBoardId] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'score'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<'all' | 'notice' | 'pinned'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const postsPerPage = 10

  useEffect(() => {
    if (boardId) fetchPosts()
  }, [boardId, page, sortBy, sortOrder, filter])

  const fetchPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const queryParams = new URLSearchParams({
        admin: '1',
        page: page.toString(),
        sortBy,
        sortOrder,
        filter,
        search: searchQuery,
      })
      const res = await fetch(`/api/posts?boardId=${boardId}&${queryParams}`)
      if (!res.ok) throw new Error('게시글 불러오기 실패')
      const data = await res.json()
      setPosts(data.posts || [])
      setTotalPages(Math.ceil(data.total / postsPerPage))
    } catch (err) {
      setError('게시글을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getBoardSlug = (id: string) => {
    for (const cat of categories) {
      for (const board of cat.boards) {
        if (String(board.id) === String(id)) return board.slug
      }
    }
    return ''
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPosts()
  }

  const handleSort = (field: 'createdAt' | 'title') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handlePin = async (post: any, isPinned: boolean) => {
    setLoading(true)
    setError('')
    setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? { ...p, isPinned } : p))
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('핀 상태 변경 실패')
      setSelectedPost(null)
    } catch (err) {
      setError('핀 상태 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (post: any) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('삭제 실패')
      // posts 상태에서 해당 글을 즉시 제거
      setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id))
      setSelectedPost(null)
    } catch (err) {
      setError('삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <label className="block mb-1 font-bold text-gray-900">게시판 선택</label>
        <select
          value={boardId}
          onChange={e => { setBoardId(e.target.value); setSelectedPost(null); setPage(1); }}
          className="border-2 border-blue-600 p-2 rounded w-full font-bold text-gray-900 placeholder-gray-700 text-lg"
          style={{ minWidth: '400px', width: '100%' }}
        >
          <option value="">게시판을 선택하세요</option>
          {categories.flatMap(cat =>
            cat.boards.map(board => {
              // 고정글 개수 계산: posts 전체에서 boardId와 isPinned로 필터링
              const pinnedCount = posts.filter((p: Post) => p.boardId === board.id && p.isPinned).length
              return (
                <option key={board.id} value={board.id}>
                  [{cat.name}] {board.name} [{pinnedCount}]
                </option>
              )
            })
          )}
        </select>
      </div>

      {boardId && (
        <>
          <div className="mb-4 flex gap-4 items-center">
            <form onSubmit={handleSearch} className="flex-1">
        <input
          type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="제목으로 검색..."
                className="border p-2 rounded w-full font-bold text-gray-900 placeholder-gray-700"
              />
            </form>
            <select
              value={filter}
              onChange={e => { setFilter(e.target.value as any); setPage(1); }}
              className="border p-2 rounded font-bold text-gray-900 placeholder-gray-700"
            >
              <option value="all">전체</option>
              <option value="notice">공지사항</option>
              <option value="pinned">고정글</option>
            </select>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => {
                setSortBy('createdAt');
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              }}
              className={`px-3 py-1 rounded font-bold ${sortBy === 'createdAt' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}
            >
              {sortBy === 'createdAt' && sortOrder === 'desc' ? '최신순' : '오래된순'}
            </button>
            <button
              onClick={() => {
                setSortBy('score');
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              }}
              className={`px-3 py-1 rounded font-bold ${sortBy === 'score' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}
            >
              {sortBy === 'score' && sortOrder === 'desc' ? '높은 추천순' : '낮은 추천순'}
            </button>
          </div>
        </>
      )}

      {loading && <div className="text-blue-600">로딩 중...</div>}
      {error && <div className="text-red-600">{error}</div>}
      
      {!selectedPost ? (
        <div className="space-y-2">
          {posts.length === 0 && boardId && <div className="text-gray-400">게시글이 없습니다.</div>}
          {posts
            .filter((post: Post) => !post.isNotice && String(post.boardId) === String(boardId))
            .sort((a: Post, b: Post) => {
              if (a.isPinned === b.isPinned) {
                // 기존 정렬(날짜, 점수 등) 유지
                if (sortBy === 'createdAt') {
                  return sortOrder === 'desc'
                    ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                } else if (sortBy === 'score') {
                  const scoreA = (a.likes || 0) - (a.dislikes || 0)
                  const scoreB = (b.likes || 0) - (b.dislikes || 0)
                  return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB
                }
                return 0
              }
              return a.isPinned ? -1 : 1 // 핀된 글이 먼저
            })
            .map((post: Post) => (
              <div key={post.id} className="p-3 border rounded bg-white flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">
                    {post.isNotice && <span className="text-red-600 mr-2">[공지]</span>}
                    {post.isPinned && <span className="text-blue-600 mr-2">[고정]</span>}
                    {post.title}
                  </div>
                  <div className="text-gray-900 font-bold">작성자: {post.user?.name || 'Anonymous'}</div>
                  <div className="text-gray-900 font-bold">등록일: {new Date(post.createdAt).toLocaleDateString()}</div>
                  <div className="text-gray-900 font-bold">
                    Score: {Number(post.likes) - Number(post.dislikes)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedPost(post)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">상세</button>
                  <button 
                    onClick={() => handlePin(post, !post.isPinned)} 
                    className={`px-3 py-1 rounded ${post.isPinned ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-yellow-500`}
                  >
                    {post.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                </div>
              </div>
            ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                이전
              </button>
              <span className="px-3 py-1">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 border rounded bg-white">
          <h3 className="text-lg font-bold mb-2">
            {selectedPost.isNotice && <span className="text-red-600 mr-2">[공지]</span>}
            {selectedPost.isPinned && <span className="text-blue-600 mr-2">[고정]</span>}
            {selectedPost.title}
          </h3>
          <div className="mb-2 text-gray-900 whitespace-pre-line">{selectedPost.content}</div>
          <div className="mb-2 text-gray-900 font-bold">작성자: {selectedPost.user?.name || 'Anonymous'}</div>
          <div className="text-gray-900 font-bold">등록일: {new Date(selectedPost.createdAt).toLocaleDateString()}</div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => handlePin(selectedPost, !selectedPost.isPinned)} className={`px-3 py-1 rounded ${selectedPost.isPinned ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-900'} hover:bg-yellow-600`}>{selectedPost.isPinned ? 'Unpin' : 'Pin'}</button>
            <button onClick={() => handleDelete(selectedPost)} className="px-3 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-700">삭제</button>
            <button onClick={() => setSelectedPost(null)} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500">목록</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [categories, setCategories] = useState<Category[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [newBoard, setNewBoard] = useState({ name: '', description: '', categoryId: '' })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [activeMenu, setActiveMenu] = useState<AdminMenu>('notice')
  const [inlineEditingCategoryId, setInlineEditingCategoryId] = useState<number | null>(null)
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [casinoForm, setCasinoForm] = useState<CasinoForm>({ name: '', imageUrl: null, safetyLevel: '', link: '', type: 'best' })
  const [casinoFile, setCasinoFile] = useState<File | null>(null)
  const [editingCasinoId, setEditingCasinoId] = useState<number | null>(null)
  const [imageUploadPending, setImageUploadPending] = useState(false)
  const [casinoPreview, setCasinoPreview] = useState<string | null>(null)
  const [casinoSlideSpeed, setCasinoSlideSpeed] = useState(4000)
  const [casinoSpeedSaved, setCasinoSpeedSaved] = useState(false)
  const [casinoTab, setCasinoTab] = useState<'all' | 'best' | 'new'>('all')
  const [inlineEditId, setInlineEditId] = useState<number | null>(null)
  const [inlineForm, setInlineForm] = useState<{ name: string; description: string; safetyLevel: string; link: string; type: string; imageUrl?: string | null; order?: number }>({ name: '', description: '', safetyLevel: '', link: '', type: 'best', imageUrl: '', order: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menu, setMenu] = useState<'notice' | 'users'>('notice')
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null)
  const [notices, setNotices] = useState<Post[]>([])
  const [selectedNotices, setSelectedNotices] = useState<Post[]>([])
  const [showNoticeForm, setShowNoticeForm] = useState(false)
  const [boardId, setBoardId] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'score'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filter, setFilter] = useState<'all' | 'notice' | 'pinned'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const postsPerPage = 10

  // 정렬 함수
  const getSortedPosts = (): Post[] => {
    let sorted = [...posts]
    // 검색어 필터 적용
    if (searchQuery.trim()) {
      sorted = sorted.filter(post => post.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    }
    if (sortBy === 'createdAt') {
      sorted.sort((a, b) => (sortOrder === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
    } else if (sortBy === 'score') {
      sorted.sort((a, b) => (sortOrder === 'desc'
        ? ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0))
        : ((a.likes || 0) - (a.dislikes || 0)) - ((b.likes || 0) - (b.dislikes || 0))))
    }
    return sorted
  }

  // 공지사항 관리 탭 진입 시 전체 posts fetch
  useEffect(() => {
    if (activeMenu === 'notice') {
      fetchAllPosts()
    }
  }, [activeMenu])

  const fetchAllPosts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/posts?admin=1&all=1')
      const data = await res.json()
      setPosts(data.posts || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (activeMenu === 'casino') {
      fetchCasinos()
    }
  }, [activeMenu])

  useEffect(() => {
    if (session?.user?.email && !['a2381016@gmail.com'].includes(session.user.email)) {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    fetch('/api/casinos/speed')
      .then(res => res.ok ? res.json() : { intervalMs: 4000 })
      .then(data => setCasinoSlideSpeed(data.intervalMs || 4000))
      .catch(() => setCasinoSlideSpeed(4000))
  }, [])

  useEffect(() => {
    fetch('/api/posts?isNotice=1&includeBoard=1', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : { posts: [] })
      .then(data => setNotices((data.posts || []).filter((p: any) => p.isNotice)))
  }, [])

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCategories(data)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCategory) {
      await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      })
      setEditingCategory(null)
    } else {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      })
    }
    setNewCategory({ name: '', description: '' })
    await fetchCategories()
    window.dispatchEvent(new Event('refreshBoardMenu'));
    window.dispatchEvent(new Event('refreshCategoryMenu'));
  }

  const handleBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingBoard) {
      await fetch(`/api/boards/${editingBoard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBoard,
          categoryId: parseInt(newBoard.categoryId),
        }),
      })
      setEditingBoard(null)
    } else {
      await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBoard,
          categoryId: parseInt(newBoard.categoryId),
        }),
      })
    }
    setNewBoard({ name: '', description: '', categoryId: '' })
    await fetchCategories()
    window.dispatchEvent(new Event('refreshBoardMenu'));
    window.dispatchEvent(new Event('refreshCategoryMenu'));
  }

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({ name: category.name, description: category.description || '' })
  }

  const handleBoardEdit = (board: Board) => {
    setEditingBoard(board)
    setNewBoard({
      name: board.name,
      description: board.description || '',
      categoryId: board.categoryId.toString(),
    })
  }

  const handleBoardInlineEdit = async (board: Board, newName: string, newDescription: string) => {
    try {
      const response = await fetch(`/api/boards/${board.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          categoryId: board.categoryId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update board')
      }

      const updatedBoard = await response.json()
      await fetchCategories()
      window.dispatchEvent(new Event('refreshBoardMenu'));
      window.dispatchEvent(new Event('refreshCategoryMenu'));
      setInlineEditId(null)
      setInlineForm({ name: '', description: '', safetyLevel: '', link: '', type: 'best', imageUrl: '', order: 0 })

      // 현재 페이지가 해당 게시판이면, 변경된 slug로 이동
      const pathname = window.location.pathname
      const boardPathRegex = /\/board\/([^/]+)\/([^/]+)/
      const match = pathname.match(boardPathRegex)
      if (match && match[2] === board.slug) {
        // PATCH 응답의 categoryId 사용
        const updatedCategory = categories.find(cat => cat.id === updatedBoard.categoryId)
        const newCategorySlug = updatedCategory ? updatedCategory.name.toLowerCase().replace(/\s+/g, '-') : ''
        if (newCategorySlug && updatedBoard.slug) {
          window.location.href = `/board/${newCategorySlug}/${updatedBoard.slug}`
        }
      }
    } catch (error) {
      console.error('Failed to update board:', error)
      alert('게시판 수정에 실패했습니다.')
    }
  }

  const handleCategoryDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        if (data.error?.includes('Cannot delete category with boards')) {
          alert('Cannot delete category with boards. Please delete all boards in this category first.')
        } else {
          alert('Failed to delete category.')
        }
      } else {
        await fetchCategories()
        window.dispatchEvent(new Event('refreshBoardMenu'));
        window.dispatchEvent(new Event('refreshCategoryMenu'));
      }
    }
  }

  const handleBoardDelete = async (id: number, slug: string) => {
    if (confirm('Are you sure you want to delete this board?')) {
      const res = await fetch(`/api/boards?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        if (data.error?.includes('Cannot delete board with posts')) {
          alert('Cannot delete board with posts. Please delete all posts in this board first.')
        } else {
          alert('Failed to delete board.')
        }
      } else {
        await fetchCategories()
        window.dispatchEvent(new Event('refreshBoardMenu'));
        window.dispatchEvent(new Event('refreshCategoryMenu'));
      }
    }
  }

  const fetchCasinos = async () => {
    const res = await fetch('/api/casinos');
    const data = await res.json();
    setCasinos(data);
  };

  const handleCasinoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCasinoFile(e.target.files[0]);
      setCasinoPreview(URL.createObjectURL(e.target.files[0]));
      handleCasinoImageUpload(e.target.files[0]);
    }
  };

  const handleCasinoImageUpload = async (file: File) => {
    if (!file) return;
    setImageUploadPending(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const { url } = await res.json();
    setCasinoForm(f => ({ ...f, imageUrl: url }));
    setImageUploadPending(false);
  };

  const handleCasinoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const imageUrl = casinoForm.imageUrl;
    if (!imageUrl || (typeof imageUrl === 'string' && imageUrl.trim() === '')) {
      alert('이미지를 업로드하세요.');
      setLoading(false);
      return;
    }
    if (!casinoForm.name || !casinoForm.safetyLevel || !casinoForm.link || !casinoForm.type || !casinoForm.order) {
      alert('모든 필드를 입력하세요.');
      setLoading(false);
      return;
    }
    try {
      if (editingCasinoId) {
        await fetch(`/api/casinos/${editingCasinoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...casinoForm, imageUrl, order: Number(casinoForm.order) }),
        });
        setEditingCasinoId(null);
      } else {
        await fetch('/api/casinos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...casinoForm, imageUrl, order: Number(casinoForm.order) }),
        });
      }
      setCasinoForm({ name: '', imageUrl: null, safetyLevel: '', link: '', type: 'best', order: undefined });
      setCasinoFile(null);
      setCasinoPreview(null);
      fetchCasinos();
    } catch (err) {
      alert('등록 중 오류가 발생했습니다.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleCasinoEdit = (casino: Casino) => {
    setEditingCasinoId(casino.id);
    setCasinoForm({
      name: casino.name,
      imageUrl: casino.imageUrl,
      safetyLevel: casino.safetyLevel,
      link: casino.link,
      type: casino.type,
      order: casino.order,
    });
  };

  const handleCasinoDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await fetch(`/api/casinos/${id}`, { method: 'DELETE' });
    fetchCasinos();
  };

  const filteredCasinos = casinoTab === 'all' ? casinos : casinos.filter(casino => casino.type === casinoTab);

  const handleInlineFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCasinoPreview(URL.createObjectURL(e.target.files[0]));
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await res.json();
      setInlineForm(f => ({ ...f, imageUrl: url }));
    }
  };

  const handleInlineSaveCasino = async (id: number) => {
    setLoading(true);
    const target = casinos.find(c => c.id === id);
    const imageUrl = inlineForm.imageUrl || target?.imageUrl || '';
    await fetch(`/api/casinos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...inlineForm, 
        imageUrl,
        order: Number(inlineForm.order)  // order 값 명시적으로 숫자로 변환
      }),
    });
    setInlineEditId(null);
    setCasinoPreview(null);
    fetchCasinos();
    setLoading(false);
  };

  const handleEditClick = (casino: Casino) => {
    setInlineEditId(casino.id);
    setInlineForm({
      name: casino.name,
      description: '',
      safetyLevel: casino.safetyLevel,
      link: casino.link,
      type: casino.type,
      imageUrl: casino.imageUrl,
      order: casino.order || 0
    });
  };

  const handleCategoryInlineSave = async (cat: Category, name: string, description: string) => {
    await fetch(`/api/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    setInlineEditingCategoryId(null)
    await fetchCategories()
    window.dispatchEvent(new Event('refreshBoardMenu'));
    window.dispatchEvent(new Event('refreshCategoryMenu'));
  }

  // pinned posts 탭 진입 시 전체 posts fetch
  useEffect(() => {
    if (activeMenu === 'pinned') {
      fetchAllPosts()
    }
  }, [activeMenu])

  const moveCasino = async (idx: number, dir: number) => {
    if (filteredCasinos.length < 2) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= filteredCasinos.length) return;
    const current = filteredCasinos[idx];
    const target = filteredCasinos[targetIdx];
    setLoading(true);
    // order swap
    await Promise.all([
      fetch(`/api/casinos/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: target.order }),
      }),
      fetch(`/api/casinos/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: current.order }),
      })
    ]);
    fetchCasinos();
    setLoading(false);
  }

  const handleSaveCasinoSpeed = async () => {
    setLoading(true);
    await fetch('/api/casinos/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intervalMs: casinoSlideSpeed }),
    });
    setCasinoSpeedSaved(true);
    setTimeout(() => setCasinoSpeedSaved(false), 2000);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleDelete = async (post: any) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('삭제 실패')
      // posts 상태에서 해당 글을 즉시 제거
      setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id))
      setSelectedPost(null)
    } catch (err) {
      setError('삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePin = async (post: any, isPinned: boolean) => {
    setLoading(true)
    setError('')
    setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? { ...p, isPinned } : p))
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('핀 상태 변경 실패')
      setSelectedPost(null)
    } catch (err) {
      setError('핀 상태 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 모든 탭 상태 초기화 함수
  const resetAdminStates = () => {
    setPage(1);
    setSearchQuery('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setSelectedPost(null);
    setShowNoticeForm(false);
    setBoardId('');
    setFilter('all');
    setEditingNoticeId(null);
    setSelectedNotices([]);
    setNewCategory({ name: '', description: '' });
    setNewBoard({ name: '', description: '', categoryId: '' });
    setEditingCategory(null);
    setEditingBoard(null);
    setInlineEditingCategoryId(null);
    setInlineEditId(null);
    setInlineForm({ name: '', description: '', safetyLevel: '', link: '', type: 'best', imageUrl: '', order: 0 });
    // 필요시 추가 상태도 모두 초기화
  };

  if (status === 'loading') return <div className="p-8">Loading...</div>

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">관리자 로그인</h1>
        <button
          onClick={() => signIn('google', { callbackUrl: '/admin' })}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          구글 계정으로 관리자 로그인
        </button>
      </div>
    )
  }

  const renderContent = () => {
    if (status === 'authenticated' && !session?.user?.email) {
      return <div>Loading...</div>
    }
    if (!session?.user?.email || !['a2381016@gmail.com'].includes(session.user.email)) {
      return <div className="p-4 text-red-600 font-bold">Access denied. Admin only.</div>
    }
    switch (activeMenu) {
      case 'category':
        return (
          <div className="p-8 bg-white rounded shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Management</h2>
            <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-4">
              <input type="text" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Category Name" className="border p-2 rounded flex-1 font-bold text-gray-900 placeholder-gray-900" required />
              <input type="text" value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} placeholder="Description" className="border p-2 rounded flex-1 font-bold text-gray-900 placeholder-gray-900" />
              <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded font-bold hover:bg-blue-800">{editingCategory ? 'Edit' : 'Add'}</button>
            </form>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="p-3 border rounded bg-white flex items-center justify-between">
                  {inlineEditingCategoryId === cat.id ? (
                    <CategoryInlineEditForm
                      category={cat}
                      onCancel={() => setInlineEditingCategoryId(null)}
                      onSave={(name, description) => handleCategoryInlineSave(cat, name, description)}
                    />
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate text-lg">{cat.name}</div>
                        <div className="text-xs text-gray-900 font-bold">{cat.description}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setInlineEditingCategoryId(cat.id)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Edit</button>
                        <button onClick={() => handleCategoryDelete(cat.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-bold">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      case 'board':
        return (
          <div className="p-8 bg-white rounded shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Board Management</h2>
            <form onSubmit={handleBoardSubmit} className="flex gap-2 mb-4">
              <select value={newBoard.categoryId} onChange={e => setNewBoard({ ...newBoard, categoryId: e.target.value })} className="border p-2 rounded font-bold text-gray-900 placeholder-gray-900" required>
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input type="text" value={newBoard.name} onChange={e => setNewBoard({ ...newBoard, name: e.target.value })} placeholder="Board Name" className="border p-2 rounded flex-1 font-bold text-gray-900 placeholder-gray-900" required />
              <input type="text" value={newBoard.description} onChange={e => setNewBoard({ ...newBoard, description: e.target.value })} placeholder="Description" className="border p-2 rounded flex-1 font-bold text-gray-900 placeholder-gray-900" />
              <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded font-bold hover:bg-blue-800">{editingBoard ? 'Edit' : 'Add'}</button>
            </form>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="mb-2">
                  <div className="font-bold text-gray-900 mb-1 text-lg">{cat.name}</div>
                  <div className="space-y-1">
                    {cat.boards.map(board => (
                      <div key={board.id} className="p-2 border rounded bg-white flex items-center justify-between">
                        {inlineEditId === board.id ? (
                          <BoardInlineEditForm
                            board={board}
                            onCancel={() => setInlineEditId(null)}
                            onSave={async (name, description) => {
                              await handleBoardInlineEdit(board, name, description)
                              setInlineEditId(null)
                            }}
                          />
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 truncate">{board.name}</div>
                              <div className="text-xs text-gray-900 font-bold">{board.description}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setInlineEditId(board.id)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Edit</button>
                              <button onClick={() => handleBoardDelete(board.id, board.slug)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-bold">Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      case 'banner':
        return (
          <div className="p-8 bg-white rounded shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Main Banner Management</h2>
            <BannerManager />
          </div>
        )
      case 'casino':
        return (
          <div className="p-8 bg-white rounded shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Casino Banner Management</h2>
            <div className="mb-4 text-sm text-gray-900 font-semibold">
              <div>• Casino Banners are displayed in order of <span className="text-blue-700 font-bold">Order</span> (ascending).</div>
              <div>• You can set the <span className="text-blue-700 font-bold">slide speed</span> (ms) for the casino banner below. (Default: 4000ms)</div>
              <div className="mt-1 text-xs text-gray-900">Recommended image size: <span className="font-bold">270x80px</span> (JPG/PNG, max 2MB)</div>
            </div>
            {/* Casino Type Filter Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded font-bold border ${casinoTab === 'all' ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                onClick={() => setCasinoTab('all')}
              >
                All
              </button>
              <button
                className={`px-4 py-2 rounded font-bold border ${casinoTab === 'best' ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                onClick={() => setCasinoTab('best')}
              >
                Best
              </button>
              <button
                className={`px-4 py-2 rounded font-bold border ${casinoTab === 'new' ? 'bg-blue-600 text-white border-blue-700' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                onClick={() => setCasinoTab('new')}
              >
                New
              </button>
            </div>
            <div className="mb-6 flex items-center gap-4">
              <label className="font-bold text-gray-900">Slide Speed (ms):
                <input type="number" min={1000} step={100} value={casinoSlideSpeed} onChange={e => setCasinoSlideSpeed(Number(e.target.value))} className="ml-2 border rounded p-1 w-28 text-gray-900 placeholder-gray-500" placeholder="4000" />
              </label>
              <button type="button" onClick={handleSaveCasinoSpeed} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium" disabled={loading}>Apply</button>
              {casinoSpeedSaved && <span className="text-green-700 font-bold ml-2">Saved!</span>}
            </div>
            <form onSubmit={handleCasinoSubmit} className="mb-6 p-4 bg-gray-50 rounded shadow flex flex-col gap-3">
              <div className="flex gap-4">
                <label className="font-bold text-gray-900">Type
                  <select name="type" value={casinoForm.type} onChange={e => setCasinoForm(f => ({ ...f, type: e.target.value }))} className="ml-2 border rounded p-1 text-gray-900">
                    <option value="best">Best</option>
                    <option value="new">New</option>
                  </select>
                </label>
                <label className="font-bold text-gray-900">Order
                  <input name="order" type="number" value={casinoForm.order || ''} onChange={e => setCasinoForm(f => ({ ...f, order: Number(e.target.value) }))} className="ml-2 border rounded p-1 w-20 text-gray-900 placeholder-gray-500" min={1} placeholder="1" />
                </label>
              </div>
              <label className="font-bold text-gray-900">Name
                <input name="name" value={casinoForm.name} onChange={e => setCasinoForm(f => ({ ...f, name: e.target.value }))} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="Casino name" />
              </label>
              <label className="font-bold text-gray-900">Safety Level
                <input name="safetyLevel" value={casinoForm.safetyLevel} onChange={e => setCasinoForm(f => ({ ...f, safetyLevel: e.target.value }))} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="Safety level" />
              </label>
              <label className="font-bold text-gray-900">Link
                <input name="link" value={casinoForm.link} onChange={e => setCasinoForm(f => ({ ...f, link: e.target.value }))} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="https://..." />
              </label>
              <div className="flex gap-2 items-center">
                <input type="file" accept="image/*" onChange={handleCasinoFileChange} className="border rounded p-1" />
                <span className="text-xs text-gray-900">(JPG/PNG, max 2MB)</span>
                {casinoPreview && <img src={casinoPreview} alt="preview" className="w-16 h-10 object-cover rounded" />}
              </div>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium" disabled={loading || imageUploadPending}>{editingCasinoId ? "Update Casino" : "Add Casino"}</button>
                {editingCasinoId && (
                  <button type="button" onClick={() => { setCasinoForm({ name: '', imageUrl: null, safetyLevel: '', link: '', type: 'best', order: undefined }); setEditingCasinoId(null); }} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 font-medium">Cancel</button>
                )}
              </div>
            </form>
            <div className="space-y-4">
              {loading && <div className="text-gray-900">Loading...</div>}
              {filteredCasinos.length === 0 && !loading && <div className="text-gray-900">No casinos found.</div>}
              {filteredCasinos
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((casino, idx) => (
                  <div key={casino.id} className="flex items-center gap-4 p-4 border rounded bg-white shadow-sm">
                    {inlineEditId === casino.id ? (
                      <form className="flex-1 flex flex-col gap-2" onSubmit={e => { e.preventDefault(); handleInlineSaveCasino(casino.id) }}>
                        <div className="flex gap-4">
                          <label className="font-bold text-gray-900">Type
                            <select name="type" value={inlineForm.type} onChange={e => setInlineForm(f => ({ ...f, type: e.target.value }))} className="ml-2 border rounded p-1 text-gray-900">
                              <option value="best">Best</option>
                              <option value="new">New</option>
                            </select>
                          </label>
                          <label className="font-bold text-gray-900">Order
                            <input name="order" type="number" value={inlineForm.order || 0} onChange={e => setInlineForm(f => ({ ...f, order: Number(e.target.value) }))} className="ml-2 border rounded p-1 w-20 text-gray-900 placeholder-gray-500" min={0} placeholder="0" />
                          </label>
                        </div>
                        <label className="font-bold text-gray-900">Name
                          <input name="name" value={inlineForm.name} onChange={e => setInlineForm(f => ({ ...f, name: e.target.value }))} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="Casino name" />
                        </label>
                        <label className="font-bold text-gray-900">Safety Level
                          <input name="safetyLevel" value={inlineForm.safetyLevel} onChange={e => setInlineForm(f => ({ ...f, safetyLevel: e.target.value }))} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="Safety level" />
                        </label>
                        <label className="font-bold text-gray-900">Link
                          <input name="link" value={inlineForm.link} onChange={e => setInlineForm(f => ({ ...f, link: e.target.value }))} className="border rounded p-1 w-full mt-1 text-gray-900 placeholder-gray-500" placeholder="https://..." />
                        </label>
                        <div className="flex gap-2 items-center">
                          <input type="file" accept="image/*" onChange={handleInlineFileChange} className="border rounded p-1" />
                          <span className="text-xs text-gray-900">(JPG/PNG, max 2MB)</span>
                          {casinoPreview && <img src={casinoPreview} alt="preview" className="w-16 h-10 object-cover rounded" />}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium" disabled={loading}>Save</button>
                          <button type="button" onClick={() => setInlineEditId(null)} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 font-medium">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <img src={casino.imageUrl} alt={casino.name} className="w-24 h-12 object-cover rounded shadow" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900">{casino.name}</div>
                          <div className="text-blue-700 font-bold mb-1">Order: {casino.order || 0}</div>
                          <div className="text-xs text-gray-900 mb-1">Type: {casino.type}</div>
                          <div className="text-xs text-gray-900">Safety: {casino.safetyLevel} | Link: {casino.link}</div>
                        </div>
                        <button onClick={() => handleEditClick(casino)} className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 font-medium">Edit</button>
                        <button onClick={() => handleCasinoDelete(casino.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-medium">Delete</button>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )
      case 'pinned':
        return (
          <div className="p-8 bg-white rounded shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pinned Posts Management</h2>
            <div className="mb-4">
              <label className="block mb-1 font-bold text-gray-900">Select Board</label>
              <select
                value={boardId}
                onChange={e => { setBoardId(e.target.value); setSelectedPost(null); setPage(1); }}
                className="border-2 border-blue-600 p-2 rounded w-full font-bold text-gray-900 placeholder-gray-900 text-lg"
                style={{ minWidth: '400px', width: '100%' }}
              >
                <option value="">Select a board</option>
                {categories.flatMap(cat =>
                  cat.boards.map(board => {
                    const pinnedCount = posts.filter((p: Post) => p.boardId === board.id && p.isPinned).length
                    return (
                      <option key={board.id} value={board.id}>
                        [{cat.name}] {board.name} [{pinnedCount}]
                      </option>
                    )
                  })
                )}
              </select>
            </div>

            {boardId && (
              <>
                <div className="mb-4 flex gap-4 items-center">
                  <form onSubmit={handleSearch} className="flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by title..."
                      className="border p-2 rounded w-full font-bold text-gray-900 placeholder-gray-900"
                    />
                  </form>
                </div>

                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSortBy('createdAt');
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    }}
                    className={`px-3 py-1 rounded font-bold ${sortBy === 'createdAt' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}
                  >
                    {sortBy === 'createdAt' && sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('score');
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    }}
                    className={`px-3 py-1 rounded font-bold ${sortBy === 'score' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}
                  >
                    {sortBy === 'score' && sortOrder === 'desc' ? 'Highest Score' : 'Lowest Score'}
                  </button>
                </div>
              </>
            )}

            {loading && <div className="text-blue-700 font-bold">Loading...</div>}
            {error && <div className="text-red-700 font-bold">{error}</div>}
            
            {!selectedPost ? (
              <div className="space-y-2">
                {posts.length === 0 && boardId && <div className="text-gray-900 font-bold">No posts found.</div>}
                {posts
                  .filter((post: Post) => !post.isNotice && String(post.boardId) === String(boardId))
                  .sort((a: Post, b: Post) => {
                    if (a.isPinned === b.isPinned) {
                      // 기존 정렬(날짜, 점수 등) 유지
                      if (sortBy === 'createdAt') {
                        return sortOrder === 'desc'
                          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                      } else if (sortBy === 'score') {
                        const scoreA = (a.likes || 0) - (a.dislikes || 0)
                        const scoreB = (b.likes || 0) - (b.dislikes || 0)
                        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB
                      }
                      return 0
                    }
                    return a.isPinned ? -1 : 1 // 핀된 글이 먼저
                  })
                  .map((post: Post) => (
                    <div key={post.id} className="p-3 border rounded bg-white flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">
                          {post.isNotice && <span className="text-red-600 mr-2">[공지]</span>}
                          {post.isPinned && <span className="text-blue-600 mr-2">[고정]</span>}
                          {post.title}
                        </div>
                        <div className="text-gray-900 font-bold">작성자: {post.user?.name || 'Anonymous'}</div>
                        <div className="text-gray-900 font-bold">등록일: {new Date(post.createdAt).toLocaleDateString()}</div>
                        <div className="text-gray-900 font-bold">
                          Score: {Number(post.likes) - Number(post.dislikes)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedPost(post)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">상세</button>
                        <button 
                          onClick={() => handlePin(post, !post.isPinned)} 
                          className={`px-3 py-1 rounded ${post.isPinned ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-yellow-500`}
                        >
                          {post.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                      </div>
                    </div>
                  ))}

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      이전
                    </button>
                    <span className="px-3 py-1">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 border rounded bg-white">
                <h3 className="text-lg font-bold mb-2 text-gray-900">
                  {selectedPost.isNotice && <span className="text-red-600 mr-2">[공지]</span>}
                  {selectedPost.isPinned && <span className="text-blue-600 mr-2">[고정]</span>}
                  {selectedPost.title}
                </h3>
                <div className="mb-2 text-gray-900 whitespace-pre-line">{selectedPost.content}</div>
                <div className="mb-2 text-gray-900 font-bold">작성자: {selectedPost.user?.name || 'Anonymous'}</div>
                <div className="text-gray-900 font-bold">등록일: {new Date(selectedPost.createdAt).toLocaleDateString()}</div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handlePin(selectedPost, !selectedPost.isPinned)} className={`px-3 py-1 rounded ${selectedPost.isPinned ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-900'} hover:bg-yellow-600`}>{selectedPost.isPinned ? 'Unpin' : 'Pin'}</button>
                  <button onClick={() => handleDelete(selectedPost)} className="px-3 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-700">삭제</button>
                  <button onClick={() => setSelectedPost(null)} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500">목록</button>
                </div>
              </div>
            )}
          </div>
        )
      case 'notice':
        return (
          <div className="p-8 bg-white rounded shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Notice Management</h2>
            <div className="mb-4">
              <label className="block mb-1 font-bold text-gray-900">Select Board</label>
              <select
                value={boardId}
                onChange={e => { setBoardId(e.target.value); setSelectedPost(null); setPage(1); }}
                className="border-2 border-blue-600 p-2 rounded w-full font-bold text-gray-900 placeholder-gray-900 text-lg"
                style={{ minWidth: '400px', width: '100%' }}
              >
                <option value="">Select a board</option>
                {categories.flatMap(cat =>
                  cat.boards.map(board => {
                    const noticeCount = posts.filter((p: Post) => p.boardId === board.id && p.isNotice).length
                    return (
                      <option key={board.id} value={board.id}>
                        [{cat.name}] {board.name} [{noticeCount}]
                      </option>
                    )
                  })
                )}
              </select>
            </div>

            {boardId && (
              <>
                <div className="mb-4 flex gap-4 items-center">
                  <form onSubmit={handleSearch} className="flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by title..."
                      className="border p-2 rounded w-full font-bold text-gray-900 placeholder-gray-900"
                    />
                  </form>
                </div>

                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSortBy('createdAt');
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    }}
                    className={`px-3 py-1 rounded font-bold ${sortBy === 'createdAt' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}
                  >
                    {sortBy === 'createdAt' && sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                  </button>
                </div>
              </>
            )}

            {loading && <div className="text-blue-700 font-bold">Loading...</div>}
            {error && <div className="text-red-700 font-bold">{error}</div>}
            
            {!selectedPost ? (
              <div className="space-y-2">
                {posts.length === 0 && boardId && <div className="text-gray-900 font-bold">No posts found.</div>}
                {posts
                  .filter((post: Post) => post.isNotice && String(post.boardId) === String(boardId))
                  .sort((a: Post, b: Post) => {
                    if (sortBy === 'createdAt') {
                      return sortOrder === 'desc'
                        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    } else if (sortBy === 'score') {
                      const scoreA = (a.likes || 0) - (a.dislikes || 0)
                      const scoreB = (b.likes || 0) - (b.dislikes || 0)
                      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB
                    }
                    return 0
                  })
                  .map((post: Post) => (
                    <div key={post.id} className="p-3 border rounded bg-white flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">
                          {post.isNotice && <span className="text-red-600 mr-2">[Notice]</span>}
                          {post.title}
                        </div>
                        <div className="text-gray-900 font-bold">Author: {post.user?.name || 'Anonymous'}</div>
                        <div className="text-gray-900 font-bold">Date: {new Date(post.createdAt).toLocaleDateString()}</div>
                        <div className="text-gray-900 font-bold">
                          Score: {Number(post.likes) - Number(post.dislikes)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedPost(post)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">Detail</button>
                        <button onClick={() => handleDelete(post)} className="px-3 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-700">Delete</button>
                      </div>
                    </div>
                  ))}

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-gray-300 text-gray-900 rounded disabled:opacity-50 font-bold"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 text-gray-900 font-bold">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 bg-gray-300 text-gray-900 rounded disabled:opacity-50 font-bold"
                    >
                      Next
                    </button>
                  </div>
                )}

                <div className="mt-4">
                  <button onClick={() => setShowNoticeForm(true)} className="bg-blue-700 text-white px-4 py-2 rounded font-bold hover:bg-blue-800">Add Notice</button>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded bg-white">
                <h3 className="text-lg font-bold mb-2 text-gray-900">
                  {selectedPost.isNotice && <span className="text-red-600 mr-2">[Notice]</span>}
                  {selectedPost.title}
                </h3>
                <div className="mb-2 text-gray-900 whitespace-pre-line font-bold">{selectedPost.content}</div>
                <div className="mb-2 text-gray-900 font-bold">Author: {selectedPost.user?.name || 'Anonymous'}</div>
                <div className="text-gray-900 font-bold">Date: {new Date(selectedPost.createdAt).toLocaleDateString()}</div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleDelete(selectedPost)} className="px-3 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-700">Delete</button>
                  <button onClick={() => setSelectedPost(null)} className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-900 font-bold">Back to List</button>
                </div>
              </div>
            )}

            {showNoticeForm && (
              <div className="mt-4 p-4 border rounded bg-white">
                <h3 className="text-lg font-bold mb-2 text-gray-900">Add Notice</h3>
                <NoticeForm
                  categories={categories}
                  onCancel={() => setShowNoticeForm(false)}
                  onSave={async () => {
                    const res = await fetch('/api/posts?isNotice=1&includeBoard=1', { cache: 'no-store' });
                    const data = await res.json();
                    setPosts((data.posts || []).filter((p: any) => p.isNotice));
                    alert('Notice added');
                    setShowNoticeForm(false);
                  }}
                />
              </div>
            )}
          </div>
        )
      case 'users':
        return (
          <div className="p-8 bg-white rounded shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
            <UserManager />
          </div>
        )
      case 'onlinecasinos':
        return (
          <div className="p-8 bg-white rounded shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Online Casinos Management</h2>
            <div className="mb-4 text-sm text-gray-900 font-semibold">
              <div>• Manage all Online Casinos here. You can add, edit, or delete casinos.</div>
              <div className="mt-1 text-xs text-gray-900">All information is managed in real time.</div>
            </div>
            <OnlineCasinosAdminUI />
          </div>
        )
      default:
        return <div className="text-gray-900">Coming soon...</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-center">
        <div className="w-full max-w-6xl mx-auto flex">
          <aside className="w-80 min-w-80 max-w-80 flex-shrink-0 min-h-screen bg-white border-r">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Admin Menu</h2>
            </div>
            <nav className="p-2">
              <button
                onClick={() => { resetAdminStates(); setActiveMenu('onlinecasinos'); }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'onlinecasinos' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Online Casinos
              </button>
              <button
                onClick={() => { resetAdminStates(); setActiveMenu('notice'); }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'notice' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Notice
              </button>
              <button
                onClick={() => { resetAdminStates(); setActiveMenu('pinned'); }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'pinned' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Pinned Posts
              </button>
              <button
                onClick={() => { resetAdminStates(); setActiveMenu('users'); }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'users' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Users
              </button>
              <button
                onClick={() => { resetAdminStates(); setActiveMenu('category'); }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'category' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Category
              </button>
              <button
                onClick={() => { resetAdminStates(); setActiveMenu('board'); }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'board' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Board
              </button>
              <button
                onClick={() => { resetAdminStates(); setActiveMenu('banner'); }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'banner' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Main Banner
              </button>
              <button
                onClick={() => { resetAdminStates(); setActiveMenu('casino'); }}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'casino' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Casino Banner
              </button>
              {/* Online Casinos 관리 메뉴 */}
              <button
                onClick={() => window.location.href = '/admin/online-casinos'}
                className="w-full text-left px-4 py-3 rounded-lg mb-1 bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-colors border border-blue-700"
              >
                Online Casinos 관리
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full text-left px-4 py-3 rounded-lg mt-4 bg-red-50 text-red-600 font-semibold hover:bg-red-100"
              >
                Logout
              </button>
            </nav>
          </aside>
          <main className="flex-1 p-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}
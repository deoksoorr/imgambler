"use client"

import React from 'react'
import { useState, useEffect, ChangeEvent } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AuthButtons from '@/components/AuthButtons'
import BannerManager from '@/components/BannerManager'

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
  id: number
  title: string
  content: string
  postKey: string
  isNotice: boolean
  isPinned: boolean
  createdAt: string
  user?: {
    name: string | null
  }
  board?: {
    id: number
    name: string
  }
  imageUrl?: string
}

type AdminMenu = 'notice' | 'posts' | 'users' | 'category' | 'board' | 'banner' | 'casino'

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

function CategoryInlineEditForm({ category, onCancel, onSave }: CategoryInlineEditFormProps) {
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description || '')

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        onSave(name, description)
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
  const [sortBy, setSortBy] = useState<'createdAt' | 'title'>('createdAt')
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
      const res = await fetch(`/api/board/${getBoardSlug(boardId)}/posts?${queryParams}`)
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
    try {
      const res = await fetch(`/api/board/${getBoardSlug(boardId)}/${post.postKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('핀 상태 변경 실패')
      fetchPosts()
      if (selectedPost) setSelectedPost(null)
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
      const res = await fetch(`/api/board/${getBoardSlug(boardId)}/${post.postKey}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('삭제 실패')
      fetchPosts()
      if (selectedPost) setSelectedPost(null)
    } catch (err) {
      setError('삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleNotice = async (post: any, isNotice: boolean) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/board/${getBoardSlug(boardId)}/${post.postKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isNotice }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('공지 상태 변경 실패')
      fetchPosts()
      if (selectedPost) setSelectedPost(null)
    } catch (err) {
      setError('공지 상태 변경에 실패했습니다.')
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
          className="border p-2 rounded w-full max-w-xs font-bold text-gray-900 placeholder-gray-700"
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
              onClick={() => handleSort('createdAt')}
              className={`px-3 py-1 rounded ${
                sortBy === 'createdAt' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              작성일 {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('title')}
              className={`px-3 py-1 rounded ${
                sortBy === 'title' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              제목 {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
          </div>
        </>
      )}

      {loading && <div className="text-blue-600">로딩 중...</div>}
      {error && <div className="text-red-600">{error}</div>}
      
      {!selectedPost ? (
        <div className="space-y-2">
          {posts.length === 0 && boardId && <div className="text-gray-400">게시글이 없습니다.</div>}
          {posts.map(post => (
            <div key={post.id} className="p-3 border rounded bg-white flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 truncate">
                  {post.isNotice && <span className="text-red-600 mr-2">[공지]</span>}
                  {post.isPinned && <span className="text-blue-600 mr-2">[고정]</span>}
                  {post.title}
                </div>
                <div className="text-gray-900 font-bold">작성자: {post.user?.name || 'Anonymous'}</div>
                <div className="text-gray-900 font-bold">등록일: {new Date(post.createdAt).toLocaleDateString()}</div>
              </div>
              <button onClick={() => setSelectedPost(post)} className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">상세</button>
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
            <button onClick={() => handlePin(selectedPost, !selectedPost.isPinned)} className={`px-3 py-1 rounded ${selectedPost.isPinned ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-yellow-500`}>{selectedPost.isPinned ? 'Unpin' : 'Pin'}</button>
            <button onClick={() => handleNotice(selectedPost, !selectedPost.isNotice)} className={`px-3 py-1 rounded ${selectedPost.isNotice ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-green-600`}>{selectedPost.isNotice ? '공지 해제' : '공지 등록'}</button>
            <button onClick={() => handleDelete(selectedPost)} className="px-3 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-700">삭제</button>
            <button onClick={() => setSelectedPost(null)} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500">목록</button>
          </div>
        </div>
      )}
    </div>
  )
}

function UserManager() {
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
      if (!res.ok) throw new Error('유저 목록을 불러오는데 실패했습니다.')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      setError('유저 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (!confirm(`관리자 권한을 ${currentIsAdmin ? '해제' : '부여'}하시겠습니까?`)) return
    
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentIsAdmin }),
      })
      if (!res.ok) throw new Error('권한 변경에 실패했습니다.')
      fetchUsers()
    } catch (err) {
      setError('권한 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">유저 관리</h2>
      {loading && <div className="text-blue-600">로딩 중...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="p-4 border rounded bg-white flex items-center justify-between">
            <div className="flex-1">
              <div className="font-bold text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-900">{user.email}</div>
              <div className="text-xs text-gray-900">
                가입일: {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
              className={`px-4 py-2 rounded ${
                user.isAdmin 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {user.isAdmin ? '관리자 해제' : '관리자 지정'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [newBoard, setNewBoard] = useState({ name: '', description: '', categoryId: '' })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [activeMenu, setActiveMenu] = useState<AdminMenu>('category')
  const [inlineEditingCategoryId, setInlineEditingCategoryId] = useState<number | null>(null)
  const [casinos, setCasinos] = useState<Casino[]>([])
  const [casinoForm, setCasinoForm] = useState<CasinoForm>({ name: '', imageUrl: null, safetyLevel: '', link: '', type: 'best' })
  const [casinoFile, setCasinoFile] = useState<File | null>(null)
  const [editingCasinoId, setEditingCasinoId] = useState<number | null>(null)
  const [imageUploadPending, setImageUploadPending] = useState(false)
  const [casinoPreview, setCasinoPreview] = useState<string | null>(null)
  const [casinoSlideSpeed, setCasinoSlideSpeed] = useState(4000)
  const [casinoSpeedSaved, setCasinoSpeedSaved] = useState(false)
  const [casinoTab, setCasinoTab] = useState('best')
  const [inlineEditId, setInlineEditId] = useState<number | null>(null)
  const [inlineForm, setInlineForm] = useState<{ name: string; safetyLevel: string; link: string; type: string; imageUrl?: string | null; order?: number }>({ name: '', safetyLevel: '', link: '', type: 'best', imageUrl: '', order: 0 })
  const [loading, setLoading] = useState(false)
  const [menu, setMenu] = useState<'notice' | 'posts' | 'users'>('notice')
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null)
  const [notices, setNotices] = useState<Post[]>([])
  const [selectedNotices, setSelectedNotices] = useState<Post[]>([])
  const [showNoticeForm, setShowNoticeForm] = useState(false)

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
    fetchCategories()
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
    fetchCategories()
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
      await fetch(`/api/boards/${board.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          categoryId: board.categoryId,
        }),
      })
      fetchCategories()
    } catch (error) {
      console.error('Failed to update board:', error)
    }
  }

  const handleCategoryDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      fetchCategories()
    }
  }

  const handleBoardDelete = async (id: number, slug: string) => {
    if (confirm('Are you sure you want to delete this board?')) {
      await fetch(`/api/boards/${slug}`, { method: 'DELETE' })
      fetchCategories()
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

  const filteredCasinos = casinos.filter(casino => casino.type === casinoTab);

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
      safetyLevel: casino.safetyLevel,
      link: casino.link,
      type: casino.type,
      imageUrl: casino.imageUrl,
      order: casino.order || 0
    });
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
          <div>
            <h2 className="text-xl font-bold mb-4">카테고리 관리</h2>
            <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-4">
              <input type="text" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="카테고리명" className="border p-2 rounded flex-1 font-bold text-gray-900 placeholder-gray-700" required />
              <input type="text" value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} placeholder="설명" className="border p-2 rounded flex-1 font-bold text-gray-900 placeholder-gray-700" />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingCategory ? '수정' : '추가'}</button>
            </form>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="p-3 border rounded bg-white flex items-center justify-between">
                  {inlineEditingCategoryId === cat.id ? (
                    <CategoryInlineEditForm
                      category={cat}
                      onCancel={() => setInlineEditingCategoryId(null)}
                      onSave={(name, description) => {
                        setInlineEditingCategoryId(null);
                        handleCategoryEdit({ ...cat, name, description });
                      }}
                    />
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">{cat.name}</div>
                        <div className="text-xs text-gray-900">{cat.description}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setInlineEditingCategoryId(cat.id)} className="px-3 py-1 bg-gray-200 rounded">수정</button>
                        <button onClick={() => handleCategoryDelete(cat.id)} className="px-3 py-1 bg-red-500 text-white rounded">삭제</button>
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
          <div>
            <h2 className="text-xl font-bold mb-4">게시판 관리</h2>
            <form onSubmit={handleBoardSubmit} className="flex gap-2 mb-4">
              <select value={newBoard.categoryId} onChange={e => setNewBoard({ ...newBoard, categoryId: e.target.value })} className="border p-2 rounded font-bold text-gray-900 placeholder-gray-700" required>
                <option value="">카테고리 선택</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <input type="text" value={newBoard.name} onChange={e => setNewBoard({ ...newBoard, name: e.target.value })} placeholder="게시판명" className="border p-2 rounded flex-1 font-bold text-gray-900 placeholder-gray-700" required />
              <input type="text" value={newBoard.description} onChange={e => setNewBoard({ ...newBoard, description: e.target.value })} placeholder="설명" className="border p-2 rounded flex-1 font-bold text-gray-900 placeholder-gray-700" />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingBoard ? '수정' : '추가'}</button>
            </form>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="mb-2">
                  <div className="font-bold text-gray-900 mb-1">{cat.name}</div>
                  <div className="space-y-1">
                    {cat.boards.map(board => (
                      <div key={board.id} className="p-2 border rounded bg-white flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{board.name}</div>
                          <div className="text-xs text-gray-900">{board.description}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleBoardEdit(board)} className="px-3 py-1 bg-gray-200 rounded">수정</button>
                          <button onClick={() => handleBoardDelete(board.id, board.slug)} className="px-3 py-1 bg-red-500 text-white rounded">삭제</button>
                        </div>
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
          <div>
            <h2 className="text-xl font-bold mb-4">배너 관리</h2>
            <BannerManager />
          </div>
        )
      case 'casino':
        return (
          <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
            <div className="mb-4 text-sm text-gray-900 font-semibold">
              <div>• Casino Banners are displayed in order of <span className="text-blue-700 font-bold">Order</span> (ascending).</div>
              <div>• You can set the <span className="text-blue-700 font-bold">slide speed</span> (ms) for the casino banner below. (Default: 4000ms)</div>
              <div className="mt-1 text-xs text-gray-900">Recommended image size: <span className="font-bold">270x80px</span> (JPG/PNG, max 2MB)</div>
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
      case 'notice':
        return (
          <div>
            <h2 className="text-2xl text-gray-900 mb-4">공지사항 관리</h2>
            <div className="flex gap-4 items-center mb-4">
              <input type="checkbox" checked={selectedNotices.length === notices.length && notices.length > 0} onChange={() => {
                if (selectedNotices.length === notices.length) {
                  setSelectedNotices([]);
                } else {
                  setSelectedNotices([...notices]);
                }
              }} />
              <button onClick={async () => {
                if (selectedNotices.length === 0) {
                  alert('삭제할 공지사항을 선택하세요');
                  return;
                }
                if (!confirm('정말 삭제하시겠습니까?')) return;
                for (const notice of selectedNotices) {
                  if (!notice.board || typeof notice.board.id !== 'number') {
                    alert('게시판 정보를 찾을 수 없습니다.');
                    continue;
                  }
                  const category = categories.find(cat => cat.boards.some(b => b.id === notice.board!.id));
                  const board = category?.boards.find(b => b.id === notice.board!.id);
                  if (!category || !board) {
                    alert('게시판 정보를 찾을 수 없습니다.');
                    continue;
                  }
                  const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
                  const res = await fetch(`/api/board/${categorySlug}/${board.slug}/${notice.postKey}`, { 
                    method: 'DELETE',
                    credentials: 'include'
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    alert(`삭제 실패: ${err.error || '알 수 없는 오류'}`);
                    return;
                  }
                }
                setSelectedNotices([]);
                const res = await fetch('/api/posts?isNotice=1&includeBoard=1', { cache: 'no-store' });
                const data = await res.json();
                setNotices((data.posts || []).filter((p: any) => p.isNotice));
                setTimeout(() => {
                  alert('삭제되었습니다');
                }, 0);
              }} className="bg-red-600 text-white px-4 py-2 rounded">삭제</button>
              <button onClick={() => setShowNoticeForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded">글쓰기</button>
            </div>
            <table className="w-full border rounded bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-900 text-sm">
                  <th className="p-2"><input type="checkbox" checked={selectedNotices.length === notices.length && notices.length > 0} onChange={() => {
                    if (selectedNotices.length === notices.length) {
                      setSelectedNotices([]);
                    } else {
                      setSelectedNotices([...notices]);
                    }
                  }} /></th>
                  <th className="p-2 text-gray-900">Edit</th>
                  <th className="p-2 text-gray-900">번호</th>
                  <th className="p-2 text-gray-900">이미지</th>
                  <th className="p-2 text-gray-900">게시판명</th>
                  <th className="p-2 text-gray-900">제목</th>
                  <th className="p-2 text-gray-900">등록일</th>
                </tr>
              </thead>
              <tbody>
                {notices
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((notice, idx) => (
                    <React.Fragment key={notice.id}>
                      <tr className="border-b">
                        <td className="p-2 text-center">
                          <input type="checkbox" checked={selectedNotices.some(n => n.id === notice.id)} onChange={() => {
                            if (selectedNotices.some(n => n.id === notice.id)) {
                              setSelectedNotices(selectedNotices.filter(n => n.id !== notice.id));
                            } else {
                              setSelectedNotices([...selectedNotices, notice]);
                            }
                          }} />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => setEditingNoticeId(notice.id)}
                            className="px-4 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                        <td className="p-2 text-center text-gray-900">{notices.length - idx}</td>
                        <td className="p-2 text-center text-gray-900">{
                          typeof window !== 'undefined' && notice.imageUrl && (
                            <img src={notice.imageUrl} alt="첨부 이미지" className="w-12 h-8 object-cover rounded border mx-auto" />
                          )
                        }</td>
                        <td className="p-2 text-center text-gray-900">{notice.board?.name || '-'}</td>
                        <td className="p-2 text-gray-900">{notice.title}</td>
                        <td className="p-2 text-center text-gray-900">{new Date(notice.createdAt).toLocaleDateString()}</td>
                      </tr>
                      {editingNoticeId === notice.id && (
                        <tr>
                          <td colSpan={7} className="bg-gray-50">
                            <NoticeForm
                              categories={categories}
                              initialData={notice}
                              onCancel={() => setEditingNoticeId(null)}
                              onSave={async () => {
                                setEditingNoticeId(null);
                                const res = await fetch('/api/posts?isNotice=1&includeBoard=1', { cache: 'no-store' });
                                const data = await res.json();
                                setNotices((data.posts || []).filter((p: any) => p.isNotice));
                                alert('등록되었습니다');
                                setShowNoticeForm(false);
                              }}
                            />
                            {// 기존 이미지 미리보기 항상 노출
                            notice.imageUrl && (
                              <div className="mt-4 flex items-center gap-2">
                                <span className="text-gray-900">기존 이미지:</span>
                                <img src={notice.imageUrl} alt="첨부 이미지" className="w-32 h-20 object-cover rounded border" />
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
            {showNoticeForm && (
              <div className="mt-4 p-4 border rounded bg-white">
                <h3 className="text-lg font-bold mb-2">공지사항 등록</h3>
                <NoticeForm
                  categories={categories}
                  onCancel={() => setShowNoticeForm(false)}
                  onSave={async () => {
                    const res = await fetch('/api/posts?isNotice=1&includeBoard=1', { cache: 'no-store' });
                    const data = await res.json();
                    setNotices((data.posts || []).filter((p: any) => p.isNotice));
                    alert('등록되었습니다');
                    setShowNoticeForm(false);
                  }}
                />
              </div>
            )}
          </div>
        )
      default:
        return <div className="text-gray-900">Coming soon...</div>
    }
  }

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
                onClick={() => setActiveMenu('notice')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'notice' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Notice
              </button>
              <button
                onClick={() => setActiveMenu('posts')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'posts' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveMenu('users')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'users' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveMenu('category')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'category' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Category
              </button>
              <button
                onClick={() => setActiveMenu('board')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'board' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Board
              </button>
              <button
                onClick={() => setActiveMenu('banner')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'banner' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Main Banner
              </button>
              <button
                onClick={() => setActiveMenu('casino')}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 ${activeMenu === 'casino' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Casino Banner
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
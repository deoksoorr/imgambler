'use client'

import React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { FaThumbtack, FaCrown } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type Post = {
  id: number
  title: string
  userCode: string
  createdAt: string
  views: number
  isPinned: boolean
  isNotice: boolean
  likes: number
  dislikes: number
  commentsCount: number
  userImage?: string | null
  userName?: string | null
  postKey: string
  board: {
    slug: string
    category: {
      name: string
    }
  }
}

type PostListProps = {
  initialPosts: Post[]
  currentUserName?: string | null
}

// 유틸리티 함수들
const getAvatarElement = (post: Post) => {
  if (post.isNotice) {
    return <FaCrown className="text-yellow-500 w-5 h-5 inline-block mr-1" title="Manager" />
  }
  return (
    <img
      className="h-8 w-8 rounded-full object-cover"
      src={post.userImage || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.userCode}`}
      alt={post.userName || 'User'}
      width={32}
      height={32}
      style={{ minWidth: 32, minHeight: 32 }}
    />
  )
}

const getAvatarUrl = (post: Post) => 
  post.userImage || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.userCode}`

const getNumber = (idx: number, tab: 'all' | 'hot', hotPosts: Post[], filteredNormalPosts: Post[], startIndex: number) => {
  if (tab === 'hot') {
    return hotPosts.length - idx
  }
  return filteredNormalPosts.length - (startIndex + idx)
}

// 공지사항 목록 컴포넌트
const NoticeList = ({ posts }: { posts: Post[] }) => {
  if (posts.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">공지사항</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50" data-testid="post-row">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/posts/${post.postKey}`} className="text-blue-600 hover:text-blue-800">
                    [공지] {post.title}
                    {post.commentsCount > 0 && (
                      <span className="ml-2 text-sm text-blue-600 font-bold">[{post.commentsCount}]</span>
                    )}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getAvatarElement(post)}
                    <span className="ml-2 text-sm text-gray-900">{post.isNotice ? 'Manager' : (post.userName ?? 'Anonymous')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.views}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 고정글 목록 컴포넌트
const PinnedList = ({ posts }: { posts: Post[] }) => {
  if (posts.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">고정글</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50" data-testid="post-row">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/posts/${post.postKey}`} className="text-blue-600 hover:text-blue-800">
                    [고정] {post.title}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getAvatarElement(post)}
                    <span className="ml-2 text-sm text-gray-900">{post.isNotice ? 'Manager' : (post.userName ?? 'Anonymous')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.views}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 일반글 목록 컴포넌트
const NormalList = ({ 
  posts, 
  currentPage, 
  totalPages, 
  onPageChange,
  tab,
  hotPosts,
  filteredNormalPosts,
  startIndex
}: { 
  posts: Post[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  tab: 'all' | 'hot'
  hotPosts: Post[]
  filteredNormalPosts: Post[]
  startIndex: number
}) => {
  return (
    <div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post, idx) => (
              <tr key={post.id} className="hover:bg-gray-50" data-testid="post-row">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getNumber(idx, tab, hotPosts, filteredNormalPosts, startIndex)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/posts/${post.postKey}`} className="text-blue-600 hover:text-blue-800">
                    {post.title}
                  </Link>
                  {post.commentsCount > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      [{post.commentsCount}]
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getAvatarElement(post)}
                    <span className="ml-2 text-sm text-gray-900">{post.isNotice ? 'Manager' : (post.userName ?? 'Anonymous')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.views}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

export default function PostList({ initialPosts, currentUserName }: PostListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 10
  const [sort, setSort] = useState<'newest' | 'oldest' | 'views'>('newest')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'hot'>('all')
  const router = useRouter()
  const { data: session } = useSession()

  // 공지사항, 고정글, 일반글 분리 (메모이제이션)
  const { noticePosts, pinnedPosts, normalPosts } = useMemo(() => ({
    noticePosts: initialPosts.filter(post => post.isNotice),
    pinnedPosts: initialPosts.filter(post => post.isPinned && !post.isNotice),
    normalPosts: initialPosts.filter(post => !post.isNotice && !post.isPinned)
  }), [initialPosts])

  // 정렬된 일반글 (메모이제이션)
  const sortedNormalPosts = useMemo(() => {
    return [...normalPosts].sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === 'views') return b.views - a.views
      return 0
    })
  }, [normalPosts, sort])

  // 검색어가 포함된 일반글만 필터링 (메모이제이션)
  const filteredNormalPosts = useMemo(() => {
    return sortedNormalPosts.filter(post =>
      post.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [sortedNormalPosts, search])

  // 페이지네이션 적용 (메모이제이션)
  const { totalPages, currentNormalPosts, startIndex } = useMemo(() => {
    const totalPages = Math.ceil(filteredNormalPosts.length / postsPerPage)
    const startIndex = (currentPage - 1) * postsPerPage
    const endIndex = startIndex + postsPerPage
    const currentNormalPosts = filteredNormalPosts.slice(startIndex, endIndex)
    return { totalPages, currentNormalPosts, startIndex }
  }, [filteredNormalPosts, currentPage, postsPerPage])

  // Hot 게시글: score 내림차순, 상위 10%만 (메모이제이션)
  const hotPosts = useMemo(() => {
    const allNormalPosts = [...normalPosts]
    const sortedByScore = allNormalPosts.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
    const hotCount = Math.max(1, Math.ceil(sortedByScore.length * 0.1))
    const cutoffScore = sortedByScore[hotCount - 1]
      ? sortedByScore[hotCount - 1].likes - sortedByScore[hotCount - 1].dislikes
      : 0
    return sortedByScore.filter(post => (post.likes - post.dislikes) >= cutoffScore)
  }, [normalPosts])

  // 탭에 따라 보여줄 일반글 (메모이제이션)
  const displayNormalPosts = useMemo(() => 
    tab === 'hot' ? hotPosts : currentNormalPosts, 
    [tab, hotPosts, currentNormalPosts]
  )

  const handleDelete = async (post: Post) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/board/${post.board?.category?.name.toLowerCase().replace(/\s+/g, '-')}/${post.board?.slug}/${post.postKey}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('게시글 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('게시글 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 rounded ${
              tab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            전체글
          </button>
          <button
            onClick={() => setTab('hot')}
            className={`px-4 py-2 rounded ${
              tab === 'hot' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            인기글
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'oldest' | 'views')}
            className="border rounded px-2 py-1"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="views">조회순</option>
          </select>
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      <NoticeList posts={noticePosts} />
      <PinnedList posts={pinnedPosts} />
      <NormalList 
        posts={displayNormalPosts}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        tab={tab}
        hotPosts={hotPosts}
        filteredNormalPosts={filteredNormalPosts}
        startIndex={startIndex}
      />
    </div>
  )
} 
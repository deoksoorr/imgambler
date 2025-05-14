"use client"
import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { FaCrown, FaThumbtack } from 'react-icons/fa'
import PostList from '@/components/PostList'
import { useRouter, usePathname } from 'next/navigation'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })
}

function getScoreColor(score: number) {
  if (score > 0) return 'text-red-600 font-bold'
  if (score < 0) return 'text-blue-700 font-bold'
  return 'text-gray-900 font-bold'
}

function getProfileImg(post: any) {
  if (post.isNotice) {
    return <FaCrown className="text-yellow-500 w-6 h-6" title="Manager" />
  }
  return post.user?.image || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.userCode || 'user'}`
}

export default function BoardClient({ initialPosts, currentUserName, categorySlug, boardSlug, boardName, boardDescription }: any) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'views'>('newest')
  const noticePosts = initialPosts.filter((p: any) => p.isNotice)
  const pinnedPosts = initialPosts.filter((p: any) => p.isPinned && !p.isNotice)
  const normalPosts = initialPosts.filter((p: any) => !p.isNotice && !p.isPinned)

  useEffect(() => {
    router.refresh()
  }, [pathname])

  // 정렬
  const sortedNormalPosts = useMemo(() => {
    return [...normalPosts].sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === 'views') return b.views - a.views
      return 0
    })
  }, [normalPosts, sort])

  // 검색
  const filteredNormalPosts = useMemo(() => {
    return sortedNormalPosts.filter((post: any) =>
      post.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [sortedNormalPosts, search])

  // 페이지네이션 관련 상태 (검색 이후에 선언)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.ceil(filteredNormalPosts.length / pageSize)
  const pagedNormalPosts = filteredNormalPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // score 계산 함수
  const getScore = (post: any) => (post.likes || 0) - (post.dislikes || 0)

  // 링크 생성 함수
  const getPostLink = (postKey: string) => `/board/${categorySlug}/${boardSlug}/${postKey}`

  // 페이지/검색/정렬 변경 시 1페이지로 이동
  useEffect(() => { setCurrentPage(1) }, [search, sort])

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{boardName}</h1>
            {boardDescription && <div className="text-gray-500 text-base mt-1">{boardDescription}</div>}
          </div>
          <Link href={`/board/${categorySlug}/${boardSlug}/write`} className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 transition font-bold border border-blue-900">글쓰기</Link>
        </div>
        {/* 검색/정렬 UI: 우측 정렬, 검색창 넓이 증가 */}
        <div className="flex gap-2 mt-4 items-center justify-end">
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-400 text-gray-800 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            style={{ minWidth: 260 }}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as any)}
            className="border border-gray-400 text-gray-800 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="views">조회순</option>
          </select>
        </div>
      </div>
      {/* 테이블: 기존 디자인/강조/hover/버튼 등 유지 */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-12 border border-gray-300">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase min-w-[60px] max-w-[80px]">번호</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase w-full max-w-0">제목</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase min-w-[120px] max-w-[160px]">작성자</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase min-w-[120px] max-w-[160px]">작성일</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase">조회</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase">Score</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* 공지 */}
            {noticePosts.map((post: any) => (
              <tr key={post.id} className="bg-yellow-300 font-bold">
                <td className="px-4 py-3 text-center text-yellow-900"><FaCrown className="inline text-yellow-600 text-lg" title="공지" /></td>
                <td className="px-4 py-3 w-full max-w-0">
                  <Link href={getPostLink(post.postKey)} className="block truncate w-full text-yellow-900 hover:underline">
                    {post.title}
                    {post.commentsCount > 0 && (
                      <span className="ml-2 text-sm text-blue-600 font-bold">[{post.commentsCount}]</span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-yellow-900 flex items-center gap-2">
                  {getProfileImg(post)}
                  Manager
                </td>
                <td className="px-4 py-3 text-yellow-900">{formatDate(post.createdAt)}</td>
                <td className="px-4 py-3 text-yellow-900">{post.views}</td>
                <td className={`px-4 py-3 ${getScoreColor(getScore(post))}`}>{getScore(post)}</td>
              </tr>
            ))}
            {/* 고정글 */}
            {pinnedPosts.map((post: any) => (
              <tr key={post.id} className="bg-blue-50">
                <td className="px-4 py-3 text-center text-blue-700 font-bold"><FaThumbtack className="inline text-blue-700 text-lg" title="고정" /></td>
                <td className="px-4 py-3 w-full max-w-0">
                  <Link href={getPostLink(post.postKey)} className="block truncate w-full text-blue-800 hover:underline font-bold">
                    {post.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-900 flex items-center gap-2">
                  <img src={getProfileImg(post)} alt="profile" className="w-6 h-6 rounded-full object-cover" />
                  {post.user?.name || '익명'}
                </td>
                <td className="px-4 py-3 text-gray-900">{formatDate(post.createdAt)}</td>
                <td className="px-4 py-3 text-gray-900">{post.views}</td>
                <td className={`px-4 py-3 ${getScoreColor(getScore(post))}`}>{getScore(post)}</td>
              </tr>
            ))}
            {/* 일반글 */}
            {pagedNormalPosts.map((post: any, idx: number) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-center text-gray-800 min-w-[60px] max-w-[80px]">{filteredNormalPosts.length - ((currentPage - 1) * pageSize + idx)}</td>
                <td className="px-4 py-3 w-full max-w-0">
                  <Link href={getPostLink(post.postKey)} className="block truncate w-full text-gray-900 hover:underline">
                    {post.title}
                    {post.commentsCount > 0 && (
                      <span className="ml-2 text-sm text-blue-600 font-bold">[{post.commentsCount}]</span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 min-w-[120px] max-w-[160px] text-gray-900 flex items-center gap-2">
                  {post.isNotice ? (
                    <FaCrown className="text-yellow-500 w-6 h-6" title="Manager" />
                  ) : (
                    <img
                      src={post.user?.image || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.userCode || 'user'}`}
                      alt="profile"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  {post.isNotice ? 'Manager' : (post.user?.name || '익명')}
                </td>
                <td className="px-4 py-3 min-w-[120px] max-w-[160px] text-gray-900">{formatDate(post.createdAt)}</td>
                <td className="px-4 py-3 min-w-[80px] max-w-[80px] text-gray-900">{post.views}</td>
                <td className={`px-4 py-3 ${getScoreColor(getScore(post))}`}>{getScore(post)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 페이지네이션 */}
      <div className="flex justify-center mt-8 mb-12">
        {/* 페이지네이션: 10개씩, 현재페이지 currentPage, 전체페이지 totalPages */}
        {totalPages > 1 && (
          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all
                  ${page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 font-bold'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              >
                {page}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
} 
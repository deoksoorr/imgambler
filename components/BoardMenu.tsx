"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import React from 'react'

export default function BoardMenu() {
  const [boards, setBoards] = useState<any[]>([])

  // fetchBoards 함수 분리
  const fetchBoards = async () => {
    const res = await fetch('/api/categories')
    if (!res.ok) return setBoards([])
    let data = []
    try {
      data = await res.json()
    } catch {
      data = []
    }
    if (Array.isArray(data)) {
      const allBoards = data.flatMap((cat: any) =>
        (cat.boards || []).map((board: any) => ({
          ...board,
          categorySlug: cat.name.toLowerCase().replace(/\s+/g, '-')
        }))
      )
      setBoards(allBoards)
    } else {
      setBoards([])
    }
  }

  useEffect(() => {
    fetchBoards()
    // 커스텀 이벤트 리스너 등록
    const handler = () => fetchBoards()
    window.addEventListener('refreshBoardMenu', handler)
    return () => window.removeEventListener('refreshBoardMenu', handler)
  }, [])

  return (
    <nav className="flex flex-wrap items-center gap-x-0 gap-y-2 w-full min-h-[48px]">
      {/* Online Casinos 메뉴 - 항상 가장 왼쪽, 강조 */}
      <Link
        href="/online-casinos"
        className="px-5 py-2 rounded-lg bg-[#f49c24] text-white font-bold shadow hover:bg-[#e08c1a] transition-colors border border-[#e08c1a] mr-4"
        style={{ minWidth: 160, textAlign: 'center' }}
      >
        Online Casinos
      </Link>
      {/* 나머지 게시판 메뉴 - 한 줄, 많아지면 두 줄로 줄바꿈 */}
      <div className="flex flex-wrap items-center gap-x-0 gap-y-2 flex-1">
        {boards.map((board, idx) => (
          <React.Fragment key={board.id}>
            <Link
              href={`/board/${board.categorySlug}/${board.slug}`}
              className="px-4 py-2 font-bold text-gray-900 hover:text-blue-600 relative group transition-colors"
              style={{ display: 'inline-block' }}
            >
              <span className="relative z-10">{board.name}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {idx < boards.length - 1 && (
              <span className="text-gray-400 mx-2 select-none font-bold" key={`divider-${board.id}`}>|</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  )
} 
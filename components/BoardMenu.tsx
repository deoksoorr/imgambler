"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

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
    <nav className="flex flex-row gap-0 items-center w-full">
      {boards.map((board, idx) => (
        <>
          <Link
            key={board.id}
            href={`/board/${board.categorySlug}/${board.slug}`}
            className="px-4 py-2 font-semibold text-gray-800 hover:text-blue-600 relative group transition-colors"
            style={{ display: 'inline-block' }}
          >
            <span className="relative z-10">{board.name}</span>
            <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </Link>
          {idx < boards.length - 1 && (
            <span className="text-gray-300 mx-1 select-none">|</span>
          )}
        </>
      ))}
    </nav>
  )
} 